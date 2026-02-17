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
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantAmount, setGrantAmount] = useState(1);
  const [grantMsg, setGrantMsg] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      if (session.user.email !== ADMIN_EMAIL) { router.push("/dashboard"); return; }
      setUser(session.user);

      const { data: userList } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      setUsers(userList || []);
      const { data: reviewList } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      setReviews(reviewList || []);
      setLoading(false);
    }
    init();
  }, [router]);

  async function grantCredits() {
    setGrantMsg("");
    const res = await fetch("/api/admin/grant-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: grantUserId, credits: Number(grantAmount) }),
    });
    const data = await res.json();
    setGrantMsg(res.ok ? `✅ Granted ${grantAmount} credit(s)!` : `❌ ${data.error}`);

    if (res.ok) {
      const { data: userList } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      setUsers(userList || []);
    }
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p>Loading…</p></div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0f5", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <nav style={{ background: "#1a1a2e", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <span style={{ fontWeight: 900, color: "#fff", fontSize: 16 }}>Admin Panel — Dr. Dissertation</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/dashboard" style={{ color: "#aaa", fontSize: 13, textDecoration: "none" }}>Dashboard</Link>
          <button onClick={async () => { await signOut(); router.push("/auth/login"); }} style={{ color: "#e74c3c", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "32px auto", padding: "0 24px" }}>
        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Users", value: users.length },
            { label: "Total Reviews", value: reviews.length },
            { label: "Total Credits Sold", value: users.reduce((acc, u) => acc + (u.total_credits_purchased || 0), 0) },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#6c3fc5" }}>{stat.value}</div>
              <div style={{ color: "#777", fontSize: 13, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Grant Credits */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 28 }}>
          <h3 style={{ margin: "0 0 16px", color: "#1a1a2e" }}>Grant Credits</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14 }}>
              <option value="">Select user…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.credits} credits)</option>)}
            </select>
            <input type="number" min={1} max={50} value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} style={{ width: 80, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14 }} />
            <button onClick={grantCredits} disabled={!grantUserId} style={{ background: "#6c3fc5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Grant Credits
            </button>
          </div>
          {grantMsg && <div style={{ marginTop: 12, fontSize: 14, color: grantMsg.includes("✅") ? "#27ae60" : "#c0392b" }}>{grantMsg}</div>}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["users", "reviews"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: tab === t ? "#6c3fc5" : "#fff", color: tab === t ? "#fff" : "#555", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8f5ff" }}>
                  {["Name", "Email", "Credits", "Joined", "Mailing List"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#444", borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "12px 16px", color: "#1a1a2e", fontWeight: 600 }}>{u.full_name || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#555" }}>{u.email}</td>
                    <td style={{ padding: "12px 16px", color: "#6c3fc5", fontWeight: 700 }}>{u.credits}</td>
                    <td style={{ padding: "12px 16px", color: "#999" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "12px 16px" }}>{u.mailing_list_opt_in ? "✅" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "reviews" && (
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8f5ff" }}>
                  {["File", "Type", "Date"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#444", borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "12px 16px", color: "#1a1a2e", fontWeight: 600 }}>{r.file_name}</td>
                    <td style={{ padding: "12px 16px", color: "#555" }}>{r.document_type}</td>
                    <td style={{ padding: "12px 16px", color: "#999" }}>{new Date(r.created_at).toLocaleDateString()}</td>
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
