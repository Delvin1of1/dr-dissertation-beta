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
        <Link href="/auth/signup" className="btn-primary">Start First Review →</Link>
      </section>
      <section className="section" style={{ background: "#f8fafc" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <h2 className="section-title">Generic vs. Specific Feedback</h2>
          <p className="section-sub" style={{ marginBottom: 40 }}>The difference between feedback that frustrates and feedback that transforms your defense readiness</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

            {/* LEFT — Generic */}
            <div style={{ background: "#fff0f0", borderRadius: 16, padding: 28, border: "1.5px solid #fecaca" }}>
              <div style={{ fontWeight: 800, color: "#c0392b", marginBottom: 6, fontSize: 16 }}>❌ Generic Feedback</div>
              <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.05em" }}>What typical tools give you</div>
              {[
                "Your literature review needs improvement.",
                "The methodology section is unclear.",
                "Strengthen your theoretical framework.",
                "Add more citations throughout.",
                "Your argument needs better structure.",
                "The findings section lacks depth.",
                "Revise your research questions.",
                "The writing could be more academic.",
              ].map(t => (
                <div key={t} style={{ fontSize: 13.5, color: "#7f1d1d", padding: "9px 0", borderBottom: "1px solid #fecaca", lineHeight: 1.5, display: "flex", gap: 8 }}>
                  <span style={{ flexShrink: 0 }}>—</span><span>{t}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, fontSize: 12, color: "#b91c1c", fontStyle: "italic" }}>
                Leaves you guessing what to actually fix and where.
              </div>
            </div>

            {/* RIGHT — Specific */}
            <div style={{ background: "#f0fff4", borderRadius: 16, padding: 28, border: "1.5px solid #86efac" }}>
              <div style={{ fontWeight: 800, color: "#166534", marginBottom: 6, fontSize: 16 }}>✅ Specific HAIST© Feedback</div>
              <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600, marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.05em" }}>What Dr. Dissertation delivers</div>
              {[
                "p. 23: Your lit review skips post-2020 validity debates on mixed-methods design — add Creswell & Creswell (2023) and at least 2 peer-reviewed sources from 2021+.",
                "p. 38: Theoretical framework introduced in Ch. 1 never reappears in Ch. 3 or Ch. 4 — committee will call this a fatal disconnect.",
                "p. 47: Justify your choice of Creswell (2018) over Crotty (1998) — your methodology needs an epistemological defense or examiners will push back.",
                "p. 61: Sampling rationale is unsupported — n=24 qualitative sample requires a citation (e.g., Guest et al., 2020) and a saturation argument.",
                "p. 72: RQ2 is not answered in your findings — the data you collected does not map to this question as written.",
                "p. 78: Chapter 5 contradicts the gap you established in Chapter 2 — reconcile or reframe your contribution statement.",
                "p. 89: Limitations section is a single paragraph with no citations — examiners expect 3–5 limitations with supporting literature.",
                "p. 94: Recommendations lack scholarly grounding — each should cite at least one peer-reviewed source supporting the suggested direction.",
              ].map(t => (
                <div key={t} style={{ fontSize: 13, color: "#14532d", padding: "9px 0", borderBottom: "1px solid #86efac", lineHeight: 1.55, display: "flex", gap: 8 }}>
                  <span style={{ flexShrink: 0 }}>✓</span><span>{t}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, fontSize: 12, color: "#15803d", fontStyle: "italic" }}>
                Every item is page-cited, committee-framed, and immediately actionable.
              </div>
            </div>

          </div>

          {/* QuickLook vs Full Review callout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 36 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: "4px solid #8b5cf6" }}>
              <div style={{ fontWeight: 800, color: "#6c3fc5", fontSize: 15, marginBottom: 10 }}>⚡ QuickLook Review</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                Covers the <strong>top 5 critical HAIST© dimensions</strong> most likely to draw committee objections. Identifies your highest-priority defense blockers with page-level citations. Delivered in ~10 minutes as a downloadable Word document. Perfect for pre-defense checks or targeted chapter reviews.
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: "4px solid #6366f1" }}>
              <div style={{ fontWeight: 800, color: "#6366f1", fontSize: 15, marginBottom: 10 }}>📊 Full HAIST© Review</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                Evaluates <strong>all 10 HAIST© dimensions</strong> across your entire dissertation with comprehensive, chapter-by-chapter analysis. Includes a ranked priority list, strengths assessment, and expert consultation availability. Comes with a bonus QuickLook credit. Ideal for full manuscript review before submission or proposal defense.
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/auth/signup" className="btn-primary">Get Specific, Actionable Feedback →</Link>
          </div>

        </div>
      </section>
      <Footer />
    </>
  );
}
