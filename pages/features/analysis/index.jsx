// pages/features/analysis/index.jsx
import Link from "next/link";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";

const DIMENSIONS = [
  { num: 1, name: "Hypothesis Clarity", desc: "Are your research questions and hypotheses clearly articulated, aligned with your theoretical framework, and defensible before a committee?" },
  { num: 2, name: "Argument Structure", desc: "Is the logical flow of your dissertation coherent from introduction through conclusions, with each chapter building naturally on the last?" },
  { num: 3, name: "Integration", desc: "Do your literature review, methodology, findings, and discussion connect seamlessly into one unified scholarly argument?" },
  { num: 4, name: "Scholarship", desc: "Is your literature review sufficiently deep, current, and critically engaged — or are there gaps a committee will immediately identify?" },
  { num: 5, name: "Theory Application", desc: "Is your theoretical framework applied consistently and meaningfully throughout all chapters, not just introduced and then abandoned?" },
  { num: 6, name: "Contribution", desc: "Does your work make a clear, unique, and significant contribution to your field? Can you articulate it in one sentence?" },
  { num: 7, name: "Methodology Rigor", desc: "Are your research design, data collection procedures, and analysis methods sound, appropriate, and justified for your research questions?" },
  { num: 8, name: "Defense Readiness", desc: "What probing questions will your committee ask — and does your dissertation fully prepare you to answer them confidently?" },
  { num: 9, name: "Writing Quality", desc: "Is your writing clear, coherent, and appropriately academic in tone, with proper transitions and scholarly voice throughout?" },
  { num: 10, name: "Technical Compliance", desc: "Do formatting, citations, tables, figures, and appendices meet your institution's specific requirements and style guide standards?" },
];

export default function FeatureAnalysis() {
  return (
    <>
      <Navigation />
      <section className="hero" style={{ padding: "80px 24px 60px" }}>
        <div className="hero-badge"><span className="hero-badge-dot" />The HAIST© Framework</div>
        <h1>🎯 <span className="highlight">10-Dimensional</span> Analysis</h1>
        <p className="hero-sub">
          The same rigorous methodology used by dissertation committee chairs — now powered by AI.
          Developed by John C. Chick, Ed.D. and Laura Morello, Ed.D.
        </p>
        <Link href="/auth/signup" className="btn-primary">Start First Review →</Link>
      </section>

      {/* HAIST EXPLAINER */}
      <section className="section" style={{ background: "#f8fafc", paddingTop: 56, paddingBottom: 56 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* What is HAIST */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>What is HAIST©?</h2>
            <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.8, maxWidth: 700, margin: "0 auto" }}>
              HAIST© stands for <strong>Human-AI Symbiotic Theory</strong> — a proprietary dissertation evaluation
              framework developed by John C. Chick, Ed.D. and Laura Morello, Ed.D. from decades of experience as
              dissertation committee chairs and academic researchers. HAIST© provides a structured, comprehensive
              approach to identifying every critical weakness in a doctoral dissertation before your committee does.
            </p>
          </div>

          {/* HAIST Letters Banner */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 60, flexWrap: "wrap" }}>
            {[
              { letter: "H", word: "Human" },
              { letter: "A", word: "AI" },
              { letter: "I", word: "Intelligence" },
              { letter: "S", word: "Symbiotic" },
              { letter: "T", word: "Theory" },
            ].map(({ letter, word }) => (
              <div key={letter} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", minWidth: 110 }}>
                <div style={{ fontSize: 42, fontWeight: 900, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{letter}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: 500 }}>{word}</div>
              </div>
            ))}
          </div>

          {/* 10 Dimensions */}
          <h2 className="section-title" style={{ marginBottom: 8 }}>The 10 HAIST© Dimensions</h2>
          <p className="section-sub" style={{ marginBottom: 36 }}>Every dimension of your dissertation, reviewed with expert precision</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {DIMENSIONS.map((d) => (
              <div key={d.num} style={{ background: "#fff", borderRadius: 14, padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 16 }}>
                <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{d.num}</div>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 6, fontSize: 15 }}>{d.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{d.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Attribution Banner */}
          <div style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 20, padding: "40px", marginTop: 56, textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Framework Creators</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>John C. Chick, Ed.D. &amp; Laura Morello, Ed.D.</div>
            <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.7, maxWidth: 620, margin: "0 auto 28px" }}>
              The HAIST© methodology was developed from over 2,000 dissertation reviews and 15+ years of experience
              chairing doctoral committees. It represents the gold standard for comprehensive dissertation evaluation.
            </p>
            <Link href="/auth/signup" style={{ display: "inline-block", background: "#fff", color: "#6366F1", borderRadius: 10, padding: "13px 30px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
              Get Your Full HAIST© Analysis →
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
