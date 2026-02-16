// pages/api/promo/validate.js
// Validates and applies promo codes

import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or userId' });
    }

    // Get the promo code
    const { data: promoCode, error: promoError } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (promoError || !promoCode) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }

    // Check if code is active
    if (!promoCode.active) {
      return res.status(400).json({ error: 'This promo code is no longer active' });
    }

    // Check if expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This promo code has expired' });
    }

    // Check if code has any credits remaining
    if (promoCode.quicklooks_remaining === 0 && promoCode.full_reviews_remaining === 0) {
      return res.status(400).json({ error: 'This promo code has no credits remaining' });
    }

    // Check if user has already used this code
    const { data: existingUsage } = await supabaseAdmin
      .from('promo_code_usage')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', userId)
      .limit(1);

    if (existingUsage && existingUsage.length > 0) {
      return res.status(400).json({ error: 'You have already used this promo code' });
    }

    // Code is valid! Return details
    return res.status(200).json({
      valid: true,
      code: promoCode.code,
      quicklooks_remaining: promoCode.quicklooks_remaining,
      full_reviews_remaining: promoCode.full_reviews_remaining,
      expires_at: promoCode.expires_at,
      description: promoCode.description,
      promoCodeId: promoCode.id,
    });
  } catch (error) {
    console.error('Promo code validation error:', error);
    return res.status(500).json({ error: 'Failed to validate promo code' });
  }
}
