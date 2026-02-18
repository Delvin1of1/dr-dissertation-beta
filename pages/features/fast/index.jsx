// pages/features/fast/index.jsx
import Link from "next/link";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";

export default function FeatureFast() {
  return (
    <>
      <Navigation />
      <section className="hero" style={{ padding: "80px 24px 60px" }}>
        <div className="hero-badge"><span className="hero-badge-dot" />Feature</div>
        <h1>⚡ <span className="highlight">Lightning Fast</span> Reviews</h1>
        <p className="hero-sub">Get critical feedback in minutes, not weeks.</p>
        <Link href="/auth/signup" className="btn-primary">Start First Review →</Link>
      </section>
      <section className="section">
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 className="section-title">How We Achieve Lightning Speed</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24, marginTop: 48 }}>
            {[
              { step: "1", title: "Intelligent Chunking", desc: "Your document is split into optimized sections for parallel processing — no waiting for one big analysis." },
              { step: "2", title: "Parallel Analysis", desc: "Each section is analyzed simultaneously using advanced AI, dramatically cutting processing time." },
              { step: "3", title: "Priority Synthesis", desc: "Results are merged and ranked by importance, so you see the most critical issues first." },
              { step: "4", title: "Instant Delivery", desc: "Your full HAIST© review is delivered in your browser and available to download as a Word document immediately." },
            ].map(s => (
              <div key={s.step} style={{ background: "#f8fafc", borderRadius: 16, padding: 28, borderTop: "3px solid #6366F1" }}>
                <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 16 }}>{s.step}</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#1e293b", marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 56 }}>
            <Link href="/auth/signup" className="btn-primary">Get Your Review in 10 Minutes →</Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
