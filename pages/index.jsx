// pages/index.jsx - Updated with chunked processing, promo codes, Word docs, and email
import { useState, useMemo } from "react";
import FileUpload from "../components/FileUpload";
import PromoCodeInput from "../components/PromoCodeInput";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function downloadBase64Docx(base64, filename = "HAIST_Review.docx") {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
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
  const [documentType, setDocumentType] = useState("full"); // "proposal" | "full"
  const [reviewType, setReviewType] = useState("quicklook"); // "quicklook" | "full"

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [promoData, setPromoData] = useState(null);

  // Email for Full Review
  const [userEmail, setUserEmail] = useState("");

  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState("");

  // Results
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
    setCurrentStep("");
  };

  const onCodeValidated = (code, data) => {
    setPromoCode(code);
    setPromoData(data);
    setError("");
  };

  const runReview = async () => {
    if (!selectedFile) {
      setError("Please upload a PDF first.");
      return;
    }

    // For Full Review, require email
    if (reviewType === "full" && !userEmail.trim()) {
      setError("Please enter your email for Full Review delivery.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setReviewText("");
    setDocxBase64("");
    setProgress(5);

    try {
      // Step 1: Read file
      setCurrentStep("Reading document...");
      const fileContent = await fileToBase64(selectedFile);
      setProgress(15);

      // Step 2: Process review (API handles chunking internally)
      setCurrentStep("Running HAIST© review...");
      const reviewRes = await fetch("/api/process-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileContent,
          fileName: selectedFile.name,
          documentType,
        }),
      });

      if (!reviewRes.ok) {
        const errorData = await reviewRes.json().catch(() => ({}));
        throw new Error(errorData.message || `Review failed: ${reviewRes.status}`);
      }

      const reviewData = await reviewRes.json();
      setReviewText(reviewData.review);
      setProgress(75);

      // Step 3: Generate Word document
      setCurrentStep("Generating Word document...");
      const docxRes = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: reviewData.review,
          studentName: "",
          documentType: documentType === "proposal" ? "Dissertation Proposal" : "Full Dissertation",
          fileName: selectedFile.name,
        }),
      });

      if (docxRes.ok) {
        const docxData = await docxRes.json();
        setDocxBase64(docxData.docxBase64);
      }
      setProgress(90);

      // Step 4: Send email if Full Review
      if (reviewType === "full" && userEmail.trim()) {
        setCurrentStep("Sending email notification...");
        // TODO: Implement server-side email sending
      }

      setProgress(100);
      setCurrentStep("Complete!");

      // Track promo code usage
      if (promoCode && promoData) {
        try {
          await fetch("/api/use-promo-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: promoCode,
              reviewType,
            }),
          });
        } catch (err) {
          console.error("Failed to track promo code usage:", err);
        }
      }

    } catch (err) {
      console.error("Review error:", err);
      setError(err?.message || "Something went wrong. Please try again.");
      setProgress(0);
      setCurrentStep("");
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
        <div className="navInner">
          <a href="/" className="logo">
            <span className="logoText">Dr. Dissertation</span>
            <span className="logoBeta">BETA</span>
          </a>
          <ul className="navLinks">
            <li><a href="https://doctordissertation.com">Main Site</a></li>
            <li><a href="#review">Start Review</a></li>
            <li><a href="https://doctordissertation.com/contact.html">Contact</a></li>
          </ul>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <div className="heroBadge">
            <span className="dot" />
            HAIST©-Powered Beta
          </div>
          <h1 className="heroTitle">AI-Powered Dissertation Review</h1>
          <p className="heroSub">
            Upload your dissertation and receive comprehensive HAIST© framework analysis.
          </p>
        </div>
      </section>

      <section id="review" className="container">
        <div className="card">
          <h2 className="cardTitle">Get Your HAIST© Review</h2>

          {/* Promo Code Input */}
          <PromoCodeInput onCodeValidated={onCodeValidated} reviewType={reviewType} />

          {/* Review Type Selection */}
          <div className="formGroup">
            <label className="formLabel">Review Type</label>
            <div className="radioGroup">
              <label className="radioLabel">
                <input
                  type="radio"
                  name="reviewType"
                  value="quicklook"
                  checked={reviewType === "quicklook"}
                  onChange={(e) => setReviewType(e.target.value)}
                  disabled={isProcessing}
                />
                <span>QuickLook (~10 min, top 5 critical dimensions)</span>
              </label>
              <label className="radioLabel">
                <input
                  type="radio"
                  name="reviewType"
                  value="full"
                  checked={reviewType === "full"}
                  onChange={(e) => setReviewType(e.target.value)}
                  disabled={isProcessing}
                />
                <span>Full Review (complete analysis, 3 days)</span>
              </label>
            </div>
          </div>

          {/* Document Type Selection */}
          <div className="formGroup">
            <label className="formLabel">Document Type</label>
            <div className="radioGroup">
              <label className="radioLabel">
                <input
                  type="radio"
                  name="documentType"
                  value="proposal"
                  checked={documentType === "proposal"}
                  onChange={(e) => setDocumentType(e.target.value)}
                  disabled={isProcessing}
                />
                <span>Proposal (Chapters 1-3)</span>
              </label>
              <label className="radioLabel">
                <input
                  type="radio"
                  name="documentType"
                  value="full"
                  checked={documentType === "full"}
                  onChange={(e) => setDocumentType(e.target.value)}
                  disabled={isProcessing}
                />
                <span>Full Dissertation (Chapters 1-5)</span>
              </label>
            </div>
          </div>

          {/* Email for Full Review */}
          {reviewType === "full" && (
            <div className="formGroup">
              <label className="formLabel" htmlFor="email">
                Email (for review delivery)
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@university.edu"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                disabled={isProcessing}
                className="input"
              />
              <p className="formHint">
                We'll email you when your Full Review is ready (within 3 business days)
              </p>
            </div>
          )}

          {/* File Upload */}
          <FileUpload onFileSelect={onFileSelect} />

          {selectedFile && (
            <div className="fileInfo">
              <strong>Selected:</strong> {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="progressContainer">
              <div className="progressLabel">{currentStep}</div>
              <div className="progressBar">
                <div className="progressFill" style={{ width: pct }} />
              </div>
              <div className="progressPercent">{pct}</div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="errorBox">
              <span className="errorIcon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={runReview}
            disabled={!canSubmit}
            className={`btn btnPrimary ${!canSubmit ? "btnDisabled" : ""}`}
          >
            {isProcessing ? "Processing..." : "Generate Review"}
          </button>

          {/* Review Display */}
          {reviewText && (
            <div className="resultsContainer">
              <h3 className="resultsTitle">Your HAIST© Review</h3>
              <div className="reviewText">
                {reviewText}
              </div>

              {canDownload && (
                <button onClick={onDownloadDocx} className="btn btnSecondary">
                  📥 Download as Word Document
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #ffffff;
        }
        .nav {
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
        }
        .navInner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          text-decoration: none;
          color: #111827;
        }
        .logoText {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .logoBeta {
          font-size: 0.75rem;
          color: #6366f1;
          font-weight: 600;
          background: #eef2ff;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
        }
        .navLinks {
          display: flex;
          gap: 2rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .navLinks a {
          text-decoration: none;
          color: #6b7280;
          font-weight: 500;
          transition: color 0.2s;
        }
        .navLinks a:hover {
          color: #6366f1;
        }
        .hero {
          padding: 4rem 0;
          text-align: center;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        .heroBadge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .heroTitle {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          line-height: 1.1;
        }
        .heroSub {
          font-size: 1.125rem;
          opacity: 0.9;
        }
        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .cardTitle {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #111827;
        }
        .formGroup {
          margin-bottom: 1.5rem;
        }
        .formLabel {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .radioGroup {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .radioLabel {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: #374151;
        }
        .radioLabel input {
          cursor: pointer;
        }
        .input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
        }
        .input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .formHint {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }
        .fileInfo {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #374151;
        }
        .progressContainer {
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .progressLabel {
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }
        .progressBar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }
        .progressFill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          transition: width 0.3s ease;
        }
        .progressPercent {
          text-align: right;
          font-size: 0.75rem;
          color: #6b7280;
        }
        .errorBox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #991b1b;
        }
        .errorIcon {
          font-size: 1.25rem;
        }
        .btn {
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          margin-top: 1.5rem;
        }
        .btnPrimary {
          background: #6366f1;
          color: white;
        }
        .btnPrimary:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);
        }
        .btnSecondary {
          background: #059669;
          color: white;
        }
        .btnSecondary:hover:not(:disabled) {
          background: #047857;
        }
        .btnDisabled {
          background: #d1d5db;
          cursor: not-allowed;
          transform: none;
        }
        .resultsContainer {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }
        .resultsTitle {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #111827;
        }
        .reviewText {
          padding: 1.5rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          white-space: pre-wrap;
          font-size: 0.875rem;
          line-height: 1.6;
          max-height: 600px;
          overflow-y: auto;
          margin-bottom: 1rem;
          color: #374151;
        }
        @media (max-width: 768px) {
          .heroTitle {
            font-size: 2rem;
          }
          .navLinks {
            display: none;
          }
          .card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
