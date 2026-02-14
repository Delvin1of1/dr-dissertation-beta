import { useState } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import FileUpload from "../components/FileUpload";
import ProcessingStatus from "../components/ProcessingStatus";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("proposal");
  const [status, setStatus] = useState([]);
  const [progress, setProgress] = useState(0);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleReview() {
    if (!file) return;

    setLoading(true);
    setError("");
    setReview("");
    setStatus(["Uploading document…"]);
    setProgress(5);

    const fileContent = await toBase64(file);

    // 1️⃣ PLAN
    const planRes = await fetch("/api/process-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "plan",
        fileContent,
        fileName: file.name,
        documentType,
      }),
    });

    const plan = await planRes.json();
    if (!plan.ok) {
      setError(plan.message || "Planning failed");
      setLoading(false);
      return;
    }

    const chunks = plan.chunks;
    const notes = [];

    setStatus((s) => [...s, "Analyzing document structure…"]);
    setProgress(10);

    // 2️⃣ PROCESS CHUNKS
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];

      setStatus((s) => [
        ...s,
        `Reviewing pages ${c.startPage}–${c.endPage}`,
      ]);
      setProgress(Math.round(10 + (70 * i) / chunks.length));

      const chunkRes = await fetch("/api/process-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chunk",
          fileContent,
          fileName: file.name,
          documentType,
          totalPages: plan.totalPages,
          startPage: c.startPage,
          endPage: c.endPage,
        }),
      });

      const chunkData = await chunkRes.json();
      if (!chunkData.ok) {
        setError(chunkData.message || "Chunk failed");
        setLoading(false);
        return;
      }

      notes.push(chunkData.notes);
    }

    // 3️⃣ FINAL SYNTHESIS
    setStatus((s) => [...s, "Synthesizing final HAIST review…"]);
    setProgress(90);

    const finalRes = await fetch("/api/process-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "final",
        fileContent,
        fileName: file.name,
        documentType,
        chunkNotes: notes,
      }),
    });

    const finalData = await finalRes.json();

    if (!finalData.ok || !finalData.review) {
      setError("No review returned. Please try again.");
      setLoading(false);
      return;
    }

    setReview(finalData.review);
    setStatus((s) => [...s, "Review complete"]);
    setProgress(100);
    setLoading(false);
  }

  async function downloadDocx() {
    const doc = new Document({
      sections: [
        {
          children: review.split("\n").map(
            (line) =>
              new Paragraph({
                children: [new TextRun(line)],
                spacing: { after: 120 },
              })
          ),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file.name.replace(/\.pdf$/i, "") + "_HAIST_Review.docx";
    link.click();
  }

  return (
    <main>
      <FileUpload file={file} setFile={setFile} />

      <div style={{ marginTop: 20 }}>
        <label>
          <input
            type="radio"
            checked={documentType === "proposal"}
            onChange={() => setDocumentType("proposal")}
          />{" "}
          Proposal (Chapters 1–3)
        </label>{" "}
        <label style={{ marginLeft: 20 }}>
          <input
            type="radio"
            checked={documentType === "full"}
            onChange={() => setDocumentType("full")}
          />{" "}
          Full Dissertation (Chapters 1–5)
        </label>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleReview} disabled={loading}>
          {loading ? "Generating…" : "Get My Free Review →"}
        </button>

        <button
          onClick={downloadDocx}
          disabled={!review}
          style={{ marginLeft: 10 }}
        >
          Download as Word (.docx)
        </button>
      </div>

      <ProcessingStatus steps={status} progress={progress} />

      {error && <div className="error">{error}</div>}
    </main>
  );
}
