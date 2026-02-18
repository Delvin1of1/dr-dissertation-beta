// pages/api/deduct-credit.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("credits, credits_quicklook_first, credits_quicklook_regular, credits_full_review")
    .eq("id", userId)
    .single();

  if (error || !user) return res.status(404).json({ error: "User not found" });

  // Deduct in priority order:
  // 1. credits_quicklook_first (first-time discount credits)
  // 2. credits_quicklook_regular (standard quicklook)
  // 3. credits_full_review (full review)
  // 4. legacy credits column (fallback)
  const qlFirst = user.credits_quicklook_first ?? 0;
  const qlReg   = user.credits_quicklook_regular ?? 0;
  const full    = user.credits_full_review ?? 0;
  const legacy  = user.credits ?? 0;
  const total   = qlFirst + qlReg + full + legacy;

  if (total <= 0) return res.status(400).json({ error: "No credits remaining" });

  const updates = {};
  if (qlFirst > 0) {
    updates.credits_quicklook_first = qlFirst - 1;
  } else if (qlReg > 0) {
    updates.credits_quicklook_regular = qlReg - 1;
  } else if (full > 0) {
    updates.credits_full_review = full - 1;
  } else {
    updates.credits = legacy - 1;
  }

  await supabaseAdmin.from("users").update(updates).eq("id", userId);

  return res.status(200).json({ ok: true, creditsRemaining: total - 1 });
}
