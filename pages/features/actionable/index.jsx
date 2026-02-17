// pages/features/actionable/index.jsx
import Link from "next/link";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";

export default function FeatureActionable() {
  return (
    <>
      <Navigation />
      <section className="hero" style={{ padding: "80px 24px 60px" }}>
        <div className="hero-badge"><span className="hero-badge-dot" />Feedback Quality</div>
        <h1>✓ <span className="highlight">Actionable</span> Feedback</h1>
        <p className="hero-sub">Specific, prioritized recommendations with page citations — not vague suggestions.</p>
        <Link href="/auth/signup" className="btn-primary">Start Free Review →</Link>
      </section>
      <section className="section" style={{ background: "#f8fafc" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 className="section-title">Specific vs. Generic Feedback</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 40 }}>
            <div style={{ background: "#fff0f0", borderRadius: 16, padding: 28, border: "1.5px solid #fecaca" }}>
              <div style={{ fontWeight: 700, color: "#c0392b", marginBottom: 16, fontSize: 16 }}>❌ Generic (What You Don&apos;t Get)</div>
              {["Your literature review needs improvement.", "The methodology section is unclear.", "Strengthen your argument.", "Add more citations."].map(t => (
                <div key={t} style={{ fontSize: 14, color: "#7f1d1d", padding: "8px 0", borderBottom: "1px solid #fecaca" }}>{t}</div>
              ))}
            </div>
            <div style={{ background: "#f0fff4", borderRadius: 16, padding: 28, border: "1.5px solid #86efac" }}>
              <div style={{ fontWeight: 700, color: "#166534", marginBottom: 16, fontSize: 16 }}>✅ Actionable (What You Get)</div>
              {[
                "p. 23: Add 3 post-2020 sources on mixed-methods validity.",
                "p. 47: Justify why Creswell (2018) over Crotty — committee will ask.",
                "p. 61: Rewrite sampling rationale — n=24 needs power analysis citation.",
                "p. 78: Findings contradict Chapter 2 gap — reconcile or reframe.",
              ].map(t => (
                <div key={t} style={{ fontSize: 13, color: "#14532d", padding: "8px 0", borderBottom: "1px solid #86efac", lineHeight: 1.5 }}>{t}</div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/auth/signup" className="btn-primary">Get Actionable Feedback →</Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
