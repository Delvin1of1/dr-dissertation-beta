// pages/features/expert/index.jsx
import Link from "next/link";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";

export default function FeatureExpert() {
  return (
    <>
      <Navigation />
      <section className="hero" style={{ padding: "80px 24px 60px" }}>
        <div className="hero-badge"><span className="hero-badge-dot" />Expert Team</div>
        <h1>🎓 <span className="highlight">Expert-Developed</span></h1>
        <p className="hero-sub">
          Created by John C. Chick, Ed.D. and Laura Morello, Ed.D. — dissertation
          committee chairs and educational AI specialists with decades of academic experience.
        </p>
        <Link href="/auth/signup" className="btn-primary">Start First Review →</Link>
      </section>
      <section className="section" style={{ background: "#f8fafc" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginBottom: 56, textAlign: "center" }}>
            {[["2,000+", "Dissertations Reviewed"], ["15+", "Years Experience"], ["10+", "AI Projects Deployed"]].map(([n, l]) => (
              <div key={l} style={{ background: "#fff", borderRadius: 16, padding: "28px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: 36, fontWeight: 800, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
                <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
            {[
              { title: "John C. Chick, Ed.D.", desc: "Dr. Chick has chaired hundreds of dissertation committees and spent 15+ years identifying the patterns that cause defenses to fail. He co-developed the HAIST© framework to bring that expertise to every doctoral student.", icon: "🎓" },
              { title: "Laura Morello, Ed.D.", desc: "Dr. Morello brings deep expertise in educational research methodology and academic standards across disciplines. Her insights inform HAIST©'s rigorous approach to evaluating scholarly contribution and writing quality.", icon: "🎓" },
            ].map(c => (
              <div key={c.title} style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b", marginBottom: 10 }}>{c.title}</div>
                <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🤖</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b", marginBottom: 10 }}>Educational AI Specialists</div>
            <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>Our AI team has deployed over 10 educational AI projects, ensuring the technology accurately reflects academic standards rather than producing generic writing advice. Every output is calibrated to real committee expectations.</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Link href="/auth/signup" className="btn-primary">Experience Expert-Level Review →</Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
