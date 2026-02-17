// pages/auth/forgot-password.jsx
import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "../../lib/auth-helpers";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ margin: "0 0 12px", color: "#1a1a2e" }}>Check your email</h2>
            <p style={{ color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
              We sent a password reset link to <strong>{email}</strong>.
            </p>
            <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
              Didn&apos;t get it?{" "}
              <button onClick={() => setSent(false)} style={{ color: "#6c3fc5", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                Try again
              </button>
            </p>
            <Link href="/auth/login" style={styles.link}>Back to Sign In</Link>
          </div>
        ) : (
          <>
            <div style={styles.header}>
              <h1 style={styles.logo}>Dr. Dissertation</h1>
              <p style={styles.sub}>Reset your password</p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="you@example.com"
              />

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? "Sending…" : "Send Reset Link →"}
              </button>
            </form>

            <p style={styles.footer}>
              <Link href="/auth/login" style={styles.link}>← Back to Sign In</Link>
            </p>
          </>
        )}
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
  btn: { background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  error: { background: "#fff0f0", color: "#c0392b", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 },
  footer: { textAlign: "center", marginTop: 24, fontSize: 14 },
  link: { color: "#6c3fc5", fontWeight: 600, textDecoration: "none" },
};
