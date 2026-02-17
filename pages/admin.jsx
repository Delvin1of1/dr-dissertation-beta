// pages/admin.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { signOut } from "../lib/auth-helpers";

const ADMIN_EMAIL = "jchick@bridgeport.edu";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantType, setGrantType] = useState("credits_quicklook_regular");
  const [grantAmount, setGrantAmount] = useState(1);
  const [grantMsg, setGrantMsg] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      if (session.user.email !== ADMIN_EMAIL) { router.push("/dashboard"); return; }
      setUser(session.user);
      const [u, r, t, p] = await Promise.all([
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
      ]);
      setUsers(u.data || []);
      setReviews(r.data || []);
      setTransactions(t.data || []);
      setPromoCodes(p.data || []);
      setLoading(false);
    }
    init();
  }, [router]);

  async function grantCredits() {
    setGrantMsg("");
    const res = await fetch("/api/admin/grant-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: grantUserId, creditType: grantType, credits: Number(grantAmount) }),
    });
    const data = await res.json();
    setGrantMsg(res.ok ? `Granted ${grantAmount} credit(s)!` : `Error: ${data.error}`);
    if (res.ok) {
      const { data: ul } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      setUsers(ul || []);
    }
  }

  const totalRevenue = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const mailingList = users.filter(u => u.mailing_list_opt_in);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p>Loading…</p>
    </div>
  );

  const S = { th: { padding:"12px 14px", textAlign:"left", fontWeight:700, color:"#444", borderBottom:"1px solid #eee", whiteSpace:"nowrap" }, td: { padding:"11px 14px", borderBottom:"1px solid #f5f5f5" } };

  return (
    <div style={{ minHeight:"100vh", background:"#f8f5ff", fontFamily:"'Inter',system-ui,-apple-system,sans-serif" }}>
      <nav style={{ background:"#fff", borderBottom:"1px solid #eee", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:80 }}>
        <div style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <Link href="/dashboard">
            <img src="/logo-header-perfect.svg" alt="Dr. Dissertation" height={48} style={{ display:"block", maxWidth:240 }} />
          </Link>
          <div style={{ fontSize:13, fontWeight:800, color:"#6c3fc5", marginTop:4, letterSpacing:"0.01em" }}>Admin Dashboard</div>
        </div>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <Link href="/dashboard" style={{ color:"#6c3fc5", fontSize:13, fontWeight:600, textDecoration:"none" }}>← Dashboard</Link>
          <button onClick={async () => { await signOut(); router.push("/auth/login"); }} style={{ color:"#e74c3c", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:600 }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:"32px auto", padding:"0 24px" }}>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
          {[
            { label:"Total Users", value: users.length, icon:"👥" },
            { label:"Total Reviews", value: reviews.length, icon:"📄" },
            { label:"Revenue", value:`$${(totalRevenue/100).toFixed(2)}`, icon:"💳" },
            { label:"Mailing List", value: mailingList.length, icon:"📬" },
          ].map(s => (
            <div key={s.label} style={{ background:"#fff", borderRadius:14, padding:"20px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:30, fontWeight:900, color:"#6c3fc5" }}>{s.value}</div>
              <div style={{ color:"#777", fontSize:12, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", borderRadius:14, padding:"24px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", marginBottom:28 }}>
          <h3 style={{ margin:"0 0 16px", color:"#1a1a2e", fontSize:15, fontWeight:800 }}>⚡ Grant Credits</h3>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <select value={grantUserId} onChange={e => setGrantUserId(e.target.value)} style={{ flex:2, padding:"10px 14px", borderRadius:8, border:"1.5px solid #ddd", fontSize:14, minWidth:200 }}>
              <option value="">Select user…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>
            <select value={grantType} onChange={e => setGrantType(e.target.value)} style={{ flex:2, padding:"10px 14px", borderRadius:8, border:"1.5px solid #ddd", fontSize:14, minWidth:180 }}>
              <option value="credits_quicklook_first">QuickLook (First)</option>
              <option value="credits_quicklook_regular">QuickLook Regular</option>
              <option value="credits_full_review">Full Review</option>
            </select>
            <input type="number" min={1} max={50} value={grantAmount} onChange={e => setGrantAmount(e.target.value)} style={{ width:70, padding:"10px 12px", borderRadius:8, border:"1.5px solid #ddd", fontSize:14, textAlign:"center" }} />
            <button onClick={grantCredits} disabled={!grantUserId} style={{ background:"#6c3fc5", color:"#fff", border:"none", borderRadius:8, padding:"10px 22px", fontWeight:700, fontSize:14, cursor:"pointer", opacity:!grantUserId?0.55:1 }}>Grant</button>
          </div>
          {grantMsg && <div style={{ marginTop:12, fontSize:14, color: grantMsg.includes("Error") ? "#c0392b" : "#27ae60", fontWeight:600 }}>{grantMsg}</div>}
        </div>

        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {[
            { key:"users", label:`👥 Users (${users.length})` },
            { key:"reviews", label:`📄 Reviews (${reviews.length})` },
            { key:"transactions", label:`💳 Transactions (${transactions.length})` },
            { key:"mailing", label:`📬 Mailing List (${mailingList.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:"8px 20px", borderRadius:8, border:"none", background: tab===t.key?"#6c3fc5":"#fff", color: tab===t.key?"#fff":"#555", fontWeight:700, fontSize:14, cursor:"pointer" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div style={{ background:"#fff", borderRadius:14, overflow:"auto", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr style={{ background:"#f8f5ff" }}>
                {["Name","Email","QL First","QL Regular","Full Review","Joined","Admin","Mailing"].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ ...S.td, fontWeight:600, color:"#1a1a2e" }}>{u.full_name||"—"}</td>
                    <td style={{ ...S.td, color:"#555" }}>{u.email}</td>
                    <td style={{ ...S.td, color:"#6c3fc5", fontWeight:700, textAlign:"center" }}>{u.credits_quicklook_first??u.credits??0}</td>
                    <td style={{ ...S.td, color:"#6c3fc5", fontWeight:700, textAlign:"center" }}>{u.credits_quicklook_regular??0}</td>
                    <td style={{ ...S.td, color:"#6c3fc5", fontWeight:700, textAlign:"center" }}>{u.credits_full_review??0}</td>
                    <td style={{ ...S.td, color:"#999" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ ...S.td, textAlign:"center" }}>{u.is_admin?"✅":"—"}</td>
                    <td style={{ ...S.td, textAlign:"center" }}>{u.mailing_list_opt_in?"✅":"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "reviews" && (
          <div style={{ background:"#fff", borderRadius:14, overflow:"auto", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr style={{ background:"#f8f5ff" }}>
                {["File","Type","User","Date"].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {reviews.map(r => {
                  const owner = users.find(u => u.id === r.user_id);
                  return (
                    <tr key={r.id}>
                      <td style={{ ...S.td, fontWeight:600, color:"#1a1a2e" }}>{r.file_name}</td>
                      <td style={S.td}><span style={{ background:"#f0ebff", color:"#6c3fc5", borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700 }}>{r.document_type}</span></td>
                      <td style={{ ...S.td, color:"#555" }}>{owner?.email||r.user_id?.slice(0,8)+"…"}</td>
                      <td style={{ ...S.td, color:"#999" }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "transactions" && (
          <div>
            <div style={{ background:"linear-gradient(135deg,#6c3fc5,#9b6ef3)", borderRadius:14, padding:"20px 28px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ color:"rgba(255,255,255,0.8)", fontSize:14, fontWeight:600 }}>Total Revenue</div>
              <div style={{ color:"#fff", fontSize:32, fontWeight:900 }}>${(totalRevenue/100).toFixed(2)}</div>
            </div>
            <div style={{ background:"#fff", borderRadius:14, overflow:"auto", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr style={{ background:"#f8f5ff" }}>
                  {["User","Product","Amount","Status","Date","Stripe Session"].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding:"24px", textAlign:"center", color:"#aaa" }}>No transactions yet</td></tr>
                  ) : transactions.map(t => {
                    const owner = users.find(u => u.id === t.user_id);
                    return (
                      <tr key={t.id}>
                        <td style={{ ...S.td, color:"#555" }}>{owner?.email||t.user_id?.slice(0,8)+"…"}</td>
                        <td style={{ ...S.td, fontWeight:600, color:"#1a1a2e" }}>{(t.product_id||"").replace(/_/g," ")}</td>
                        <td style={{ ...S.td, color:"#27ae60", fontWeight:700 }}>${((t.amount||0)/100).toFixed(2)}</td>
                        <td style={S.td}><span style={{ background:t.status==="completed"?"#dcfce7":"#fef9c3", color:t.status==="completed"?"#166534":"#854d0e", borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700 }}>{t.status||"—"}</span></td>
                        <td style={{ ...S.td, color:"#999" }}>{t.created_at?new Date(t.created_at).toLocaleDateString():"—"}</td>
                        <td style={{ ...S.td, color:"#bbb", fontSize:11, fontFamily:"monospace" }}>{(t.stripe_session_id||"").slice(0,24)}{t.stripe_session_id?"…":""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "mailing" && (
          <div style={{ background:"#fff", borderRadius:14, overflow:"auto", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #f0f0f0" }}>
              <span style={{ fontWeight:700, color:"#1a1a2e" }}>📬 {mailingList.length} subscribers opted in</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr style={{ background:"#f8f5ff" }}>
                {["Name","Email","Joined"].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {mailingList.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding:"24px", textAlign:"center", color:"#aaa" }}>No subscribers yet</td></tr>
                ) : mailingList.map(u => (
                  <tr key={u.id}>
                    <td style={{ ...S.td, fontWeight:600, color:"#1a1a2e" }}>{u.full_name||"—"}</td>
                    <td style={{ ...S.td, color:"#555" }}>{u.email}</td>
                    <td style={{ ...S.td, color:"#999" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
