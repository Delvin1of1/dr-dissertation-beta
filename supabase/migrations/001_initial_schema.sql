-- Dr. Dissertation Database Schema
-- Initial migration: Core tables for users, reviews, transactions, and promo codes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- Extends Supabase auth.users with application-specific data
-- ============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Credit balances (separate tracking for different pricing tiers)
  credits_quicklook_first INTEGER DEFAULT 0,    -- $9.99 first-time discount credits
  credits_quicklook_regular INTEGER DEFAULT 0,  -- $29.99 regular QuickLook credits
  credits_full_review INTEGER DEFAULT 0,        -- $49.99 Full Review credits

  -- User metadata
  is_beta_tester BOOLEAN DEFAULT FALSE,
  beta_code TEXT,
  first_review_discount_used BOOLEAN DEFAULT FALSE,

  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,

  -- Admin permissions
  is_admin BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- REVIEWS TABLE
-- Stores all dissertation review records
-- ============================================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Review configuration
  review_type TEXT NOT NULL CHECK (review_type IN ('quicklook', 'full')),
  document_type TEXT NOT NULL CHECK (document_type IN ('proposal', 'full')),

  -- File information
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  total_pages INTEGER,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Review content
  review_text TEXT,
  chunks_processed INTEGER,

  -- Storage URLs (Supabase Storage)
  docx_url TEXT,
  pdf_url TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Processing metadata
  anthropic_tokens_used INTEGER,
  processing_time_seconds INTEGER,
  promo_code_used TEXT,
  error_message TEXT
);

-- ============================================================================
-- TRANSACTIONS TABLE
-- Tracks all payment transactions via Stripe
-- ============================================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Stripe references
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  stripe_session_id TEXT,

  -- Transaction details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  product_type TEXT NOT NULL,  -- 'quicklook_first', 'quicklook_regular', 'full_review', 'iterative_pack'

  -- Credits granted by this transaction
  credits_quicklook_first INTEGER DEFAULT 0,
  credits_quicklook_regular INTEGER DEFAULT 0,
  credits_full_review INTEGER DEFAULT 0,

  -- Transaction status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Additional metadata (JSON for flexibility)
  metadata JSONB
);

-- ============================================================================
-- PROMO_CODES TABLE
-- Manages promotional codes and beta tester codes
-- ============================================================================
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,

  -- Credit allocation
  quicklooks_total INTEGER DEFAULT 0,
  quicklooks_remaining INTEGER DEFAULT 0,
  full_reviews_total INTEGER DEFAULT 0,
  full_reviews_remaining INTEGER DEFAULT 0,

  -- Validity controls
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,  -- NULL = unlimited uses

  -- Beta tester assignment (optional)
  assigned_to TEXT,
  assigned_email TEXT,

  -- Usage tracking
  times_used INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  description TEXT,
  is_beta_code BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- PROMO_CODE_USAGE TABLE
-- Audit trail for promo code usage
-- ============================================================================
CREATE TABLE public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL,

  review_type TEXT NOT NULL,
  credits_granted INTEGER DEFAULT 0,

  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(promo_code_id, review_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX idx_users_is_admin ON public.users(is_admin) WHERE is_admin = true;

-- Reviews table indexes
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_user_created ON public.reviews(user_id, created_at DESC);

-- Transactions table indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_stripe_payment_intent ON public.transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Promo codes table indexes
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(active) WHERE active = true;

-- Promo code usage table indexes
CREATE INDEX idx_promo_code_usage_user_id ON public.promo_code_usage(user_id);
CREATE INDEX idx_promo_code_usage_promo_code_id ON public.promo_code_usage(promo_code_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - USERS
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES - REVIEWS
-- ============================================================================

-- Users can view their own reviews
CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create reviews for themselves
CREATE POLICY "Users can create own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews (for status changes)
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - TRANSACTIONS
-- ============================================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - PROMO CODES
-- ============================================================================

-- Anyone can view active promo codes (for validation)
CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes FOR SELECT
  USING (active = true);

-- ============================================================================
-- RLS POLICIES - PROMO CODE USAGE
-- ============================================================================

-- Users can view their own promo code usage
CREATE POLICY "Users can view own promo usage"
  ON public.promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- ADMIN HELPER FUNCTION
-- ============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADMIN RLS POLICIES
-- Grant admins full access to all tables
-- ============================================================================

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (is_admin());

-- Admins can update any user
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (is_admin());

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  USING (is_admin());

-- Admins can update any review
CREATE POLICY "Admins can update all reviews"
  ON public.reviews FOR UPDATE
  USING (is_admin());

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (is_admin());

-- Admins can manage promo codes
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (is_admin());

-- Admins can view all promo code usage
CREATE POLICY "Admins can view all promo usage"
  ON public.promo_code_usage FOR SELECT
  USING (is_admin());

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- Seed admin user (update email after running migration)
-- ============================================================================

-- Note: After running this migration, you'll need to:
-- 1. Sign up via Supabase Auth with your email
-- 2. Run: UPDATE public.users SET is_admin = true WHERE email = 'jchick@bridgeport.edu';
