// pages/checkout/success.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function CheckoutSuccess() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push("/dashboard"), 5000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "56px 48px", textAlign: "center", maxWidth: 460, boxShadow: "0 25px 50px rgba(0,0,0,0.25)", animation: "fadeIn 0.6s ease-out" }}>
        <div style={{ width: 80, height: 80, background: "linear-gradient(135deg,#10B981,#059669)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 36 }}>✓</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>Payment Successful!</h1>
        <p style={{ color: "#64748b", marginBottom: 32, lineHeight: 1.6 }}>Your credits have been added to your account. You&apos;re ready to run your HAIST© review!</p>
        <Link href="/dashboard" className="btn-primary" style={{ display: "inline-block" }}>Go to Dashboard →</Link>
        <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 20 }}>Redirecting automatically in 5 seconds…</p>
      </div>
    </div>
  );
}
