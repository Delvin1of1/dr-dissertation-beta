// pages/api/process-review.js

import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument } from "pdf-lib";
import { getHAISTPrompt, HAIST_SYSTEM_PROMPT } from "./haist-prompt.js";

export const config = {
  maxDuration: 300, // 5 minutes
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

const MODEL = "claude-sonnet-4-20250514";
const PDF_MEDIA_TYPE = "application/pdf";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripDataUrlPrefix(fileContent) {
  if (!fileContent) return "";
  if (fileContent.includes("base64,")) return fileContent.split("base64,")[1];
  return fileContent;
}

function isRetryable(err) {
  const status = err?.status || err?.response?.status;
  const msg = String(err?.message || "").toLowerCase();
  return (
    status === 429 ||
    status === 529 ||
    msg.includes("rate_limit") ||
    msg.includes("overloaded") ||
    msg.includes("too many") ||
    msg.includes("try again")
  );
}

async function callWithBackoff(fn, label = "anthropic", maxAttempts = 7) {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;

      const status = err?.status || err?.response?.status;
      const msg = err?.message || String(err);

      if (!isRetryable(err) || attempt >= maxAttempts) {
        console.error(`❌ ${label} failed (status ${status})`, msg);
        throw err;
      }

      // exponential backoff + jitter
      const base = 1200 * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 600);
      const wait = Math.min(base + jitter, 25000);

      console.warn(
        `⚠️ ${label} retrying attempt ${attempt}/${maxAttempts} in ${wait}ms (status ${status})`
      );
      await sleep(wait);
    }
  }
}

async function chunkPdfBase64(base64Pdf, chunkSizePages = 15) {
  const pdfBytes = Buffer.from(base64Pdf, "base64");
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();

  const chunks = [];
  for (let start = 0; start < totalPages; start += chunkSizePages) {
    const endExclusive = Math.min(start + chunkSizePages, totalPages);

    const newDoc = await PDFDocument.create();
    const pageIndices = Array.from(
      { length: endExclusive - start },
      (_, i) => start + i
    );

    const copied = await newDoc.copyPages(srcDoc, pageIndices);
    copied.forEach((p) => newDoc.addPage(p));

    const chunkBytes = await newDoc.save();
    const chunkB64 = Buffer.from(chunkBytes).toString("base64");

    chunks.push({
      startPage: start + 1,
      endPage: endExclusive,
      base64: chunkB64,
    });
  }

  return { totalPages, chunks };
}

/**
 * Keep the chunk prompt SHORT (reduces input tokens),
 * but very explicit about citations + evidence.
 */
function chunkPrompt(documentType, startPage, endPage, totalPages) {
  const mode = documentType || "full";

  return `
You are reviewing ONLY this chunk of a dissertation PDF.

CHUNK PAGE RANGE: ${startPage}-${endPage} (of ${totalPages} total pages)

TASK:
- Identify the most important issues AND strongest elements visible in this chunk.
- Provide evidence-based feedback with citations using this chunk’s page numbering.

REQUIRED FORMAT (repeat as many times as needed):
- Finding:
- Evidence (short quote):
- Citation: (p. X) or (pp. X–Y)  <-- MUST be within ${startPage}-${endPage}
- Why it matters:
- Recommendation (specific fix):

Also include a short "Chunk Summary" (5–8 bullets) at the end.
`.trim();
}

/**
 * Final synthesis prompt: merges chunk notes into a committee-style report.
 * We explicitly require page citations to carry through.
 */
