// pages/index.jsx
import { useMemo, useState } from "react";
import FileUpload from "../components/FileUpload";
import ProcessingStatus from "../components/ProcessingStatus";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => resolve(reader.result); // data:application/pdf;base64,...
    reader.readAsDataURL(file);
  });
}

function downloadBase64Docx(base64, filename = "HAIST_Review.docx") {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);

  const blob = new Blob([byteArray], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("proposal"); // "proposal" | "full"

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusSteps, setStatusSteps] = useState([]);
  const [error, setError] = useState("");

  const [reviewText, setReviewText] = useState("");
  const [docxBase64, setDocxBase64] = useState("");

  const pct = useMemo(() => {
    const clamped = Math.max(0, Math.min(100, Number(progress || 0)));
    return `${clamped}%`;
  }, [progress]);

  const onFileSelect = (file) => {
    setSelectedFile(file);
    setError("");
    setReviewText("");
    setDocxBase64("");
    setProgress(0);
    setStatusSteps([]);
  };

  const onRunReview = async () => {
    if (!selectedFile) {
      setError("Please upload a PDF first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setReviewText("");
    setDocxBase64("");

    // Professional status steps (not “chunking” language)
    setStatusSteps([
      "Uploading document",
      "Preparing analysis",
      "Running HAIST© review",
      "Synthesizing recommendations",
      "Preparing Word report",
    ]);

    try {
      setProgress(10);

      const fileContent = await fileToBase64(selectedFile);
      setProgress(20);

      const res = await fetch("/api/process-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileContent,
          fileName: selectedFile.name,
          documentType,
        }),
      });

      // Handle Vercel timeouts / failures gracefully
      if (!res.ok) {
        let detail = "";
        try {
          const t = await res.text();
          detail = t?.slice(0, 300);
        } catch {}
        if (res.status === 504) {
          throw new Error(
            "The server timed out while processing this document. This is common on Vercel for longer jobs. Try again, or use smaller documents until we move processing to a background job."
          );
        }
        throw new Error(`Request failed (${res.status}). ${detail}`);
      }

      setProgress(70);
      const data = await res.json();

      // Your API may return different keys—support common ones:
      const nextReview =
        data.review ||
        data.reviewText ||
        data.text ||
        data.result ||
        "";

      const nextDocx =
        data.docxBase64 ||
        data.docx ||
        data.wordBase64 ||
        "";

      if (!nextReview && !nextDocx) {
        throw new Error("No review returned. Please try again.");
      }

      setReviewText(nextReview);
      setDocxBase64(nextDocx);
      setProgress(100);
      setStatusSteps((prev) => prev.map((s) => `✓ ${s}`));
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDownloadDocx = () => {
    if (!docxBase64) return;

    const baseName = (selectedFile?.name || "Document").replace(/\.[^/.]+$/, "");
    downloadBase64Docx(docxBase64, `${baseName}_HAIST_Review.docx`);
  };

  const canSubmit = !!selectedFile && !isProcessing;
  const canDownload = !!docxBase64 && !isProcessing;

  return (
    <div className="page">
      <nav className="nav">
        <div className="navInner" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
          <a href="/" className="logo" style={{ justifySelf: "start" }}>
            <img className="logoImg" src="/logo-header-perfect.svg" alt="Dr. Dissertation" />
          </a>

          <ul className="navLinks" style={{ justifySelf: "center" }}>
            <li><a href="https://doctordissertation.com">Main Site</a></li>
            <li><a href="#quicklook">QuickLook</a></li>
            <li><a href="https://doctordissertation.com/files3/contact-fixed.html">Contact</a></li>
          </ul>

          <a className="btn btnPrimary" href="#quicklook" style={{ justifySelf: "end" }}>
            QuickLook →
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <div className="heroBadge">
            <span className="dot" />
            HAIST©-Powered QuickLook
          </div>

          <h1 className="heroTitle">Dissertation Feedback in Minutes</h1>

          <p className="heroSub">
            Upload a proposal or full dissertation and receive a clean, downloadable Word report.
            Built on the research-backed HAIST© Framework.
          </p>
        </div>
      </section>

      <section id="quicklook" className="container">
        <div className="card">
          <div className="cardTitleRow">
            <div>
              <div className="cardTitle">Upload for QuickLook Review</div>
              <div className="cardHint">PDF only during beta • Max 10MB</div>
            </div>
          </div>

          <FileUpload onFileSelect={onFileSelect} />

          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ fontWeight: 600, color: "var(--gray-900)", marginBottom: "0.75rem" }}>
              Document Type:
            </div>

            <label style={{ marginRight: "1.5rem", color: "var(--gray-700)" }}>
              <input
                type="radio"
                checked={documentType === "proposal"}
                onChange={() => setDocumentType("proposal")}
                disabled={isProcessing}
                style={{ marginRight: "0.5rem" }}
              />
              Proposal (Chapters 1–3)
            </label>

            <label style={{ color: "var(--gray-700)" }}>
              <input
                type="radio"
                checked={documentType === "full"}
                onChange={() => setDocumentType("full")}
                disabled={isProcessing}
                style={{ marginRight: "0.5rem" }}
              />
              Full Dissertation (Chapters 1–5)
            </label>
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              className={`btn btnPrimary ${!canSubmit ? "btnDisabled" : ""}`}
              onClick={onRunReview}
              disabled={!canSubmit}
            >
              {isProcessing ? "Generating..." : "Get My QuickLook Review →"}
            </button>

            <button
              className={`btn btnSecondary ${!canDownload ? "btnDisabled" : ""}`}
              onClick={onDownloadDocx}
              disabled={!canDownload}
            >
              Download as Word (.docx)
            </button>
          </div>

          {isProcessing && (
            <div className="statusBox">
              <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>
                Analyzing your document…
              </div>
              <div style={{ color: "var(--gray-600)", fontSize: "0.95rem" }}>
                This typically takes a few minutes depending on document length.
              </div>

              <div className="progressBar" style={{ marginTop: "0.85rem" }}>
                <div className="progressFill" style={{ "--pct": pct }} />
              </div>
              <div style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>{pct}</div>

              <div style={{ marginTop: "0.75rem" }}>
                <ProcessingStatus steps={statusSteps} />
              </div>
            </div>
          )}

          {error && <div className="alert">⚠️ {error}</div>}
        </div>
      </section>
    </div>
  );
}
