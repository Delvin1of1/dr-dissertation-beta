// pages/checkout/index.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { supabase } from "../../lib/supabase";

const PRODUCTS = [
  { id: "quicklook_first", name: "First-Time QuickLook", price: "$9.99", desc: "Perfect for your first review", features: ["~10 min turnaround", "Top 5 critical dimensions", "Defense blockers identified", "Professional Word document"], badge: "Best for First-Timers", credits: 1 },
  { id: "quicklook_regular", name: "QuickLook Review", price: "$29.99", desc: "The most popular choice", features: ["~10 min turnaround", "All HAIST© dimensions", "Page-specific citations", "Detailed recommendations", "Priority support"], badge: "Most Popular", featured: true, credits: 1 },
  { id: "full_review", name: "Full Review", price: "$49.99", desc: "+ 1 QuickLook bonus credit", features: ["All 10 HAIST© dimensions", "Comprehensive analysis", "Within 3 business days", "Bonus QuickLook credit", "Expert consultation available"], credits: 2 },
  { id: "iterative_pack", name: "Iterative Review Pack", price: "$99.99", desc: "3 Full Reviews + 3 QuickLooks", features: ["3 Full HAIST© Reviews", "3 QuickLook Reviews", "Complete dissertation journey", "Best value for the process", "Expert consultation available"], badge: "Best Value", credits: 6 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUserId(data.session.user.id);
    });
  }, []);

  async function handlePurchase(productId) {
    setLoading(productId);
    const params = new URLSearchParams({ product: productId });
    if (userId) params.append("userId", userId);
    router.push(`/api/checkout?${params.toString()}`);
  }

  return (
    <>
      <Navigation />
      <section className="hero" style={{ padding: "80px 24px 60px" }}>
        <h1>Get Your <span className="highlight">Review Credits</span></h1>
        <p className="hero-sub">Choose the review that fits your needs. No subscription required.</p>
      </section>
      <section className="section" style={{ background: "#f8fafc", paddingTop: 40 }}>
        <div className="pricing-grid" style={{ maxWidth: 960, margin: "0 auto 40px" }}>
          {PRODUCTS.map(p => (
            <div key={p.id} className={`pricing-card${p.featured ? " featured" : ""}`} style={{ position: "relative" }}>
              {p.badge && <div className="pricing-badge">{p.badge}</div>}
              <div className="pricing-name">{p.name}</div>
              <div className="pricing-price">{p.price} <span>/ review</span></div>
              <div className="pricing-sub">{p.desc}</div>
              <ul className="pricing-features">
                {p.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <button
                onClick={() => handlePurchase(p.id)}
                disabled={loading === p.id}
                className={`pricing-cta${p.featured ? "" : " secondary"}`}
                style={{ border: "none", cursor: "pointer", width: "100%" }}
              >
                {loading === p.id ? "Redirecting…" : "Purchase →"}
              </button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Secure payment via Stripe • No subscription • Credits never expire<br />
          Need institutional pricing? <Link href="/contact" style={{ color: "#6366F1" }}>Contact us →</Link>
        </p>
      </section>
      <Footer />
    </>
  );
}
