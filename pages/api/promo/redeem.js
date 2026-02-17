// pages/api/promo/redeem.js
// Redeems a promo code and grants credits to user

import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promoCodeId, userId } = req.body;

    if (!promoCodeId || !userId) {
      return res.status(400).json({ error: 'Missing promoCodeId or userId' });
    }

    // Get the promo code
    const { data: promoCode, error: promoError } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('id', promoCodeId)
      .single();

    if (promoError || !promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    // Get user's current credits
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate credits to grant
    const quicklooksToGrant = promoCode.quicklooks_remaining;
    const fullReviewsToGrant = promoCode.full_reviews_remaining;

    // Update user credits
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({
        credits_quicklook_regular: user.credits_quicklook_regular + quicklooksToGrant,
        credits_full_review: user.credits_full_review + fullReviewsToGrant,
      })
      .eq('id', userId);

    if (updateUserError) {
      throw updateUserError;
    }

    // Decrease promo code remaining credits
    const { error: updatePromoError } = await supabaseAdmin
      .from('promo_codes')
      .update({
        quicklooks_remaining: 0,
        full_reviews_remaining: 0,
        times_used: promoCode.times_used + 1,
      })
      .eq('id', promoCodeId);

    if (updatePromoError) {
      throw updatePromoError;
    }

    // Record usage
    const { error: usageError } = await supabaseAdmin
      .from('promo_code_usage')
      .insert({
        promo_code_id: promoCodeId,
        user_id: userId,
        review_type: 'promo_redemption',
        credits_granted: quicklooksToGrant + fullReviewsToGrant,
      });

    if (usageError) {
      console.error('Error recording promo usage:', usageError);
      // Don't fail the request if this fails
    }

    return res.status(200).json({
      success: true,
      credits_granted: {
        quicklooks: quicklooksToGrant,
        full_reviews: fullReviewsToGrant,
      },
      new_balance: {
        credits_quicklook_regular: user.credits_quicklook_regular + quicklooksToGrant,
        credits_full_review: user.credits_full_review + fullReviewsToGrant,
      },
    });
  } catch (error) {
    console.error('Promo code redemption error:', error);
    return res.status(500).json({ error: 'Failed to redeem promo code' });
  }
}
