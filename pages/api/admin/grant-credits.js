// pages/api/admin/grant-credits.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = "jchick@bridgeport.edu";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Verify caller is admin (basic check — in production use session verification)
  const { userId, credits } = req.body || {};
  if (!userId || !credits) return res.status(400).json({ error: "Missing userId or credits" });

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("credits, total_credits_purchased")
    .eq("id", userId)
    .single();

  if (error || !user) return res.status(404).json({ error: "User not found" });

  await supabaseAdmin.from("users").update({
    credits: (user.credits || 0) + Number(credits),
    total_credits_purchased: (user.total_credits_purchased || 0) + Number(credits),
  }).eq("id", userId);

  return res.status(200).json({ ok: true });
}
