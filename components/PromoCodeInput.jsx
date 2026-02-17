// components/PromoCodeInput.jsx
// Used on the dashboard — lets users enter a promo code to redeem credits
import { useState } from "react";

export default function PromoCodeInput({ userId, onSuccess }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRedeem(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Step 1: Validate
      const vRes = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), userId }),
      });
      const vData = await vRes.json();

      if (!vRes.ok || !vData.valid) {
        setError(vData.error || "Invalid promo code.");
        setLoading(false);
        return;
      }

      // Step 2: Redeem
      const rRes = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCodeId: vData.promoCodeId, userId }),
      });
      const rData = await rRes.json();

      if (!rRes.ok) {
        setError(rData.error || "Failed to redeem code.");
        setLoading(false);
        return;
      }

      const ql = rData.credits_granted?.quicklooks || 0;
      const fr = rData.credits_granted?.full_reviews || 0;
      const parts = [];
      if (ql > 0) parts.push(`${ql} QuickLook${ql !== 1 ? "s" : ""}`);
      if (fr > 0) parts.push(`${fr} Full Review${fr !== 1 ? "s" : ""}`);
      setSuccess(`🎉 Code redeemed! Added: ${parts.join(" + ") || "credits"}.`);
      setCode("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ background: "#f0fff4", border: "1.5px solid #86efac", borderRadius: 12, padding: "14px 18px", fontSize: 14, color: "#166534", fontWeight: 600 }}>
        {success}
      </div>
    );
  }

  return (
    <form onSubmit={handleRedeem} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter promo code"
        maxLength={20}
        disabled={loading}
        style={{ flex: 1, minWidth: 180, padding: "10px 14px", border: "1.5px solid #ddd", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "monospace", letterSpacing: "0.05em" }}
      />
      <button
        type="submit"
        disabled={loading || !code.trim()}
        style={{ background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: !code.trim() ? 0.55 : 1, whiteSpace: "nowrap" }}
      >
        {loading ? "Redeeming…" : "Redeem →"}
      </button>
      {error && (
        <div style={{ width: "100%", background: "#fff0f0", color: "#c0392b", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}
    </form>
  );
}
