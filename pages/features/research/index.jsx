// pages/features/research/index.jsx
import Link from "next/link";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";

export default function FeatureResearch() {
  return (
    <>
      <Navigation />
      <section className="hero" style={{ padding: "80px 24px 60px" }}>
        <div className="hero-badge"><span className="hero-badge-dot" />Research Foundation</div>
        <h1>📊 <span className="highlight">Research-Backed</span> Methodology</h1>
        <p className="hero-sub">
          Built on decades of academic research and real dissertation committee experience by{" "}
          <strong>John C. Chick, Ed.D.</strong> and <strong>Laura Morello, Ed.D.</strong>
        </p>
        <Link href="/auth/signup" className="btn-primary">Start First Review →</Link>
      </section>
      <section className="section" style={{ background: "#f8fafc" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 className="section-title">The Science Behind HAIST©</h2>
          <div style={{ display: "grid", gap: 20, marginTop: 40 }}>
            {[
              { title: "Grounded in Committee Feedback Patterns", desc: "HAIST© was developed by analyzing thousands of real dissertation committee feedback reports to identify the most common critical failure points." },
              { title: "Validated Across Disciplines", desc: "The framework has been validated across STEM, social sciences, humanities, and professional doctoral programs, ensuring relevance regardless of your field." },
              { title: "Continuously Refined", desc: "As academic standards evolve, so does HAIST©. Our expert team reviews and updates the methodology regularly to stay current with institutional expectations." },
              { title: "Peer-Informed Development", desc: "Created in collaboration with dissertation committee chairs from multiple accredited universities, ensuring real-world academic rigor." },
            ].map(item => (
              <div key={item.title} style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: "4px solid #6366F1" }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#1e293b", marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/auth/signup" className="btn-primary">Get Research-Backed Feedback →</Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
