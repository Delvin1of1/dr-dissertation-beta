// pages/account.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { signOut } from "../lib/auth-helpers";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mailingList, setMailingList] = useState(false);
  const [message, setMessage] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUser(session.user);
      const { data: prof } = await supabase.from("users").select("*").eq("id", session.user.id).single();
      setProfile(prof);
      setFullName(prof?.full_name || "");
      setMailingList(prof?.mailing_list_opt_in || false);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("users").update({ full_name: fullName, mailing_list_opt_in: mailingList }).eq("id", user.id);
    setSaving(false);
    setMessage(error ? "Error saving changes." : "Changes saved!");
  }

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p>Loading…</p></div>;

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const credits = profile?.credits ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f5ff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70 }}>
        <Link href="/dashboard">
          <img src="/logo-header-perfect.svg" alt="Dr. Dissertation" height={48} style={{ display: "block", maxWidth: 240 }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "#f0ebff", color: "#6c3fc5", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>
            {credits} credit{credits !== 1 ? "s" : ""}
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowDropdown(!showDropdown)} style={{ background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {firstName} ▾
            </button>
            {showDropdown && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", minWidth: 160, zIndex: 100 }}>
                <Link href="/dashboard" style={{ display: "block", padding: "12px 18px", color: "#333", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Dashboard</Link>
                {profile?.is_admin && (
                  <Link href="/admin" style={{ display: "block", padding: "12px 18px", color: "#6c3fc5", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>⚙️ Admin Panel</Link>
                )}
                <button onClick={handleSignOut} style={{ display: "block", width: "100%", padding: "12px 18px", color: "#e74c3c", background: "none", border: "none", textAlign: "left", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 24px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 22, color: "#1a1a2e" }}>My Account</h2>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #ddd", borderRadius: 10, fontSize: 15, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Email</label>
              <input value={user?.email || ""} disabled style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #eee", borderRadius: 10, fontSize: 15, background: "#f9f9f9", color: "#999", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Credits Remaining</label>
              <div style={{ padding: "11px 14px", background: "#f8f5ff", borderRadius: 10, fontWeight: 700, color: "#6c3fc5", fontSize: 15 }}>{credits}</div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer", color: "#555" }}>
              <input type="checkbox" checked={mailingList} onChange={(e) => setMailingList(e.target.checked)} />
              Receive updates &amp; tips from Dr. Chick
            </label>

            {message && <div style={{ background: message.includes("Error") ? "#fff0f0" : "#f0fff4", color: message.includes("Error") ? "#c0392b" : "#27ae60", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>{message}</div>}

            <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Buy Credits */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <h3 style={{ margin: "0 0 16px", color: "#1a1a2e" }}>Purchase Credits</h3>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Choose from QuickLook or Full Review credits — no subscription required.</p>
          <Link href="/checkout" style={{ display: "inline-block", background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", color: "#fff", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
            Purchase Credits →
          </Link>
        </div>
      </div>
    </div>
  );
}
