// pages/index.jsx
import { useMemo } from "react";
import FileUpload from "../components/FileUpload";
import ProcessingStatus from "../components/ProcessingStatus";

export default function HomePage() {
  // IMPORTANT:
  // Keep your existing state + handlers from your current file.
  // This file is mainly the layout/styling shell to match the main site.

  // ↓↓↓ Replace these placeholders with YOUR real state/handlers ↓↓↓
  const selectedFile = null;               // your state
  const documentType = "proposal";         // your state
  const isProcessing = false;              // your state
  const progress = 0;                      // your state (0-100)
  const statusSteps = [];                  // your state (array of strings)
  const error = "";                        // your state
  const hasDocx = false;                   // your state
  const onFileSelect = () => {};           // your handler
  const onRunReview = async () => {};      // your handler
  const onDownloadDocx = () => {};         // your handler
  const setDocumentType = () => {};        // your handler
  // ↑↑↑ Replace these placeholders with YOUR real state/handlers ↑↑↑

  const pct = useMemo(() => {
    const clamped = Math.max(0, Math.min(100, Number(progress || 0)));
    return `${clamped}%`;
  }, [progress]);

  return (
    <div className="page">
      {/* NAV (matches main site) */}
      <nav className="nav">
        <div className="navInner">
          <a href="/" className="logo">
            <img className="logoImg" src="/logo-header-perfect.svg" alt="Dr. Dissertation" />
          </a>

          <ul className="navLinks">
            <li><a href="https://doctordissertation.com">Main Site</a></li>
            <li><a href="#quicklook">QuickLook</a></li>
            <li><a href="https://doctordissertation.com/files3/contact-fixed.html">Contact</a></li>
          </ul>

          <a className="btn btnPrimary" href="#quicklook">
            QuickLook →
          </a>
        </div>
      </nav>

      {/* HERO */}
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

      {/* CARD */}
      <section id="quicklook" className="container">
        <div className="card">
          <div className="cardTitleRow">
            <div>
              <div className="cardTitle">Upload for QuickLook Review</div>
              <div className="cardHint">PDF only during beta • Max 10MB</div>
            </div>
          </div>

          <FileUpload onFileSelect={onFileSelect} />

          {/* Document Type */}
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

          {/* Actions */}
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              className={`btn btnPrimary ${isProcessing ? "btnDisabled" : ""}`}
              onClick={onRunReview}
              disabled={isProcessing || !selectedFile}
            >
              {isProcessing ? "Generating..." : "Get My QuickLook Review →"}
            </button>

            <button
              className={`btn btnSecondary ${!hasDocx ? "btnDisabled" : ""}`}
              onClick={onDownloadDocx}
              disabled={!hasDocx}
            >
              Download as Word (.docx)
            </button>
          </div>

          {/* STATUS: Clean + professional */}
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

              {/* Keep your existing status component if you have it */}
              <div style={{ marginTop: "0.75rem" }}>
                <ProcessingStatus steps={statusSteps} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className="alert">⚠️ {error}</div>}
        </div>
      </section>
    </div>
  );
}
