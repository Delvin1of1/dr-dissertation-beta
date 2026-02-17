// pages/features/analysis/index.jsx
import Link from "next/link";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";

const DIMENSIONS = [
  { letter: "H", name: "Hypothesis Clarity", desc: "Are your research questions and hypotheses clearly articulated and defensible?" },
  { letter: "A", name: "Argument Structure", desc: "Is the logical flow coherent from introduction through conclusions?" },
  { letter: "I", name: "Integration", desc: "Do your literature review, methodology, findings, and discussion connect seamlessly?" },
  { letter: "S", name: "Scholarship", desc: "Is your literature review deep, current, and properly engaged?" },
  { letter: "T", name: "Theory Application", desc: "Is your theoretical framework applied consistently throughout?" },
  { letter: "—", name: "Contribution", desc: "Does your work make a unique, significant contribution to the field?" },
  { letter: "—", name: "Methodology Rigor", desc: "Are your research design, data collection, and analysis methods sound?" },
  { letter: "—", name: "Defense Readiness", desc: "What questions will your committee ask — and are you ready to answer them?" },
  { letter: "—", name: "Writing Quality", desc: "Is your writing clear, coherent, and appropriately academic in tone?" },
  { letter: "—", name: "Technical Compliance", desc: "Do formatting, citations, tables, and figures meet institutional requirements?" },
];

export default function FeatureAnalysis() {
  return (
    <>
      <Navigation />
      <section className="hero" style={{ padding: "80px 24px 60px" }}>
        <div className="hero-badge"><span className="hero-badge-dot" />The HAIST© Framework</div>
        <h1>🎯 <span className="highlight">10-Dimensional</span> Analysis</h1>
        <p className="hero-sub">The same rigorous methodology used by dissertation committee chairs — now powered by AI.</p>
        <Link href="/auth/signup" className="btn-primary">Start Free Review →</Link>
      </section>
      <section className="section" style={{ background: "#f8fafc" }}>
        <h2 className="section-title">The 10 HAIST© Dimensions</h2>
        <p className="section-sub">Every dimension of your dissertation, reviewed with expert precision</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          {DIMENSIONS.map((d, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "24px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 16 }}>
              <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>{d.name}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/auth/signup" className="btn-primary">Get Your Full Analysis →</Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
