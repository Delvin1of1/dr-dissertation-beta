// pages/index.jsx - Redesigned to match main site aesthetic with QuickLook branding
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
  const [documentType, setDocumentType] = useState("full");
  const [reviewType, setReviewType] = useState("quicklook");

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
      setCurrentStep("Reading document...");
      const fileContent = await fileToBase64(selectedFile);
      setProgress(15);

      setCurrentStep("Running HAIST© review...");
      const reviewRes = await fetch("/api/process-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileContent,
          fileName: selectedFile.name,
          documentType,
          reviewType, // Pass QuickLook vs Full Review type
        }),
      });

      if (!reviewRes.ok) {
        const errorData = await reviewRes.json().catch(() => ({}));
        throw new Error(errorData.message || `Review failed: ${reviewRes.status}`);
      }

      const reviewData = await reviewRes.json();
      setReviewText(reviewData.review);
      setProgress(75);

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

      if (reviewType === "full" && userEmail.trim()) {
        setCurrentStep("Sending email notification...");
        // TODO: Implement server-side email sending
      }

      setProgress(100);
      setCurrentStep("Complete!");

      if (promoCode && promoData) {
        try {
          await fetch("/api/use-promo-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: promoCode, reviewType }),
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
    <>
      <nav className="nav">
        <div className="nav-container">
          <a href="/" className="logo">
            <img src="/logo-header-perfect.svg" alt="Dr. Dissertation" />
          </a>
          <ul className="nav-links">
            <li><a href="https://doctordissertation.com">Main Site</a></li>
            <li><a href="https://doctordissertation.com/#features">Features</a></li>
            <li><a href="https://doctordissertation.com/#pricing">Pricing</a></li>
            <li><a href="https://doctordissertation.com/contact.html">Contact</a></li>
          </ul>
          <a href="#review" className="btn btn-primary">Start Review →</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-container">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Beta Testing • Limited Access
          </div>
          <h1 className="hero-title">
            {reviewType === "quicklook" ? (
              <>⚡ QuickLook: Defense Blockers in <span className="highlight">10 Minutes</span></>
            ) : (
              <>Complete HAIST© Dissertation Review</>
            )}
          </h1>
          <p className="hero-subtitle">
            {reviewType === "quicklook"
              ? "Rapid AI-powered analysis focusing on critical issues that could block your defense"
              : "Comprehensive 10-dimensional analysis with detailed feedback and actionable recommendations"
            }
          </p>
        </div>
      </section>

      <section className="container">
        <div className="review-options">
          <div
            className={`option-card ${reviewType === "quicklook" ? "selected" : ""}`}
            onClick={() => setReviewType("quicklook")}
          >
            <div className="option-icon">⚡</div>
            <h3 className="option-title">QuickLook</h3>
            <div className="option-price">
              <span className="price-strike">$29.99</span>
              <span className="price-main">$9.99</span>
              <span className="price-label">first review</span>
            </div>
            <ul className="option-features">
              <li>⚡ ~10 minute turnaround</li>
              <li>🎯 Top 5 critical dimensions</li>
              <li>⚠️ Defense blockers identified</li>
              <li>📋 Priority recommendations</li>
            </ul>
            {reviewType === "quicklook" && <div className="selected-badge">Selected ✓</div>}
          </div>

          <div
            className={`option-card ${reviewType === "full" ? "selected" : ""}`}
            onClick={() => setReviewType("full")}
          >
            <div className="option-icon">📊</div>
            <h3 className="option-title">Full Review</h3>
            <div className="option-price">
              <span className="price-main">$49.99</span>
              <span className="price-label">+ 1 QuickLook credit</span>
            </div>
            <ul className="option-features">
              <li>📊 All 10 HAIST© dimensions</li>
              <li>📄 Professional Word document</li>
              <li>📍 Page-specific citations</li>
              <li>⏱️ Within 3 business days</li>
            </ul>
            {reviewType === "full" && <div className="selected-badge">Selected ✓</div>}
          </div>
        </div>

        <div className="review-form">
          <PromoCodeInput onCodeValidated={onCodeValidated} reviewType={reviewType} />

          <div className="form-section">
            <label className="form-label">Document Type</label>
            <div className="radio-group">
              <label className={`radio-card ${documentType === "proposal" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="documentType"
                  value="proposal"
                  checked={documentType === "proposal"}
                  onChange={(e) => setDocumentType(e.target.value)}
                  disabled={isProcessing}
                />
                <div className="radio-content">
                  <div className="radio-title">Proposal</div>
                  <div className="radio-desc">Chapters 1-3</div>
                </div>
              </label>
              <label className={`radio-card ${documentType === "full" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="documentType"
                  value="full"
                  checked={documentType === "full"}
                  onChange={(e) => setDocumentType(e.target.value)}
                  disabled={isProcessing}
                />
                <div className="radio-content">
                  <div className="radio-title">Full Dissertation</div>
                  <div className="radio-desc">Chapters 1-5</div>
                </div>
              </label>
            </div>
          </div>

          {reviewType === "full" && (
            <div className="form-section">
              <label className="form-label" htmlFor="email">
                Email for Review Delivery
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@university.edu"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                disabled={isProcessing}
                className="form-input"
              />
              <p className="form-hint">
                We'll email your review when it's ready (within 3 business days)
              </p>
            </div>
          )}

          <FileUpload onFileSelect={onFileSelect} />

          {selectedFile && (
            <div className="file-selected">
              📎 <strong>{selectedFile.name}</strong> ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}

          {isProcessing && (
            <div className="progress-section">
              <div className="progress-label">{currentStep}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: pct }} />
              </div>
              <div className="progress-percent">{pct}</div>
            </div>
          )}

          {error && (
            <div className="error-box">
              ⚠️ <span>{error}</span>
            </div>
          )}

          <button
            onClick={runReview}
            disabled={!canSubmit}
            className={`btn btn-primary btn-large ${!canSubmit ? "btn-disabled" : ""}`}
          >
            {isProcessing ? "Processing..." : reviewType === "quicklook" ? "⚡ Get QuickLook Review" : "📊 Get Full Review"}
          </button>

          {reviewText && (
            <div className="results-section">
              <div className="results-header">
                <h3>Your HAIST© Review</h3>
                {canDownload && (
                  <button onClick={onDownloadDocx} className="btn btn-secondary">
                    📥 Download Word Doc
                  </button>
                )}
              </div>
              <div className="review-content">
                {reviewText}
              </div>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :global(body) {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #F8FAFC;
          color: #1E293B;
          line-height: 1.6;
        }

        .nav {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #E2E8F0;
          padding: 1rem 2rem;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .nav-container {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo img {
          height: 60px;
          width: auto;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
          align-items: center;
        }

        .nav-links a {
          color: #475569;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9375rem;
          transition: color 0.3s;
        }

        .nav-links a:hover {
          color: #6366F1;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.3s;
          display: inline-block;
          cursor: pointer;
          border: none;
          text-align: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .btn-primary:hover:not(.btn-disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
        }

        .btn-secondary {
          background: white;
          color: #6366F1;
          border: 2px solid #E2E8F0;
        }

        .btn-secondary:hover {
          border-color: #6366F1;
          background: #F8FAFC;
        }

        .btn-large {
          width: 100%;
          padding: 1.25rem 2rem;
          font-size: 1.125rem;
          margin-top: 2rem;
        }

        .btn-disabled {
          background: #CBD5E1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .hero {
          padding: 6rem 2rem 4rem;
          background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
          text-align: center;
        }

        .hero-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #F1F5F9;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 1.5rem;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: #0F172A;
        }

        .highlight {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #475569;
          max-width: 700px;
          margin: 0 auto;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .review-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .option-card {
          background: white;
          border: 3px solid #E2E8F0;
          border-radius: 16px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .option-card:hover {
          border-color: #6366F1;
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .option-card.selected {
          border-color: #6366F1;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.2);
        }

        .option-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .option-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #0F172A;
        }

        .option-price {
          margin-bottom: 1.5rem;
        }

        .price-strike {
          text-decoration: line-through;
          color: #94A3B8;
          font-size: 1rem;
          margin-right: 0.5rem;
        }

        .price-main {
          font-size: 2.5rem;
          font-weight: 800;
          color: #6366F1;
        }

        .price-label {
          display: block;
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 0.25rem;
        }

        .option-features {
          list-style: none;
          margin: 1.5rem 0;
        }

        .option-features li {
          padding: 0.5rem 0;
          color: #475569;
          font-size: 0.9375rem;
        }

        .selected-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #6366F1;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .review-form {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-label {
          display: block;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1E293B;
          margin-bottom: 0.75rem;
        }

        .radio-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .radio-card {
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .radio-card:hover {
          border-color: #6366F1;
          background: #F8FAFC;
        }

        .radio-card.selected {
          border-color: #6366F1;
          background: rgba(99, 102, 241, 0.05);
        }

        .radio-card input {
          cursor: pointer;
        }

        .radio-content {
          flex: 1;
        }

        .radio-title {
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 0.25rem;
        }

        .radio-desc {
          font-size: 0.875rem;
          color: #64748B;
        }

        .form-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-hint {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #64748B;
        }

        .file-selected {
          margin-top: 1rem;
          padding: 1rem;
          background: #F1F5F9;
          border-radius: 12px;
          font-size: 0.9375rem;
          color: #1E293B;
        }

        .progress-section {
          margin-top: 2rem;
        }

        .progress-label {
          margin-bottom: 0.75rem;
          font-size: 0.9375rem;
          color: #475569;
          font-weight: 500;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: #E2E8F0;
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366F1, #8B5CF6);
          transition: width 0.3s ease;
          border-radius: 100px;
        }

        .progress-percent {
          text-align: right;
          font-size: 0.875rem;
          color: #64748B;
          font-weight: 600;
        }

        .error-box {
          margin-top: 1.5rem;
          padding: 1.25rem;
          background: #FEF2F2;
          border: 2px solid #FECACA;
          border-radius: 12px;
          color: #991B1B;
          font-size: 0.9375rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .results-section {
          margin-top: 3rem;
          padding-top: 3rem;
          border-top: 2px solid #E2E8F0;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .results-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0F172A;
        }

        .review-content {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 2rem;
          white-space: pre-wrap;
          font-size: 0.9375rem;
          line-height: 1.8;
          max-height: 600px;
          overflow-y: auto;
          color: #1E293B;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          .hero-title {
            font-size: 2.5rem;
          }
          .review-options {
            grid-template-columns: 1fr;
          }
          .radio-group {
            grid-template-columns: 1fr;
          }
          .results-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          .results-header .btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
