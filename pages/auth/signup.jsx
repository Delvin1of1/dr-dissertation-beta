// pages/auth/signup.jsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signUpWithEmail, signInWithGoogle } from "../../lib/auth-helpers";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mailingList, setMailingList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUpWithEmail({ email, password, fullName, mailingList });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ margin: "0 0 12px", color: "#1a1a2e" }}>Check your email!</h2>
            <p style={{ color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click it to activate your account.
            </p>
            <Link href="/auth/login" style={styles.link}>Back to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <img src="/logo-header-perfect.svg" alt="Dr. Dissertation" style={{ height: 68, maxWidth: 340, marginBottom: 16 }} />
          <p style={styles.sub}>Create your free account</p>
        </div>

        <button onClick={handleGoogle} style={styles.googleBtn}>
          <img src="/google-icon.svg" alt="" width={18} height={18} style={{ marginRight: 8 }} />
          Continue with Google
        </button>

        <div style={styles.divider}><span>or</span></div>

        <form onSubmit={handleSignup} style={styles.form}>
          <label style={styles.label}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={styles.input}
            placeholder="Dr. Jane Smith"
          />

          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="you@example.com"
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={styles.input}
            placeholder="Min. 6 characters"
          />

          <label style={{ ...styles.checkLabel }}>
            <input
              type="checkbox"
              checked={mailingList}
              onChange={(e) => setMailingList(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Subscribe to updates &amp; tips from Dr. Dissertation
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Creating account…" : "Create Free Account →"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link href="/auth/login" style={styles.link}>Sign in</Link>
        </p>
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
  googleBtn: { width: "100%", padding: "12px", border: "1.5px solid #ddd", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  divider: { textAlign: "center", margin: "0 0 20px", color: "#aaa", fontSize: 13 },
  form: { display: "flex", flexDirection: "column" },
  label: { fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 },
  checkLabel: { fontSize: 13, color: "#555", marginBottom: 16, display: "flex", alignItems: "center", cursor: "pointer" },
  input: { padding: "11px 14px", border: "1.5px solid #ddd", borderRadius: 10, fontSize: 15, marginBottom: 16, outline: "none" },
  btn: { background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 },
  error: { background: "#fff0f0", color: "#c0392b", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 },
  footer: { textAlign: "center", marginTop: 24, fontSize: 14, color: "#777" },
  link: { color: "#6c3fc5", fontWeight: 600, textDecoration: "none" },
};
