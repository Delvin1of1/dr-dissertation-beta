// pages/index.jsx — Home / Landing Page
import Link from "next/link";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <>
      <Navigation />

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Beta Testing • Limited Access
        </div>
        <h1>
          AI-Powered Dissertation Review in{" "}
          <span className="highlight">10 Minutes</span>
        </h1>
        <p className="hero-sub">
          The HAIST© methodology identifies critical issues that could block your defense. Get expert-level feedback without the wait.
        </p>
        <div className="hero-actions">
          <Link href="/auth/signup" className="btn-primary">Start First Review →</Link>
          <Link href="#pricing" className="btn-secondary">See Pricing</Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features" style={{ background: "#f8fafc" }}>
        <h2 className="section-title">Why Dr. Dissertation?</h2>
        <p className="section-sub">Everything you need to confidently defend your dissertation</p>
        <div className="features-grid">
          {[
            { icon: "⚡", title: "Lightning Fast", desc: "~10 minute QuickLook review turnaround, available 24/7 whenever you need it.", href: "/features/fast" },
            { icon: "🎯", title: "10-Dimensional Analysis", desc: "Comprehensive HAIST© methodology covers every critical aspect of your dissertation.", href: "/features/analysis" },
            { icon: "📊", title: "Research-Backed", desc: "Built on decades of academic research and real dissertation committee experience.", href: "/features/research" },
            { icon: "✓", title: "Actionable Feedback", desc: "Specific, prioritized recommendations with page citations — not vague suggestions.", href: "/features/actionable" },
            { icon: "🔒", title: "Secure & Private", desc: "Confidential, enterprise-grade security and encrypted storage for your work.", href: "/features/secure" },
            { icon: "🎓", title: "Expert-Developed", desc: "Created by dissertation committee chairs and educational AI specialists.", href: "/features/expert" },
          ].map((f) => (
            <Link href={f.href} key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <h2 className="section-title">Choose Your Review</h2>
        <p className="section-sub">Flexible options for every stage of your dissertation journey</p>
        <div className="pricing-grid">
          {/* First-Time Offer */}
          <div className="pricing-card">
            <div className="pricing-badge" style={{ background: "#f59e0b", position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "4px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>First-Time Offer</div>
            <div className="pricing-name">First-Time User</div>
            <div className="pricing-price">$9.99 <span>/ review</span></div>
            <div className="pricing-sub">First QuickLook Review</div>
            <ul className="pricing-features">
              <li>~10 min turnaround</li>
              <li>Top 5 critical dimensions</li>
              <li>Defense blockers identified</li>
              <li>Priority action items</li>
              <li>Professional Word document</li>
            </ul>
            <Link href="/checkout" className="pricing-cta secondary">Get Started →</Link>
          </div>

          {/* Most Popular */}
          <div className="pricing-card featured" style={{ position: "relative" }}>
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-name">QuickLook</div>
            <div className="pricing-price">$29.99 <span>/ review</span></div>
            <div className="pricing-sub">QuickLook Review</div>
            <ul className="pricing-features">
              <li>All HAIST© dimensions</li>
              <li>Page-specific citations</li>
              <li>Detailed recommendations</li>
              <li>Priority support</li>
              <li>Professional Word document</li>
            </ul>
            <Link href="/checkout" className="pricing-cta">Get Started →</Link>
          </div>

          {/* Full Review */}
          <div className="pricing-card" style={{ position: "relative" }}>
            <div className="pricing-name">Full Review</div>
            <div className="pricing-price">$49.99 <span>/ review</span></div>
            <div className="pricing-sub">+ 1 QuickLook bonus</div>
            <ul className="pricing-features">
              <li>All 10 HAIST© dimensions</li>
              <li>Comprehensive analysis</li>
              <li>Within 3 business days</li>
              <li>Bonus QuickLook credit</li>
              <li>Direct email delivery</li>
              <li>Expert consultation available</li>
            </ul>
            <Link href="/checkout" className="pricing-cta secondary">Get Started →</Link>
          </div>

          {/* Iterative Pack */}
          <div className="pricing-card" style={{ position: "relative" }}>
            <div className="pricing-badge" style={{ background: "#10b981", position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "4px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Best Value</div>
            <div className="pricing-name">Iterative Review Pack</div>
            <div className="pricing-price">$99.99 <span>/ pack</span></div>
            <div className="pricing-sub">3 Full Reviews + 3 QuickLooks</div>
            <ul className="pricing-features">
              <li>3 Full HAIST© Reviews</li>
              <li>3 QuickLook Reviews</li>
              <li>Complete dissertation journey</li>
              <li>Best value for the process</li>
              <li>Expert consultation available</li>
            </ul>
            <Link href="/checkout" className="pricing-cta secondary">Get Started →</Link>
          </div>
        </div>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>
          Institutions: Need site licenses or custom solutions?{" "}
          <Link href="/contact" style={{ color: "#6366F1", fontWeight: 600 }}>Contact us for institutional pricing.</Link>
        </p>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner">
        <h2>Ready to defend with confidence?</h2>
        <p>Join hundreds of doctoral students who&apos;ve strengthened their dissertations with Dr. Dissertation.</p>
        <Link href="/auth/signup" className="btn-white">Start Your First Review →</Link>
      </div>

      <Footer />
    </>
  );
}
