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
    const { userId, productId, creditField } = session.metadata || {};

    if (userId) {
      // Determine which credit columns to increment based on productId
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("credits, credits_quicklook_first, credits_quicklook_regular, credits_full_review, total_credits_purchased")
        .eq("id", userId)
        .single();

      if (user) {
        const updates = {
          total_credits_purchased: (user.total_credits_purchased || 0) + 1,
        };

        if (productId === "quicklook_first") {
          updates.credits_quicklook_first = (user.credits_quicklook_first || 0) + 1;
        } else if (productId === "quicklook_regular") {
          updates.credits_quicklook_regular = (user.credits_quicklook_regular || 0) + 1;
        } else if (productId === "full_review") {
          // Full review grants 1 full review credit + 1 bonus quicklook regular
          updates.credits_full_review = (user.credits_full_review || 0) + 1;
          updates.credits_quicklook_regular = (user.credits_quicklook_regular || 0) + 1;
          updates.total_credits_purchased = (user.total_credits_purchased || 0) + 2;
        } else if (productId === "iterative_pack") {
          // Iterative Pack: 3 full reviews + 3 quicklook regulars
          updates.credits_full_review = (user.credits_full_review || 0) + 3;
          updates.credits_quicklook_regular = (user.credits_quicklook_regular || 0) + 3;
          updates.total_credits_purchased = (user.total_credits_purchased || 0) + 6;
        } else if (creditField) {
          // Fallback: use creditField from metadata if productId unrecognized
          updates[creditField] = (user[creditField] || 0) + 1;
        } else {
          // Legacy fallback: increment generic credits
          updates.credits = (user.credits || 0) + 1;
        }

        await supabaseAdmin.from("users").update(updates).eq("id", userId);

        // Record transaction
        await supabaseAdmin.from("transactions").insert({
          user_id: userId,
          product_id: productId || "unknown",
          stripe_session_id: session.id,
          amount: session.amount_total,
          status: "completed",
        }).select().maybeSingle();
      }
    }
  }

  res.status(200).json({ received: true });
}
