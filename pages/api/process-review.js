// pages/api/process-review.js
import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument } from "pdf-lib";
import { HAIST_SYSTEM_PROMPT, getQuickLookPrompt, getFullReviewPrompt } from "./haist-prompt.js";

export const config = {
  maxDuration: 300, // Vercel function max (5 min)
  api: { bodyParser: { sizeLimit: "50mb" } }, // Support full dissertations (100-300 pages)
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripDataUrlPrefix(fileContent) {
  if (!fileContent) return "";
  if (fileContent.includes("base64,")) return fileContent.split("base64,")[1];
  return fileContent;
}

function isPdfFileName(name = "") {
  return String(name).toLowerCase().endsWith(".pdf");
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
  // Larger chunks = fewer API calls = faster processing
  // With parallel processing, we can handle bigger chunks efficiently
  const t = String(documentType).toLowerCase();
  if (t.includes("proposal")) return 20; // proposals are smaller
  return 25; // dissertations: larger chunks for speed
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

  // NOTE: This prompt explicitly ALLOWS page citations (p. X),
  // since you said you want page-numbered feedback.
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
  // Use appropriate prompt based on review type
  if (reviewType === "quicklook") {
    return getQuickLookPrompt(documentType);
  }
  return getFullReviewPrompt(documentType);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const {
      action,
      fileContent,
      fileName,
      documentType = "full",
      reviewType = "full", // QuickLook or Full Review
      startPage,
      endPage,
      totalPages: totalPagesFromClient,
      chunkNotes,
    } = req.body || {};

    if (!fileContent || !fileName) {
      return res.status(400).json({ error: "Missing file content or name" });
    }
    if (!isPdfFileName(fileName)) {
      return res.status(400).json({ error: "PDF only during beta" });
    }

    const base64Data = stripDataUrlPrefix(fileContent);

    // If no action specified, run complete single-call workflow
    if (!action) {
      console.log(`🔄 Starting complete review workflow for ${fileName} (${reviewType})`);

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      // 1. Get total pages and plan chunks
      const pdfBytes = Buffer.from(base64Data, "base64");
      const srcDoc = await PDFDocument.load(pdfBytes);
      const totalPages = srcDoc.getPageCount();
      const chunkSizePages = chunkSizeFor(documentType);
      const chunks = buildChunkPlan(totalPages, chunkSizePages);

      console.log(`📄 Document: ${totalPages} pages → ${chunks.length} chunks of ${chunkSizePages} pages`);

      // 2. Process chunks in batches to respect rate limits (30k tokens/min)
      // Process 2 chunks at a time to stay under Anthropic rate limit
      console.log(`🚀 Processing chunks in batches of 2...`);

      const BATCH_SIZE = 2;
      const allChunkNotes = [];

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);

        const batchPromises = batch.map(async (chunk, batchIndex) => {
          const chunkB64 = await extractPdfPagesBase64(base64Data, chunk.startPage, chunk.endPage);
          const prompt = chunkPrompt({
            documentType,
            startPage: chunk.startPage,
            endPage: chunk.endPage,
            totalPages,
          });

          // Reduce max_tokens for QuickLook to speed up processing
          const maxTokens = reviewType === "quicklook" ? 1200 : 1800;

          const msg = await callWithBackoff(
            () =>
              anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: maxTokens,
                temperature: 0.3,
                system: HAIST_SYSTEM_PROMPT,
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

          const globalIndex = i + batchIndex + 1;
          console.log(`✓ Chunk ${globalIndex}/${chunks.length} complete (pages ${chunk.startPage}-${chunk.endPage})`);
          return chunkText;
        });

        const batchResults = await Promise.all(batchPromises);
        allChunkNotes.push(...batchResults);

        // Add delay between batches to respect rate limits (except for last batch)
        if (i + BATCH_SIZE < chunks.length) {
          await sleep(15000); // Wait 15 seconds between batches
          console.log(`⏳ Waiting 15s before next batch to respect rate limits...`);
        }
      }

      console.log(`✅ All chunks processed, synthesizing final review (${reviewType})`);

      // 3. Synthesize final review
      // Reduce max_tokens for QuickLook (shorter output requirement)
      const synthMaxTokens = reviewType === "quicklook" ? 2000 : 3500;

      const synth = await callWithBackoff(
        () =>
          anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: synthMaxTokens,
            temperature: 0.25,
            system: HAIST_SYSTEM_PROMPT,
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

      console.log(`🎉 Review complete! Length: ${finalText.length} characters`);

      return res.status(200).json({
        ok: true,
        review: finalText,
        totalPages,
        chunksProcessed: chunks.length,
      });
    }

    // ---------- ACTION: PLAN ----------
    if (action === "plan") {
      const pdfBytes = Buffer.from(base64Data, "base64");
      const srcDoc = await PDFDocument.load(pdfBytes);
      const totalPages = srcDoc.getPageCount();

      const chunkSizePages = chunkSizeFor(documentType);
      const chunks = buildChunkPlan(totalPages, chunkSizePages);

      return res.status(200).json({
        ok: true,
        action: "plan",
        fileName,
        documentType,
        totalPages,
        chunkSizePages,
        chunks,
      });
    }

    // ---------- ACTION: CHUNK ----------
    if (action === "chunk") {
      if (!startPage || !endPage) {
        return res.status(400).json({ error: "Missing startPage/endPage for chunk action" });
      }

      // Determine totalPages: accept from client if provided, else compute
      let totalPages = Number(totalPagesFromClient);
      if (!totalPages || !Number.isFinite(totalPages)) {
        const pdfBytes = Buffer.from(base64Data, "base64");
        const srcDoc = await PDFDocument.load(pdfBytes);
        totalPages = srcDoc.getPageCount();
      }

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const chunkB64 = await extractPdfPagesBase64(base64Data, Number(startPage), Number(endPage));

      const prompt = chunkPrompt({
        documentType,
        startPage: Number(startPage),
        endPage: Number(endPage),
        totalPages,
      });

      const msg = await callWithBackoff(
        () =>
          anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1800, // keep responses tight per chunk (faster & cheaper)
            temperature: 0.3,
            system: HAIST_SYSTEM_PROMPT,
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
                  },
                  { type: "text", text: prompt },
                ],
              },
            ],
          }),
        `chunk ${startPage}-${endPage}`
      );

      const chunkText = (msg.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n\n")
        .trim();

      return res.status(200).json({
        ok: true,
        action: "chunk",
        startPage: Number(startPage),
        endPage: Number(endPage),
        notes: chunkText,
      });
    }

    // ---------- ACTION: FINAL ----------
    if (action === "final") {
      if (!Array.isArray(chunkNotes) || chunkNotes.length === 0) {
        return res.status(400).json({ error: "Missing chunkNotes[] for final action" });
      }

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const synth = await callWithBackoff(
        () =>
          anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 3500,
            temperature: 0.25,
            system: HAIST_SYSTEM_PROMPT,
            messages: [
              { role: "user", content: [{ type: "text", text: synthesisPrompt({ documentType, reviewType }) }] },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      "Here are the chunk notes to merge:\n\n" +
                      chunkNotes.map((t, i) => `--- CHUNK ${i + 1} ---\n${t}`).join("\n\n"),
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

      return res.status(200).json({
        ok: true,
        action: "final",
        review: finalText,
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    const status = err?.status || err?.response?.status;
    const message = err?.message || String(err);

    // Let the UI show a clean message, but keep details in logs
    console.error("process-review error:", status, message);

    // If Anthropic returns a structured JSON-ish message, pass it through safely
    return res.status(status || 500).json({
      error: "Request failed",
      status: status || 500,
      message,
    });
  }
}
