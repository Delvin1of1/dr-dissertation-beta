// pages/checkout/cancel.jsx
import Link from "next/link";

export default function CheckoutCancel() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "48px", textAlign: "center", maxWidth: 440, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🔙</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>Payment Cancelled</h1>
        <p style={{ color: "#64748b", marginBottom: 32 }}>No worries — your payment was cancelled and you were not charged.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/checkout" className="btn-primary" style={{ display: "inline-block" }}>Try Again →</Link>
          <Link href="/dashboard" className="btn-secondary" style={{ display: "inline-block" }}>Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
