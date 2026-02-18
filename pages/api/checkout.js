// pages/api/checkout.js
import { stripe } from "../../lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.doctordissertation.com";

// Product catalog — matches checkout/index.jsx PRODUCTS array
const PRODUCTS = {
  quicklook_first: {
    name: "First-Time QuickLook Review",
    description: "~10 min turnaround · Top 5 critical HAIST© dimensions · Defense blockers identified · Professional Word document",
    amount: 999,   // $9.99
    creditField: "credits_quicklook_first",
    credits: 1,
  },
  quicklook_regular: {
    name: "QuickLook Review",
    description: "~10 min turnaround · All HAIST© dimensions · Page-specific citations · Detailed recommendations · Priority support",
    amount: 2999,  // $29.99
    creditField: "credits_quicklook_regular",
    credits: 1,
  },
  full_review: {
    name: "Full Review",
    description: "All 10 HAIST© dimensions · Comprehensive analysis · Within 3 business days · Bonus QuickLook credit · Expert consultation available",
    amount: 4999,  // $49.99
    creditField: "credits_full_review",
    credits: 2,   // grants full_review credit + quicklook bonus
  },
  iterative_pack: {
    name: "Iterative Review Pack",
    description: "3 Full HAIST© Reviews · 3 QuickLook Reviews · Complete dissertation journey · Best value for the process",
    amount: 9999,  // $99.99
    creditField: "credits_full_review",
    credits: 6,   // 3 full reviews + 3 quicklook regulars
  },
};

export default async function handler(req, res) {
  // Allow both GET (redirect link) and POST (form submission)
  const productId = req.query.product || req.body?.product || "quicklook_regular";
  const userId = req.query.userId || req.body?.userId;

  const product = PRODUCTS[productId];
  if (!product) {
    return res.status(400).json({ error: `Unknown product: ${productId}` });
  }

  // Get user email for Stripe prefill
  let customerEmail;
  if (userId) {
    try {
      const { data } = await supabaseAdmin.from("users").select("email").eq("id", userId).single();
      customerEmail = data?.email;
    } catch (_) {
      // Non-fatal — proceed without prefill
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: customerEmail || undefined,
      metadata: {
        userId: userId || "",
        productId,
        creditField: product.creditField,
        credits: String(product.credits),
      },
      success_url: `${BASE_URL}/checkout/success`,
      cancel_url: `${BASE_URL}/checkout/cancel`,
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: "Unable to create checkout session. Please try again." });
  }
}
