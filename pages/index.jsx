// pages/index.jsx
import { useMemo, useState } from "react";
import FileUpload from "../components/FileUpload";

// DOCX download
import { Document, Packer, Paragraph, TextRun } from "docx";

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState("full"); // "proposal" | "full"
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");

  const steps = useMemo(() => {
    if (!loading) return [];
    return [
      "Uploading PDF",
      "Chunking pages (to stay under API limits)",
      "Generating chunk notes",
      "Synthesizing final review",
      "Preparing download",
    ];
  }, [loading]);

  const onFileSelect = (file) => {
    setSelectedFile(file);
    setReview("");
    setError("");
  };

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  async function generateReview() {
    setError("");
    setReview("");

    if (!selectedFile) {
      setError("Please select a PDF first.");
      return;
    }

    setLoading(true);
    try {
      const fileContent = await readFileAsBase64(selectedFile);

      const res = await fetch("/api/process-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileContent,
          fileName: selectedFile.name,
          documentType: docType, // "proposal" or "full"
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Friendly messages from API
        const msg =
          data?.message ||
          data?.error ||
          `Request failed (${res.status}). Please try again.`;
        setError(msg);
        setLoading(false);
        return;
      }

      if (!data?.review) {
        setError("No review returned. Please try again.");
        setLoading(false);
        return;
      }

      setReview(data.review);
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocx() {
    setError("");

    if (!review) {
      setError("No review to download yet.");
      return;
    }

    // ✅ Fixes your crash: selectedFile can be null, so fallback safely
    const baseName = (selectedFile?.name || "HAIST_Review")
      .replace(/\.[^/.]+$/, "")
      .trim();

    const lines = review.split("\n");

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: lines.map((line) => {
            // Simple heading detection
            const isHeading =
              line.trim().startsWith("#") ||
              /^[A-Z][A-Za-z0-9\s\-:&]+:$/.test(line.trim());

            const clean = line.replace(/^#+\s*/, "");

            return new Paragraph({
              spacing: { after: 160 },
              children: [
                new TextRun({
                  text: clean.length ? clean : " ",
                  bold: isHeading,
                }),
              ],
            });
          }),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}_HAIST_Review.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page">
      <header className="header">
        <div className="badge">FREE BETA TESTING</div>
        <h1>Dr. Dissertation Beta</h1>
        <p className="sub">
          Experience real HAIST© framework reviews • Completely free during beta
        </p>
      </header>

      <section className="card">
        <FileUpload onFileSelect={onFileSelect} />

        <div className="controls">
          <div className="label">Document Type:</div>
          <label className="radio">
            <input
              type="radio"
              name="doctype"
              checked={docType === "proposal"}
              onChange={() => setDocType("proposal")}
              disabled={loading}
            />
            Proposal (Chapters 1–3)
          </label>
          <label className="radio">
            <input
              type="radio"
              name="doctype"
              checked={docType === "full"}
              onChange={() => setDocType("full")}
              disabled={loading}
            />
            Full Dissertation (Chapters 1–5)
          </label>

          <div className="buttons">
            <button
              className="btn primary"
              onClick={generateReview}
              disabled={loading || !selectedFile}
            >
              {loading ? "Generating…" : "Get My Free Review →"}
            </button>

            <button
              className="btn ghost"
              onClick={downloadDocx}
              disabled={!review}
              title={!review ? "Generate a review first" : "Download as Word"}
            >
              Download as Word (.docx)
            </button>
          </div>
        </div>

        {loading && (
          <div className="status">
            <div className="statusTitle">In progress</div>
            <ul>
              {steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="statusHint">
              Tip: long dissertations are processed in chunks to stay under API
              limits.
            </div>
          </div>
        )}

        {error && <div className="error">⚠️ {error}</div>}

        {!!review && (
          <div className="result">
            <div className="resultHeader">
              <div className="resultTitle">Your Review</div>
              <button className="btn small" onClick={downloadDocx}>
                Download .docx
              </button>
            </div>
            <pre className="review">{review}</pre>
          </div>
        )}
      </section>
    </main>
  );
}