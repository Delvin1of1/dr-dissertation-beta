// pages/api/admin/grant-credits.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = "jchick@bridgeport.edu";

const VALID_CREDIT_TYPES = ["credits_quicklook_first", "credits_quicklook_regular", "credits_full_review", "credits"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, credits, creditType } = req.body || {};
  if (!userId || !credits) return res.status(400).json({ error: "Missing userId or credits" });

  const field = VALID_CREDIT_TYPES.includes(creditType) ? creditType : "credits_quicklook_regular";

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(`${field}, total_credits_purchased`)
    .eq("id", userId)
    .single();

  if (error || !user) return res.status(404).json({ error: "User not found" });

  await supabaseAdmin.from("users").update({
    [field]: (user[field] || 0) + Number(credits),
    total_credits_purchased: (user.total_credits_purchased || 0) + Number(credits),
  }).eq("id", userId);

  return res.status(200).json({ ok: true });
}
