// lib/constants.js
// Application constants and product definitions

// ============================================================================
// STRIPE PRODUCTS
// These match the pricing on the main website
// Update stripePriceId values after creating products in Stripe dashboard
// ============================================================================

export const PRODUCTS = {
  QUICKLOOK_FIRST: {
    id: 'quicklook_first',
    name: 'QuickLook First Review',
    description: 'First-time discount: Rapid review in ~10 minutes',
    price: 999, // $9.99 in cents
    credits: {
      quicklook_first: 1,
    },
    // Set these after creating in Stripe dashboard:
    stripeProductId: null, // 'prod_xxxxx'
    stripePriceId: null,   // 'price_xxxxx'
  },

  QUICKLOOK_REGULAR: {
    id: 'quicklook_regular',
    name: 'QuickLook Review',
    description: 'Rapid review focusing on top 5 critical issues',
    price: 2999, // $29.99 in cents
    credits: {
      quicklook_regular: 1,
    },
    stripeProductId: null,
    stripePriceId: null,
  },

  FULL_REVIEW: {
    id: 'full_review',
    name: 'Full Review',
    description: 'Complete 10-dimensional HAIST© review with bonus QuickLook',
    price: 4999, // $49.99 in cents
    credits: {
      full_review: 1,
      quicklook_regular: 1, // Bonus credit
    },
    stripeProductId: null,
    stripePriceId: null,
  },

  ITERATIVE_PACK: {
    id: 'iterative_pack',
    name: 'Iterative Pack',
    description: '3 Full Reviews + 3 QuickLooks for complete dissertation journey',
    price: 9999, // $99.99 in cents
    credits: {
      full_review: 3,
      quicklook_regular: 3,
    },
    stripeProductId: null,
    stripePriceId: null,
  },
};

// Helper to get product by ID
export function getProduct(productId) {
  return PRODUCTS[productId] || null;
}

// Helper to get all products as array
export function getAllProducts() {
  return Object.values(PRODUCTS);
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export const REVIEW_TYPES = {
  QUICKLOOK: 'quicklook',
  FULL: 'full',
};

export const DOCUMENT_TYPES = {
  PROPOSAL: 'proposal',
  FULL_DISSERTATION: 'full',
};

// ============================================================================
// REVIEW STATUS
// ============================================================================

export const REVIEW_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// ============================================================================
// TRANSACTION STATUS
// ============================================================================

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// ============================================================================
// APP URLS
// ============================================================================

export const APP_URLS = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  DASHBOARD: '/dashboard',
  NEW_REVIEW: '/dashboard/new-review',
  CHECKOUT: '/checkout',
  ADMIN: '/admin',
};

// ============================================================================
// FILE UPLOAD LIMITS
// ============================================================================

export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: ['application/pdf'],
};

// ============================================================================
// BETA PROGRAM
// ============================================================================

export const BETA_PROGRAM = {
  ACTIVE: true,
  END_DATE: '2026-03-31',
  CODES_PREFIX: 'BETA',
  CODES_COUNT: 20,
};
