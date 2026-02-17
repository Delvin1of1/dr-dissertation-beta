// pages/api/email/welcome.js
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "../../../utils/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, welcome_email_sent")
      .eq("id", userId)
      .single();

    if (error || !user) return res.status(404).json({ error: "User not found" });

    // Idempotent — only send once
    if (user.welcome_email_sent) return res.status(200).json({ skipped: true });

    const firstName = (user.full_name || "").split(" ")[0] || undefined;
    await sendWelcomeEmail({ to: user.email, firstName });

    await supabaseAdmin
      .from("users")
      .update({ welcome_email_sent: true })
      .eq("id", userId);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("welcome email error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
