import { useState } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import FileUpload from "../components/FileUpload";
import ProcessingStatus from "../components/ProcessingStatus";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("proposal");
  const [steps, setSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function toBase64(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  function pushStep(msg) {
    setSteps((prev) => [...prev, msg]);
  }

  async function handleReview() {
    if (!file) return;

    setLoading(true);
    setError("");
    setReview("");
    setSteps([]);
    setProgress(3);

    pushStep("Uploading manuscript…");
    const fileContent = await toBase64(file);

    // 1) PLAN
    pushStep("Preparing analysis plan…");
    setProgress(8);

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
    if (!plan?.ok) {
      setError(plan?.message || "Planning failed.");
      setLoading(false);
      return;
    }

    const chunks = plan.chunks || [];
    const notes = [];

    // 2) CHUNKS
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      pushStep(`Reviewing pages ${c.startPage}–${c.endPage}…`);
      setProgress(Math.round(10 + (70 * i) / Math.max(1, chunks.length)));

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
      if (!chunkData?.ok) {
        setError(chunkData?.message || "Chunk analysis failed.");
        setLoading(false);
        return;
      }

      notes.push(chunkData.notes);
    }

    // 3) FINAL
    pushStep("Synthesizing final HAIST® review…");
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
    if (!finalData?.ok || !finalData?.review) {
      setError(finalData?.message || "No review returned. Please try again.");
      setLoading(false);
      return;
    }

    setReview(finalData.review);
    pushStep("Preparing Word report…");
    setProgress(100);
    setLoading(false);
  }

  async function downloadDocx() {
    if (!review || !file) return;

    const doc = new Document({
      sections: [
        {
          children: review.split("\n").map((line) => {
            const text = line?.trimEnd?.() ?? "";
            return new Paragraph({
              children: [new TextRun(text)],
              spacing: { after: 140 },
            });
          }),
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
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.badge}>FREE BETA TESTING</div>
          <h1 style={styles.h1}>Dr. Dissertation Beta</h1>
          <p style={styles.sub}>
            Experience real HAIST© framework reviews • Completely free during beta
          </p>
        </header>

        <section style={styles.card}>
          <FileUpload file={file} setFile={setFile} />

          <div style={styles.row}>
            <div>
              <div style={styles.label}>Document Type:</div>
              <div style={styles.radioRow}>
                <label style={styles.radio}>
                  <input
                    type="radio"
                    checked={documentType === "proposal"}
                    onChange={() => setDocumentType("proposal")}
                    disabled={loading}
                  />
                  <span>Proposal (Chapters 1–3)</span>
                </label>

                <label style={styles.radio}>
                  <input
                    type="radio"
                    checked={documentType === "full"}
                    onChange={() => setDocumentType("full")}
                    disabled={loading}
                  />
                  <span>Full Dissertation (Chapters 1–5)</span>
                </label>
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.primaryBtn} onClick={handleReview} disabled={loading || !file}>
              {loading ? "Generating…" : "Get My Free Review →"}
            </button>

            <button style={styles.secondaryBtn} onClick={downloadDocx} disabled={!review}>
              Download as Word (.docx)
            </button>
          </div>

          {loading && (
            <ProcessingStatus
              title="Analyzing Your Dissertation"
              subtitle="This typically takes 5–10 minutes (depending on length)."
              steps={steps}
              progress={progress}
            />
          )}

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "48px 18px",
    background: "linear-gradient(180deg, rgba(232,231,255,1) 0%, rgba(245,245,255,1) 45%, rgba(250,250,252,1) 100%)",
  },
  container: { maxWidth: 980, margin: "0 auto" },
  header: { textAlign: "center", marginBottom: 22 },
  badge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(235,166,59,0.95)",
    color: "rgba(0,0,0,0.85)",
    fontWeight: 700,
    letterSpacing: "0.06em",
    fontSize: 12,
  },
  h1: { margin: "14px 0 6px", fontSize: 52, lineHeight: 1.05, letterSpacing: "-0.02em" },
  sub: { margin: 0, color: "rgba(0,0,0,0.65)" },

  card: {
    background: "rgba(255,255,255,0.8)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 26,
    padding: 28,
    boxShadow: "0 18px 60px rgba(0,0,0,0.10)",
    backdropFilter: "blur(8px)",
  },
  row: { marginTop: 18 },
  label: { fontWeight: 700, marginBottom: 10 },
  radioRow: { display: "flex", gap: 18, flexWrap: "wrap" },
  radio: { display: "flex", gap: 10, alignItems: "center", color: "rgba(0,0,0,0.8)" },

  actions: { display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" },
  primaryBtn: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    background: "rgba(90,70,229,0.95)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.7)",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBox: {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(190,0,0,0.25)",
    background: "rgba(255,235,235,0.9)",
    color: "rgba(130,0,0,0.9)",
    fontWeight: 600,
  },
};
