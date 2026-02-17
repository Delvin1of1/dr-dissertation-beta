// utils/codes.js - Beta Code Management System

export const BETA_CODES = {
  'BETA001': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 1',
    email: 'tester1@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA002': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 2',
    email: 'tester2@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA003': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 3',
    email: 'tester3@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA004': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 4',
    email: 'tester4@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA005': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 5',
    email: 'tester5@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA006': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 6',
    email: 'tester6@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA007': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 7',
    email: 'tester7@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA008': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 8',
    email: 'tester8@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA009': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 9',
    email: 'tester9@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA010': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 10',
    email: 'tester10@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA011': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 11',
    email: 'tester11@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA012': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 12',
    email: 'tester12@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA013': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 13',
    email: 'tester13@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA014': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 14',
    email: 'tester14@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA015': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 15',
    email: 'tester15@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA016': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 16',
    email: 'tester16@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA017': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 17',
    email: 'tester17@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA018': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 18',
    email: 'tester18@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA019': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 19',
    email: 'tester19@example.com',
    expiresAt: '2026-03-31'
  },
  'BETA020': {
    quickLooksRemaining: 3,
    fullReviewsRemaining: 1,
    active: true,
    assignedTo: 'Beta Tester 20',
    email: 'tester20@example.com',
    expiresAt: '2026-03-31'
  }
};

/**
 * Validate a beta code
 * @param {string} code - The beta code to validate
 * @returns {Object} - Validation result
 */
export function validateBetaCode(code) {
  const upperCode = code.toUpperCase().trim();
  const codeData = BETA_CODES[upperCode];

  if (!codeData) {
    return { valid: false, error: 'Invalid beta code' };
  }

  if (!codeData.active) {
    return { valid: false, error: 'This code has been deactivated' };
  }

  const now = new Date();
  const expires = new Date(codeData.expiresAt);
  if (now > expires) {
    return { valid: false, error: 'This code has expired' };
  }

  return { valid: true, data: codeData };
}

/**
 * Check if a code has available credits for a specific review type
 * @param {string} code - The beta code
 * @param {string} reviewType - 'quicklook' or 'full'
 * @returns {Object} - Availability result
 */
export function checkCodeAvailability(code, reviewType) {
  const codeData = BETA_CODES[code.toUpperCase().trim()];

  if (!codeData) {
    return { available: false, error: 'Invalid code' };
  }

  if (reviewType === 'quicklook') {
    if (codeData.quickLooksRemaining <= 0) {
      return {
        available: false,
        error: 'No QuickLook credits remaining',
        remaining: { quickLooks: 0, fullReviews: codeData.fullReviewsRemaining }
      };
    }
    return {
      available: true,
      remaining: { quickLooks: codeData.quickLooksRemaining, fullReviews: codeData.fullReviewsRemaining }
    };
  } else if (reviewType === 'full') {
    if (codeData.fullReviewsRemaining <= 0) {
      return {
        available: false,
        error: 'No Full Review credits remaining',
        remaining: { quickLooks: codeData.quickLooksRemaining, fullReviews: 0 }
      };
    }
    return {
      available: true,
      remaining: { quickLooks: codeData.quickLooksRemaining, fullReviews: codeData.fullReviewsRemaining }
    };
  }

  return { available: false, error: 'Invalid review type' };
}

/**
 * Use a beta code credit (server-side only)
 * NOTE: In production, this should update a database, not in-memory object
 * @param {string} code - The beta code
 * @param {string} reviewType - 'quicklook' or 'full'
 * @returns {Object} - Usage result
 */
export function useBetaCode(code, reviewType) {
  const upperCode = code.toUpperCase().trim();
  const codeData = BETA_CODES[upperCode];

  if (!codeData) {
    return { success: false, error: 'Invalid code' };
  }

  if (reviewType === 'quicklook') {
    if (codeData.quickLooksRemaining <= 0) {
      return { success: false, error: 'No QuickLook credits remaining' };
    }
    codeData.quickLooksRemaining -= 1;
    console.log(`✓ Code ${upperCode} used for QuickLook review`);
  } else if (reviewType === 'full') {
    if (codeData.fullReviewsRemaining <= 0) {
      return { success: false, error: 'No Full Review credits remaining' };
    }
    codeData.fullReviewsRemaining -= 1;
    console.log(`✓ Code ${upperCode} used for Full Review`);
  } else {
    return { success: false, error: 'Invalid review type' };
  }

  return {
    success: true,
    remaining: {
      quickLooks: codeData.quickLooksRemaining,
      fullReviews: codeData.fullReviewsRemaining
    }
  };
}
