// pages/features/secure/index.jsx
import Link from "next/link";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";

export default function FeatureSecure() {
  return (
    <>
      <Navigation />
      <section className="hero" style={{ padding: "80px 24px 60px" }}>
        <div className="hero-badge"><span className="hero-badge-dot" />Security</div>
        <h1>🔒 <span className="highlight">Secure &amp; Private</span></h1>
        <p className="hero-sub">Your dissertation is confidential. We take that seriously.</p>
        <Link href="/auth/signup" className="btn-primary">Start Free Review →</Link>
      </section>
      <section className="section" style={{ background: "#f8fafc" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20, marginTop: 20 }}>
            {[
              { icon: "🔐", title: "End-to-End Encryption", desc: "Your document is encrypted in transit and at rest using AES-256 and TLS 1.3." },
              { icon: "🚫", title: "Not Used for Training", desc: "Your dissertation is never used to train AI models. Your work remains yours." },
              { icon: "🏛️", title: "FERPA Aware", desc: "Our security practices are designed with FERPA educational privacy standards in mind." },
              { icon: "🗑️", title: "Automatic Deletion", desc: "Raw PDF files are deleted from our servers after your review is complete." },
              { icon: "👤", title: "Private by Default", desc: "Your review results are only visible to you — never shared, never indexed." },
              { icon: "☁️", title: "Enterprise Infrastructure", desc: "Hosted on Vercel and Supabase — enterprise-grade platforms with SOC 2 compliance." },
            ].map(s => (
              <div key={s.title} style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/auth/signup" className="btn-primary">Review Securely →</Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
