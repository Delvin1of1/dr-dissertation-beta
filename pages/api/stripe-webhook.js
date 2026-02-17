// pages/api/stripe-webhook.js
import { stripe } from "../../lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const config = {
  api: { bodyParser: false },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, credits } = session.metadata || {};
    const numCredits = parseInt(credits || "1", 10);

    if (userId) {
      // Add credits to user
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("credits, total_credits_purchased")
        .eq("id", userId)
        .single();

      if (user) {
        await supabaseAdmin.from("users").update({
          credits: (user.credits || 0) + numCredits,
          total_credits_purchased: (user.total_credits_purchased || 0) + numCredits,
        }).eq("id", userId);
      }
    }
  }

  res.status(200).json({ received: true });
}
