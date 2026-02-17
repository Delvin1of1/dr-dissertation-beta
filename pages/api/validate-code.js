// pages/api/validate-code.js

import { validateBetaCode, checkCodeAvailability } from '../../utils/codes';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, reviewType } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Validate code exists and is active
    const validation = validateBetaCode(code);

    if (!validation.valid) {
      return res.status(400).json({
        valid: false,
        error: validation.error
      });
    }

    // If reviewType is provided, check availability for that specific type
    if (reviewType) {
      const availability = checkCodeAvailability(code, reviewType);

      if (!availability.available) {
        return res.status(400).json({
          valid: true,
          available: false,
          error: availability.error,
          remaining: availability.remaining,
          data: validation.data
        });
      }

      return res.status(200).json({
        valid: true,
        available: true,
        remaining: availability.remaining,
        data: validation.data
      });
    }

    // Just validate code without checking specific review type
    return res.status(200).json({
      valid: true,
      data: validation.data
    });

  } catch (error) {
    console.error('Error validating code:', error);
    return res.status(500).json({
      error: 'Failed to validate code',
      message: error.message
    });
  }
}
