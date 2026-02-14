// pages/api/process-review.js
import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument } from "pdf-lib";
import { HAIST_SYSTEM_PROMPT } from "./haist-prompt.js";

export const config = {
  maxDuration: 300, // Vercel function max (5 min)
  api: { bodyParser: { sizeLimit: "10mb" } },
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
  // Keep each chunk small enough to run comfortably under Vercel timeout.
  // You can tune these.
  const t = String(documentType).toLowerCase();
  if (t.includes("proposal")) return 12; // proposals are smaller, but this keeps it snappy
  return 15; // dissertations: safer on Vercel
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

function synthesisPrompt({ documentType }) {
  const mode = documentType || "full";
  return `
You will receive multiple chunk-level notes from a dissertation/proposal review.

Task:
1) Merge duplicates and contradictions.
2) Produce a single cohesive HAIST-style review aligned to "${mode}".
3) Keep page citations (p. X) when available. If a point appears in multiple chunks, keep the most relevant citation(s).
4) Tone: professional, clean, committee-ready (minimalist academic).

Output format:
- Title (one line)
- Executive Summary (6–10 bullets, highest priority first)
- Strengths (grouped)
- Priority Revisions (Critical / High / Medium)
- Chapter-by-Chapter Guidance (if possible)
- “Quick Fix Checklist” (checkbox bullets)
- “Defense/Submission Readiness” (1 short paragraph)

Constraints:
- Do not mention chunking, token limits, or API constraints.
- Do not include implementation details about the system.
`.trim();
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
      action = "plan",
      fileContent,
      fileName,
      documentType = "full",
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
              { role: "user", content: [{ type: "text", text: synthesisPrompt({ documentType }) }] },
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
