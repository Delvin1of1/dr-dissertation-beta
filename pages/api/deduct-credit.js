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
    .select("credits")
    .eq("id", userId)
    .single();

  if (error || !user) return res.status(404).json({ error: "User not found" });
  if (user.credits <= 0) return res.status(400).json({ error: "No credits remaining" });

  await supabaseAdmin
    .from("users")
    .update({ credits: user.credits - 1 })
    .eq("id", userId);

  return res.status(200).json({ ok: true, creditsRemaining: user.credits - 1 });
}
