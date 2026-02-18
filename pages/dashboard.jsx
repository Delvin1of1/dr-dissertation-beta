// pages/dashboard.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { signOut } from "../lib/auth-helpers";
import FileUpload from "../components/FileUpload";
import PromoCodeInput from "../components/PromoCodeInput";
import { Document, Packer, Paragraph, TextRun } from "docx";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState("full");
  const [reviewing, setReviewing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [review, setReview] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUser(session.user);
      const { data: prof } = await supabase.from("users").select("*").eq("id", session.user.id).single();
      setProfile(prof);
      setLoading(false);
    }
    init();
    const handler = (e) => { if (!e.target.closest("#acct-dd")) setShowDropdown(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [router]);

  async function refreshProfile() {
    if (!user) return;
    const { data: prof } = await supabase.from("users").select("*").eq("id", user.id).single();
    setProfile(prof);
  }

  async function callApi(body) {
    const res = await fetch("/api/process-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
    return data;
  }

  async function generateReview() {
    setReviewError(""); setReview(""); setStatusMsg("");
    if (!selectedFile) { setReviewError("Please select a PDF first."); return; }
    const totalCredits = (profile?.credits ?? 0) + (profile?.credits_quicklook_first ?? 0) + (profile?.credits_quicklook_regular ?? 0) + (profile?.credits_full_review ?? 0);
    if (totalCredits <= 0) { setReviewError("You have no credits remaining. Purchase more to run a review."); return; }

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

      await fetch("/api/deduct-credit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
      await supabase.from("reviews").insert({ user_id: user.id, file_name: fileName, document_type: docType, review_text: finalData.review });
      setReview(finalData.review);
      setStatusMsg("");
      await refreshProfile();
    } catch (e) {
      const msg = e?.message || "Something went wrong. Please try again.";
      setReviewError(msg.includes("429") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("too many")
        ? "The AI service is busy right now. Please wait 30 seconds and try again." : msg);
    } finally {
      setReviewing(false);
    }
  }

  async function downloadDocx(text, fileName) {
    const baseName = (fileName || "HAIST_Review").replace(/\.[^/.]+$/, "").trim();
    const lines = (text || review).split("\n");
    const doc = new Document({ sections: [{ properties: {}, children: lines.map((line) => {
      const isHeading = line.trim().startsWith("#") || /^[A-Z][A-Za-z0-9\s\-:&]+:$/.test(line.trim());
      const clean = line.replace(/^#+\s*/, "");
      return new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: clean.length ? clean : " ", bold: isHeading })] });
    })}] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${baseName}_HAIST_Review.docx`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#f8f5ff" }}>
        <img src="/logo-header-perfect.svg" alt="Dr. Dissertation" height={73} style={{ marginBottom:20, maxWidth:365 }} />
        <p style={{ color:"#6c3fc5" }}>Loading…</p>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const isAdmin = user?.email === "jchick@bridgeport.edu" || profile?.is_admin;
  const qlFirst = profile?.credits_quicklook_first ?? (profile?.credits ?? 0);
  const qlReg   = profile?.credits_quicklook_regular ?? 0;
  const ql      = qlFirst + qlReg;   // combined QuickLook
  const full    = profile?.credits_full_review ?? 0;
  const totalCredits = ql + full;

  return (
    <div style={{ minHeight:"100vh", background:"#f8f5ff", fontFamily:"'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #eee", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:96, position:"sticky", top:0, zIndex:50 }}>
        <Link href="/">
          <img src="/logo-header-perfect.svg" alt="Dr. Dissertation" height={73} style={{ display:"block", maxWidth:365 }} />
        </Link>
        <div id="acct-dd" style={{ position:"relative" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            style={{ background:"linear-gradient(135deg,#6c3fc5,#9b6ef3)", color:"#fff", border:"none", borderRadius:20, padding:"8px 18px", fontSize:14, fontWeight:700, cursor:"pointer" }}
          >
            My Account ▾
          </button>
          {showDropdown && (
            <div style={{ position:"absolute", right:0, top:"calc(100% + 10px)", background:"#fff", borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.14)", minWidth:220, zIndex:100, overflow:"hidden", border:"1px solid #f0f0f0" }}>
              {/* User info header */}
              <div style={{ padding:"14px 18px", borderBottom:"2px solid #f0ebff", background:"#faf8ff" }}>
                <div style={{ fontWeight:700, color:"#1a1a2e", fontSize:14, marginBottom:2 }}>{profile?.full_name || firstName}</div>
                <div style={{ fontSize:12, color:"#888", fontWeight:400 }}>{user?.email}</div>
              </div>
              <Link href="/account" style={{ display:"block", padding:"13px 18px", color:"#1a1a2e", textDecoration:"none", fontSize:14, fontWeight:600, borderBottom:"1px solid #f5f5f5" }}>⚙️ Account Settings</Link>
              {isAdmin && (
                <Link href="/admin" style={{ display:"block", padding:"13px 18px", color:"#6c3fc5", textDecoration:"none", fontSize:14, fontWeight:600, borderBottom:"1px solid #f5f5f5" }}>🛡️ Admin Panel</Link>
              )}
              <button onClick={async () => { await signOut(); router.push("/auth/login"); }} style={{ display:"block", width:"100%", padding:"13px 18px", color:"#e74c3c", background:"none", border:"none", textAlign:"left", fontSize:14, fontWeight:600, cursor:"pointer" }}>Sign Out</button>
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"32px 24px 64px" }}>

        {/* WELCOME */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:26, fontWeight:800, color:"#1a1a2e", margin:"0 0 4px" }}>Welcome back, {firstName}! 👋</h1>
          <p style={{ fontSize:15, color:"#888", margin:0 }}>Ready to strengthen your dissertation?</p>
        </div>

        {/* PROMO CODE */}
        <div style={{ marginBottom:18 }}>
          {showPromo ? (
            <PromoCodeInput userId={user?.id} onSuccess={refreshProfile} />
          ) : (
            <button
              onClick={() => setShowPromo(true)}
              style={{ background:"none", border:"none", color:"#6c3fc5", fontSize:13, fontWeight:600, cursor:"pointer", textDecoration:"underline", padding:0 }}
            >
              Have a promo code?
            </button>
          )}
        </div>

        {/* NO CREDITS BANNER */}
        {totalCredits === 0 && (
          <div style={{ background:"#fff0f0", border:"1px solid #f5c6cb", borderRadius:12, padding:"14px 20px", marginBottom:18, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ color:"#c0392b", fontWeight:600, fontSize:14 }}>You have no credits remaining.</span>
            <Link href="/checkout" style={{ background:"#6c3fc5", color:"#fff", padding:"8px 18px", borderRadius:8, fontSize:14, fontWeight:700, textDecoration:"none" }}>Purchase Credits →</Link>
          </div>
        )}

        {/* 2-COLUMN LAYOUT: Credit tiles left, New Review right */}
        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:16, alignItems:"stretch" }}>

          {/* LEFT — 2 credit tiles stacked */}
          <div style={{ display:"flex", flexDirection:"column", gap:16, height:"100%" }}>

            {/* QuickLook tile (combined) */}
            <div style={{ background:"linear-gradient(135deg,#6c3fc5,#9b6ef3)", borderRadius:18, padding:"24px 20px", boxShadow:"0 4px 24px rgba(108,63,197,0.30)", textAlign:"center" }}>
              <div style={{ fontSize:26, marginBottom:6 }}>⚡</div>
              <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>QuickLook</div>
              <div style={{ fontSize:52, fontWeight:900, color:"#fff", lineHeight:1 }}>{ql}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:14 }}>credits</div>
              <Link href="/checkout" style={{ display:"inline-block", background:"rgba(255,255,255,0.18)", color:"#fff", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:700, textDecoration:"none" }}>Buy More</Link>
            </div>

            {/* Full Review tile */}
            <div style={{ background:"#fff", borderRadius:18, padding:"24px 20px", boxShadow:"0 2px 16px rgba(0,0,0,0.07)", textAlign:"center", flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <div style={{ fontSize:26, marginBottom:6 }}>📊</div>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Full Review</div>
              <div style={{ fontSize:52, fontWeight:900, color:"#1a1a2e", lineHeight:1 }}>{full}</div>
              <div style={{ fontSize:12, color:"#bbb", marginBottom:14 }}>credits</div>
              <Link href="/checkout" style={{ display:"inline-block", background:"#f0ebff", color:"#6c3fc5", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:700, textDecoration:"none" }}>Buy More</Link>
            </div>

          </div>

          {/* RIGHT — New Review card */}
          <div style={{ background:"#fff", borderRadius:20, padding:"28px", boxShadow:"0 2px 16px rgba(0,0,0,0.07)", height:"100%", boxSizing:"border-box" }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#1a1a2e", margin:"0 0 20px" }}>New Review</h2>

            <FileUpload onFileSelect={(f) => { setSelectedFile(f); setReview(""); setReviewError(""); }} />

            <div style={{ marginTop:20, display:"flex", gap:24, flexWrap:"wrap", justifyContent:"center" }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, color:"#444", cursor:"pointer", fontWeight:500 }}>
                <input type="radio" name="doctype" checked={docType === "proposal"} onChange={() => setDocType("proposal")} disabled={reviewing} />
                Proposal (Chapters 1–3)
              </label>
              <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, color:"#444", cursor:"pointer", fontWeight:500 }}>
                <input type="radio" name="doctype" checked={docType === "full"} onChange={() => setDocType("full")} disabled={reviewing} />
                Full Dissertation (Chapters 1–5)
              </label>
            </div>

            <div style={{ marginTop:20, display:"flex", gap:12 }}>
              <button
                onClick={generateReview}
                disabled={reviewing || !selectedFile || totalCredits === 0}
                style={{ flex:1, background:"linear-gradient(135deg,#6c3fc5,#9b6ef3)", color:"#fff", border:"none", borderRadius:12, padding:"13px 0", fontSize:15, fontWeight:700, cursor:"pointer", opacity:(reviewing || !selectedFile || totalCredits === 0) ? 0.6 : 1 }}
              >
                {reviewing ? "Generating…" : "Get My Review →"}
              </button>
              <button
                onClick={() => downloadDocx(review, selectedFile?.name)}
                disabled={!review}
                style={{ flex:1, background:"#f0ebff", color:"#6c3fc5", border:"none", borderRadius:12, padding:"13px 0", fontSize:15, fontWeight:700, cursor:"pointer", opacity:!review ? 0.5 : 1 }}
              >
                Download .docx
              </button>
            </div>

            {reviewing && (
              <div style={{ marginTop:18, background:"#f8f5ff", borderRadius:12, padding:"16px 20px", borderLeft:"4px solid #6c3fc5" }}>
                <div style={{ fontWeight:800, color:"#1a1a2e", marginBottom:4 }}>In progress…</div>
                {statusMsg && <div style={{ color:"#6c3fc5", fontSize:14, fontWeight:600 }}>{statusMsg}</div>}
                <div style={{ color:"#999", fontSize:12, marginTop:6 }}>Long dissertations take 2–5 minutes.</div>
              </div>
            )}

            {reviewError && (
              <div style={{ marginTop:14, background:"#fff0f0", color:"#c0392b", padding:"13px 16px", borderRadius:12, fontSize:14 }}>
                ⚠️ {reviewError}
              </div>
            )}

            {review && (
              <div style={{ marginTop:20, background:"#f8f5ff", borderRadius:14, padding:"20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <span style={{ fontWeight:800, color:"#1a1a2e", fontSize:16 }}>Your HAIST© Review</span>
                  <button onClick={() => downloadDocx(review, selectedFile?.name)} style={{ background:"#6c3fc5", color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    Download .docx
                  </button>
                </div>
                <pre style={{ whiteSpace:"pre-wrap", fontFamily:"inherit", fontSize:14, lineHeight:1.7, color:"#333", margin:0 }}>{review}</pre>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
