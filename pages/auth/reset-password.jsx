// pages/auth/reset-password.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyLink() {
      // Handle PKCE flow (?code=xxx)
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setSessionReady(true);
          setVerifying(false);
          return;
        }
      }

      // Handle implicit hash flow (#access_token=xxx)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const hashParams = new URLSearchParams(hash.replace("#", ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (type === "recovery" && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            window.history.replaceState(null, "", window.location.pathname);
            setSessionReady(true);
            setVerifying(false);
            return;
          }
        }
      }

      // Check if already have a valid session
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSessionReady(true);
      }

      setVerifying(false);
    }

    verifyLink();
  }, []);

  async function handleReset(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p style={{ color: "#666" }}>Verifying reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ margin: "0 0 12px", color: "#1a1a2e" }}>Link Expired</h2>
            <p style={{ color: "#666", marginBottom: 24 }}>This reset link has expired or already been used.</p>
            <a href="/auth/forgot-password" style={styles.btn}>Request New Link →</a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ margin: "0 0 12px", color: "#1a1a2e" }}>Password Updated!</h2>
            <p style={{ color: "#666" }}>Redirecting to your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>Dr. Dissertation</h1>
          <p style={styles.sub}>Choose a new password</p>
        </div>

        <form onSubmit={handleReset} style={styles.form}>
          <label style={styles.label}>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={styles.input}
            placeholder="Min. 6 characters"
          />

          <label style={styles.label}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="Repeat password"
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Updating…" : "Update Password →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#6c3fc5 0%,#9b6ef3 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { background: "#fff", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" },
  header: { textAlign: "center", marginBottom: 28 },
  logo: { margin: 0, fontSize: 26, fontWeight: 900, color: "#1a1a2e" },
  sub: { margin: "6px 0 0", color: "#777", fontSize: 14 },
  form: { display: "flex", flexDirection: "column" },
  label: { fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 },
  input: { padding: "11px 14px", border: "1.5px solid #ddd", borderRadius: 10, fontSize: 15, marginBottom: 16, outline: "none" },
  btn: { background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-block", textAlign: "center" },
  error: { background: "#fff0f0", color: "#c0392b", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 },
};