function synthesisPrompt(documentType, totalPages) {
  const mode = String(documentType || "full").toLowerCase();
  const isProposal = mode.includes("proposal");

  return `
You are synthesizing multiple chunk-notes into ONE final HAIST© dissertation review.

HARD REQUIREMENTS:
- Preserve and use page citations from chunk notes.
- Every major critique must include: comment + evidence quote + page citation + specific recommendation.
- Prefer concise, professional committee language (no “chunking” talk).

OUTPUT STRUCTURE:
1) Title: HAIST© Dissertation Review Report
2) Executive Summary (include top 3 “Defense Blockers” if any)
3) Overall Assessment + Overall Rating (★★★★★ scale)
4) Dimensional Analysis (${isProposal ? "7" : "10"} dimensions):
   For each:
   - Rating
   - Strengths (bullets)
   - Critical Issues (bullets with evidence + page citations)
   - Recommendations (bullets, actionable)
5) Action Plan (Prioritized checklist with “Immediate / Next 2 Weeks / Next Month”)
6) Appendix: Evidence Highlights (optional; short, not bloated)

Document length: detailed but readable; aim for professionalism over volume.
Total pages in original document: ${totalPages}.
`.trim();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { fileContent, fileName, documentType } = req.body || {};

    if (!fileContent || !fileName) {
      return res.status(400).json({ error: "Missing file content or name" });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not set");
      return res.status(500).json({ error: "API key not configured" });
    }

    const lower = String(fileName).toLowerCase();
    const isPdf = lower.endsWith(".pdf");
    if (!isPdf) {
      return res.status(400).json({
        error: "PDF only during beta",
        message: "Please upload a PDF. Word (.docx) support can be added later.",
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const base64Data = stripDataUrlPrefix(fileContent);

    // Chunk smaller to reduce input-tokens-per-minute spikes
    const { totalPages, chunks } = await chunkPdfBase64(base64Data, 15);

    console.log(`✅ PDF loaded: ${fileName} (${totalPages} pages)`);
    console.log(`✅ Chunking into ${chunks.length} chunk(s)`);

    const perChunkNotes = [];

    // Process each chunk with throttle + retries
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const label = `chunk ${i + 1}/${chunks.length} pages ${c.startPage}-${c.endPage}`;

      console.log(`➡️ Processing ${label}`);

      const prompt = chunkPrompt(documentType, c.startPage, c.endPage, totalPages);

      const chunkMessage = await callWithBackoff(
        () =>
          anthropic.messages.create({
            model: MODEL,
            max_tokens: 2200, // moderate, keeps responses consistent
            temperature: 0.25,
            system: HAIST_SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "document",
                    source: {
                      type: "base64",
                      media_type: PDF_MEDIA_TYPE,
                      data: c.base64,
                    },
                  },
                  { type: "text", text: prompt },
                ],
              },
            ],
          }),
        label
      );

      const chunkText = (chunkMessage.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n\n")
        .trim();

      perChunkNotes.push(
        `## Notes for pages ${c.startPage}-${c.endPage}\n${chunkText}`
      );

      // Pace calls to reduce 429/529 + org token/min spikes
      await sleep(4500);
    }

    console.log("🧠 Synthesizing final review from chunk notes...");

    const finalPrompt = synthesisPrompt(documentType, totalPages);

    const synthesis = await callWithBackoff(
      () =>
        anthropic.messages.create({
          model: MODEL,
          max_tokens: 6000, // allow a fuller final report
          temperature: 0.2,
          system: HAIST_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: finalPrompt },
                { type: "text", text: "REFERENCE: HAIST rubric + required format:" },
                { type: "text", text: getHAISTPrompt(documentType || "full") },
                { type: "text", text: "CHUNK NOTES (use these; preserve citations):" },
                { type: "text", text: perChunkNotes.join("\n\n") },
              ],
            },
          ],
        }),
      "synthesis"
    );

    const reviewText = (synthesis.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();

    return res.status(200).json({
      success: true,
      review: reviewText,
      metadata: {
        fileName,
        documentType,
        totalPages,
        chunks: chunks.length,
        model: MODEL,
      },
    });
  } catch (error) {
    const status = error?.status || error?.response?.status;
    const msg = error?.message || String(error);

    console.error("❌ Error processing review:", status, msg);

    if (String(status) === "429" || msg.toLowerCase().includes("rate_limit")) {
      return res.status(429).json({
        error: "rate_limit",
        message:
          "The AI service rate limit was reached. Please wait about 60 seconds and try again.",
      });
    }

    if (String(status) === "529" || msg.toLowerCase().includes("overloaded")) {
      return res.status(529).json({
        error: "overloaded",
        message:
          "The AI service is temporarily overloaded. Please wait about 60 seconds and try again.",
      });
    }

    return res.status(500).json({
      error: "Failed to process review",
      message: msg,
      details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    });
  }
}