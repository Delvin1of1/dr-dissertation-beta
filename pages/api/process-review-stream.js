// pages/api/process-review-stream.js
import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument } from "pdf-lib";
import { HAIST_SYSTEM_PROMPT, getQuickLookPrompt, getFullReviewPrompt } from "./haist-prompt.js";

export const config = {
  maxDuration: 300,
  api: { bodyParser: { sizeLimit: "50mb" } },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripDataUrlPrefix(fileContent) {
  if (!fileContent) return "";
  if (fileContent.includes("base64,")) return fileContent.split("base64,")[1];
  return fileContent;
}

function isRetryableAnthropicError(err) {
  const status = err?.status || err?.response?.status;
  const msg = (err?.message || "").toLowerCase();
  return (
    status === 429 ||
    status === 529 ||
    msg.includes("rate_limit") ||
    msg.includes("overloaded") ||
    msg.includes("too many") ||
    msg.includes("try again")
  );
}

async function callWithBackoff(fn, label = "anthropic", maxAttempts = 6) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      const status = err?.status || err?.response?.status;
      const msg = err?.message || String(err);

      if (!isRetryableAnthropicError(err) || attempt >= maxAttempts) {
        console.error(`❌ ${label} failed (status ${status})`, msg);
        throw err;
      }

      const base = 1500 * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 500);
      const wait = Math.min(base + jitter, 20000);

      console.warn(
        `⚠️ ${label} retrying (attempt ${attempt}/${maxAttempts}) in ${wait}ms | status=${status}`
      );
      await sleep(wait);
    }
  }
}

function chunkSizeFor(documentType = "full") {
  // Use very small chunks to stay under 30k tokens/min rate limit
  // Each page is ~1000-1500 tokens, so 10 pages = ~10-15k tokens per request
  const t = String(documentType).toLowerCase();
  if (t.includes("proposal")) return 10;
  return 10; // Small chunks to respect tight rate limits
}

function buildChunkPlan(totalPages, chunkSizePages) {
  const chunks = [];
  let chunkIndex = 0;
  for (let start = 1; start <= totalPages; start += chunkSizePages) {
    const end = Math.min(start + chunkSizePages - 1, totalPages);
    chunkIndex += 1;
    chunks.push({
      index: chunkIndex,
      startPage: start,
      endPage: end,
    });
  }
  return chunks;
}

async function extractPdfPagesBase64(base64Pdf, startPage, endPage) {
  const pdfBytes = Buffer.from(base64Pdf, "base64");
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();

  const safeStart = Math.max(1, Math.min(startPage, totalPages));
  const safeEnd = Math.max(safeStart, Math.min(endPage, totalPages));

  const newDoc = await PDFDocument.create();
  const pageIndices = [];
  for (let p = safeStart; p <= safeEnd; p++) pageIndices.push(p - 1);

  const copied = await newDoc.copyPages(srcDoc, pageIndices);
  copied.forEach((p) => newDoc.addPage(p));

  const chunkBytes = await newDoc.save();
  return Buffer.from(chunkBytes).toString("base64");
}

function chunkPrompt({ documentType, startPage, endPage, totalPages }) {
  const mode = documentType || "full";
  return `
You are reviewing a dissertation/proposal in sections.

Section pages: ${startPage}-${endPage} of ${totalPages}.
Mode: ${mode}.

Return ONLY chunk-level notes for this section that will be merged later.

Requirements:
- Use concise, high-signal bullets.
- If you reference a specific issue, include page citations like (p. X). Only cite pages within ${startPage}-${endPage}.
- Prefer direct short quotes when helpful (keep quotes short).
- Organize into:
  1) Strengths (section-level)
  2) Major Issues (must-fix)
  3) Minor Issues
  4) Actionable Fixes (specific edits / rewrites / what to add)

Important:
- Do NOT produce a full document-wide review here.
- Do NOT repeat the same bullet multiple times.
`.trim();
}

