// pages/contact/index.jsx
import { useState } from "react";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSent(true);
    } catch {
      setError("Failed to send message. Please email us directly at support@doctordissertation.com");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Navigation />
      <section className="hero" style={{ padding: "80px 24px 60px" }}>
        <h1 style={{ fontSize: "clamp(2rem,4vw,2.8rem)" }}>Get in <span className="highlight">Touch</span></h1>
        <p className="hero-sub">Have questions? We&apos;d love to hear from you.</p>
      </section>

      <section className="section" style={{ background: "#f8fafc", paddingTop: 40 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          {sent ? (
            <div style={{ textAlign: "center", background: "#fff", borderRadius: 20, padding: "48px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
              <h2 style={{ color: "#1e293b", marginBottom: 12 }}>Message Sent!</h2>
              <p style={{ color: "#64748b" }}>We&apos;ll get back to you within 1–2 business days at <strong>{email}</strong>.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 14, color: "#374151", marginBottom: 8 }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Dr. Jane Smith" style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 14, color: "#374151", marginBottom: 8 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 14, color: "#374151", marginBottom: 8 }}>Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5} placeholder="How can we help you?" style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              {error && <div style={{ background: "#fff0f0", color: "#c0392b", padding: "12px 16px", borderRadius: 10, fontSize: 14, marginBottom: 16 }}>{error}</div>}
              <button type="submit" disabled={sending} className="btn-primary" style={{ width: "100%", border: "none", cursor: "pointer", fontSize: 16 }}>
                {sending ? "Sending…" : "Send Message →"}
              </button>
            </form>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
            {[
              { label: "General Support", email: "support@doctordissertation.com" },
              { label: "Partnerships", email: "partnerships@doctordissertation.com" },
              { label: "Dr. Dissertation Directly", email: "drchick@doctordissertation.com" },
              { label: "Reviews", email: "reviews@doctordissertation.com" },
            ].map(c => (
              <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "20px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 4 }}>{c.label}</div>
                <a href={`mailto:${c.email}`} style={{ color: "#6366F1", fontSize: 13, textDecoration: "none" }}>{c.email}</a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
