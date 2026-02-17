// pages/api/checkout.js
import { stripe } from "../../lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Price per credit in cents
const CREDIT_PRICE = 2900; // $29.00

export default async function handler(req, res) {
  // Allow GET for direct link navigation or POST from form
  const userId = req.query.userId || req.body?.userId;
  const credits = parseInt(req.query.credits || req.body?.credits || "1", 10);

  // Get user email for Stripe prefill
  let customerEmail;
  if (userId) {
    const { data } = await supabaseAdmin.from("users").select("email").eq("id", userId).single();
    customerEmail = data?.email;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Dr. Dissertation Review Credit${credits > 1 ? "s" : ""}`,
              description: `${credits} HAIST© dissertation review credit${credits > 1 ? "s" : ""}`,
            },
            unit_amount: CREDIT_PRICE,
          },
          quantity: credits,
        },
      ],
      mode: "payment",
      customer_email: customerEmail,
      metadata: {
        userId: userId || "",
        credits: String(credits),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.doctordissertation.com"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.doctordissertation.com"}/account`,
    });

    // Redirect to Stripe checkout
    res.redirect(303, session.url);
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
