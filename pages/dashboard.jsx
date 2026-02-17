// pages/dashboard.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { signOut } from "../lib/auth-helpers";
import FileUpload from "../components/FileUpload";
import { Document, Packer, Paragraph, TextRun } from "docx";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  // Review state
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState("full");
  const [reviewing, setReviewing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [review, setReview] = useState("");
  const [reviewError, setReviewError] = useState("");

  // Account dropdown
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }
      setUser(session.user);

      const { data: prof } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(prof);

      const { data: revs } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setReviews(revs || []);
      setLoading(false);
    }
    init();
  }, [router]);

  async function callApi(body) {
    const res = await fetch("/api/process-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  async function generateReview() {
    setReviewError("");
    setReview("");
    setStatusMsg("");

    if (!selectedFile) {
      setReviewError("Please select a PDF first.");
      return;
    }

    if (profile?.credits <= 0) {
      setReviewError("You have no credits remaining. Please purchase more.");
      return;
    }

    setReviewing(true);
    try {
      setStatusMsg("Reading PDF…");
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      const fileName = selectedFile.name;

      setStatusMsg("Planning review chunks…");
      const plan = await callApi({ action: "plan", fileContent, fileName, documentType: docType });
      const { chunks, totalPages } = plan;

      const chunkNotes = [];
      for (let i = 0; i < chunks.length; i++) {
        const { startPage, endPage } = chunks[i];
        setStatusMsg(`Reviewing pages ${startPage}–${endPage} (chunk ${i + 1} of ${chunks.length})…`);
        if (i > 0) await sleep(1500);
        const chunkData = await callApi({ action: "chunk", fileContent, fileName, documentType: docType, startPage, endPage, totalPages });
        chunkNotes.push(chunkData.notes);
      }

      setStatusMsg("Synthesizing final review…");
      const finalData = await callApi({ action: "final", fileContent, fileName, documentType: docType, chunkNotes });

      // Deduct credit
      await fetch("/api/deduct-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      // Save review to DB
      const { data: savedReview } = await supabase.from("reviews").insert({
        user_id: user.id,
        file_name: fileName,
        document_type: docType,
        review_text: finalData.review,
      }).select().single();

      setReview(finalData.review);
      setStatusMsg("");

      // Refresh profile (credits) and reviews list
      const { data: updatedProfile } = await supabase.from("users").select("*").eq("id", user.id).single();
      setProfile(updatedProfile);
      const { data: updatedReviews } = await supabase.from("reviews").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setReviews(updatedReviews || []);
    } catch (e) {
      const msg = e?.message || "Something went wrong. Please try again.";
      if (msg.includes("429") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("too many")) {
        setReviewError("The AI service is busy right now. Please wait 30 seconds and try again.");
      } else {
        setReviewError(msg);
      }
    } finally {
      setReviewing(false);
    }
  }

  async function downloadDocx(text, fileName) {
    const baseName = (fileName || "HAIST_Review").replace(/\.[^/.]+$/, "").trim();
    const lines = (text || review).split("\n");
    const doc = new Document({
      sections: [{
        properties: {},
        children: lines.map((line) => {
          const isHeading = line.trim().startsWith("#") || /^[A-Z][A-Za-z0-9\s\-:&]+:$/.test(line.trim());
          const clean = line.replace(/^#+\s*/, "");
          return new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: clean.length ? clean : " ", bold: isHeading })] });
        }),
      }],
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

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f5ff" }}>
        <p style={{ color: "#6c3fc5", fontSize: 18 }}>Loading…</p>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const credits = profile?.credits ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f5ff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#1a1a2e" }}>Dr. Dissertation</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "#f0ebff", color: "#6c3fc5", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>
            {credits} credit{credits !== 1 ? "s" : ""}
          </div>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {firstName} ▾
            </button>
            {showDropdown && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", minWidth: 160, zIndex: 100 }}>
                <Link href="/account" style={{ display: "block", padding: "12px 18px", color: "#333", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>My Account</Link>
                <Link href="/admin" style={{ display: "block", padding: "12px 18px", color: "#333", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Admin Panel</Link>
                <button onClick={handleSignOut} style={{ display: "block", width: "100%", padding: "12px 18px", color: "#e74c3c", background: "none", border: "none", textAlign: "left", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "32px auto", padding: "0 24px" }}>
        {/* Credits / Purchase banner */}
        {credits === 0 && (
          <div style={{ background: "#fff0f0", border: "1px solid #f5c6cb", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#c0392b", fontWeight: 600 }}>You have no credits. Purchase to run a review.</span>
            <Link href="/api/checkout" style={{ background: "#6c3fc5", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Buy Credits</Link>
          </div>
        )}

        {/* New Review Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 20, color: "#1a1a2e" }}>New Review</h2>
          <FileUpload onFileSelect={(f) => { setSelectedFile(f); setReview(""); setReviewError(""); }} />

          <div style={{ marginTop: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
              <input type="radio" name="doctype" checked={docType === "proposal"} onChange={() => setDocType("proposal")} disabled={reviewing} />
              Proposal (Ch. 1–3)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
              <input type="radio" name="doctype" checked={docType === "full"} onChange={() => setDocType("full")} disabled={reviewing} />
              Full Dissertation (Ch. 1–5)
            </label>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={generateReview}
              disabled={reviewing || !selectedFile || credits === 0}
              style={{ background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: (reviewing || !selectedFile || credits === 0) ? 0.6 : 1 }}
            >
              {reviewing ? "Generating…" : "Get My Review →"}
            </button>
            <button
              onClick={() => downloadDocx(review, selectedFile?.name)}
              disabled={!review}
              style={{ background: "#f0ebff", color: "#6c3fc5", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: !review ? 0.5 : 1 }}
            >
              Download .docx
            </button>
          </div>

          {reviewing && (
            <div style={{ marginTop: 16, background: "#f8f5ff", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: "#1a1a2e" }}>In progress…</div>
              {statusMsg && <div style={{ color: "#6c3fc5", fontSize: 14, fontWeight: 600 }}>{statusMsg}</div>}
              <div style={{ color: "#999", fontSize: 12, marginTop: 6 }}>Long dissertations take 2–5 minutes.</div>
            </div>
          )}

          {reviewError && (
            <div style={{ marginTop: 14, background: "#fff0f0", color: "#c0392b", padding: "12px 16px", borderRadius: 10, fontSize: 14 }}>
              ⚠️ {reviewError}
            </div>
          )}

          {review && (
            <div style={{ marginTop: 20, background: "#f8f5ff", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: "#1a1a2e" }}>Your Review</span>
                <button onClick={() => downloadDocx(review, selectedFile?.name)} style={{ background: "#6c3fc5", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Download .docx
                </button>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, lineHeight: 1.6, color: "#333", margin: 0 }}>{review}</pre>
            </div>
          )}
        </div>

        {/* Past Reviews */}
        {reviews.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, color: "#1a1a2e" }}>Past Reviews</h2>
            {reviews.map((r) => (
              <div key={r.id} style={{ borderBottom: "1px solid #f0f0f0", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14 }}>{r.file_name}</div>
                  <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>{new Date(r.created_at).toLocaleDateString()} · {r.document_type}</div>
                </div>
                <button
                  onClick={() => downloadDocx(r.review_text, r.file_name)}
                  style={{ background: "#f0ebff", color: "#6c3fc5", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