function synthesisPrompt({ documentType, reviewType = "full" }) {
  if (reviewType === "quicklook") {
    return getQuickLookPrompt(documentType);
  }
  return getFullReviewPrompt(documentType);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      sendEvent({ type: "error", message: "API key not configured" });
      return res.end();
    }

    const {
      fileContent,
      fileName,
      documentType = "full",
      reviewType = "full",
    } = req.body || {};

    if (!fileContent || !fileName) {
      sendEvent({ type: "error", message: "Missing file content or name" });
      return res.end();
    }

    const base64Data = stripDataUrlPrefix(fileContent);

    sendEvent({ type: "progress", step: "Analyzing document structure...", percent: 15 });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 1. Get total pages and plan chunks
    const pdfBytes = Buffer.from(base64Data, "base64");
    const srcDoc = await PDFDocument.load(pdfBytes);
    const totalPages = srcDoc.getPageCount();
    const chunkSizePages = chunkSizeFor(documentType);
    const chunks = buildChunkPlan(totalPages, chunkSizePages);

    sendEvent({
      type: "progress",
      step: `Processing ${totalPages} pages in ${chunks.length} sections...`,
      percent: 20,
      totalChunks: chunks.length,
    });

    // 2. Process chunks sequentially to respect rate limits (30k tokens/min)
    // Sequential processing prevents rate limit errors
    const allChunkNotes = [];
    let completedChunks = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const chunkB64 = await extractPdfPagesBase64(base64Data, chunk.startPage, chunk.endPage);
      const prompt = chunkPrompt({
        documentType,
        startPage: chunk.startPage,
        endPage: chunk.endPage,
        totalPages,
      });

      const maxTokens = reviewType === "quicklook" ? 1200 : 1800;

      const msg = await callWithBackoff(
        () =>
          anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: maxTokens,
            temperature: 0.3,
            system: [
              {
                type: "text",
                text: HAIST_SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" }
              }
            ],
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "document",
                    source: {
                      type: "base64",
                      media_type: "application/pdf",
                      data: chunkB64,
                    },
                    cache_control: { type: "ephemeral" }
                  },
                  { type: "text", text: prompt },
                ],
              },
            ],
          }),
        `chunk ${chunk.startPage}-${chunk.endPage}`
      );

      const chunkText = (msg.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n\n")
        .trim();

      allChunkNotes.push(chunkText);

      completedChunks++;
      const chunkPercent = 20 + Math.floor((completedChunks / chunks.length) * 50);
      sendEvent({
        type: "progress",
        step: `Analyzed pages ${chunk.startPage}-${chunk.endPage} (${completedChunks}/${chunks.length} sections)`,
        percent: chunkPercent,
        completedChunks,
        totalChunks: chunks.length,
      });
    }

    sendEvent({
      type: "progress",
      step: "Synthesizing comprehensive review...",
      percent: 75,
    });

    // 3. Synthesize final review
    const synthMaxTokens = reviewType === "quicklook" ? 2000 : 3500;

    const synth = await callWithBackoff(
      () =>
        anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: synthMaxTokens,
          temperature: 0.25,
          system: [
            {
              type: "text",
              text: HAIST_SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" }
            }
          ],
          messages: [
            { role: "user", content: [{ type: "text", text: synthesisPrompt({ documentType, reviewType }) }] },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    "Here are the chunk notes to merge:\n\n" +
                    allChunkNotes.map((t, i) => `--- CHUNK ${i + 1} ---\n${t}`).join("\n\n"),
                },
              ],
            },
          ],
        }),
      "final synthesis"
    );

    const finalText = (synth.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();

    sendEvent({
      type: "complete",
      review: finalText,
      totalPages,
      chunksProcessed: chunks.length,
      percent: 100,
    });

    res.end();
  } catch (err) {
    const message = err?.message || String(err);
    console.error("process-review-stream error:", message);
    sendEvent({ type: "error", message });
    res.end();
  }
}
