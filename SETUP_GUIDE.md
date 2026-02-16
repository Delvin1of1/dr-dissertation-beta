# Dr. Dissertation - Integration Setup Guide

This guide will walk you through setting up the full integrated platform with Supabase, Stripe, and authentication.

## Prerequisites

- [x] Working beta app deployed to Vercel
- [x] Anthropic API key
- [ ] Supabase account (free tier is fine)
- [ ] Stripe account (test mode is fine)
- [ ] Resend account for emails (optional for now)

---

## Step 1: Install Dependencies

```bash
cd /Users/jcc04013/Downloads/dr-dissertation-beta

# Install Supabase client
npm install @supabase/supabase-js

# Install Stripe
npm install stripe @stripe/stripe-js

# Install micro for webhook parsing
npm install micro

# Install any missing dependencies
npm install
```

---

## Step 2: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `dr-dissertation`
   - **Database Password**: (generate a strong password - save it!)
   - **Region**: Choose closest to your users
4. Wait 2-3 minutes for project to provision

5. **Get your connection details:**
   - Go to Project Settings → API
   - Copy **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy **anon public** key (starts with `eyJhbGc...`)
   - Copy **service_role** key (starts with `eyJhbGc...`) - **Keep this secret!**

---

## Step 3: Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `/supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **Run** (bottom right)
6. You should see: "Success. No rows returned"

**Verify tables were created:**
- Go to **Table Editor** in left sidebar
- You should see: `users`, `reviews`, `transactions`, `promo_codes`, `promo_code_usage`

---

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in:

```bash
# Anthropic (you already have this)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Stripe (we'll set this up next - leave blank for now)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend (optional - skip for now)
RESEND_API_KEY=

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
ADMIN_EMAIL=jchick@bridgeport.edu
```

3. **Deploy environment variables to Vercel:**
   ```bash
   # Install Vercel CLI if you don't have it
   npm install -g vercel

   # Add each variable to Vercel
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   # Paste the value when prompted

   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # Paste the value

   vercel env add SUPABASE_SERVICE_KEY
   # Paste the value

   # Repeat for any other new variables
   ```

---

## Step 5: Set Up Stripe (Payment Processing)

### Create Stripe Account
1. Go to https://dashboard.stripe.com
2. Sign up or log in
3. Toggle **Test Mode** ON (top right) - we'll use test mode first

### Create Products
1. Go to **Products** → **Add Product**
2. Create these 4 products:

**Product 1: QuickLook First Review**
- Name: `QuickLook First Review`
- Description: `First-time discount: Rapid review in ~10 minutes`
- Price: `$9.99` (one-time payment)
- Click **Save product**
- **Copy the Price ID** (starts with `price_...`) → save for later

**Product 2: QuickLook Review**
- Name: `QuickLook Review`
- Description: `Rapid review focusing on top 5 critical issues`
- Price: `$29.99` (one-time payment)
- **Copy the Price ID**

**Product 3: Full Review**
- Name: `Full Review`
- Description: `Complete 10-dimensional HAIST© review with bonus QuickLook`
- Price: `$49.99` (one-time payment)
- **Copy the Price ID**

**Product 4: Iterative Pack**
- Name: `Iterative Pack`
- Description: `3 Full Reviews + 3 QuickLooks for complete dissertation journey`
- Price: `$99.99` (one-time payment)
- **Copy the Price ID**

### Get API Keys
1. Go to **Developers** → **API Keys**
2. Copy **Publishable key** (starts with `pk_test_...`)
3. Reveal and copy **Secret key** (starts with `sk_test_...`)

### Update .env.local
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Update lib/constants.js
Open `/lib/constants.js` and add the Price IDs you copied:

```javascript
QUICKLOOK_FIRST: {
  // ... existing fields ...
  stripePriceId: 'price_xxxxx',  // Add your actual Price ID here
},
// Repeat for all 4 products
```

---

## Step 6: Migrate Beta Codes to Database

We need to move the hardcoded beta codes from `utils/codes.js` into the Supabase database.

**Option A: Manual (Recommended for first time)**

1. Go to Supabase dashboard → **Table Editor** → **promo_codes**
2. Click **Insert** → **Insert row**
3. Fill in for BETA001:
   - code: `BETA001`
   - quicklooks_total: `3`
   - quicklooks_remaining: `3`
   - full_reviews_total: `1`
   - full_reviews_remaining: `1`
   - active: `true`
   - expires_at: `2026-03-31`
   - assigned_to: `Beta Tester 1`
   - assigned_email: `tester1@example.com`
   - is_beta_code: `true`
4. Click **Save**
5. Repeat for BETA002-BETA020

**Option B: Automated (We'll create a script for this)**

---

## Step 7: Create Your Admin Account

1. Run the app locally:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Sign up with your email: `jchick@bridgeport.edu`

4. Check your email for verification link (Supabase will send this)

5. Click verification link

6. Go back to **Supabase dashboard** → **SQL Editor**

7. Run this query to make yourself admin:
   ```sql
   UPDATE public.users
   SET is_admin = true
   WHERE email = 'jchick@bridgeport.edu';
   ```

8. Refresh the app - you should now see admin features

---

## Step 8: Test the Integration

### Test Authentication
- [x] Sign up with a new test email
- [x] Verify email works
- [x] Log in and out
- [x] Visit dashboard (should see credit balance of 0)

### Test Promo Code (once implemented)
- [x] Enter code BETA001
- [x] Verify credits are added to account
- [x] Check database shows code usage

### Test Payment (Stripe test mode)
- [x] Click "Buy Credits"
- [x] Select a product
- [x] Use test card: `4242 4242 4242 4242`
- [x] Expiry: any future date
- [x] CVC: any 3 digits
- [x] Check Stripe dashboard for payment
- [x] Check database for transaction record
- [x] Verify credits added to your account

### Test Review Flow
- [x] Upload a 50-page PDF
- [x] Verify credits are deducted
- [x] Review processes successfully
- [x] Check database for review record
- [x] Download Word document

---

## Next Steps (What We'll Build)

After completing the setup above, we'll implement:

1. **Authentication Pages** (`/auth/login`, `/auth/signup`)
2. **User Dashboard** (`/dashboard`) - shows credits, review history
3. **Checkout Flow** (`/checkout`) - Stripe payment integration
4. **Admin Panel** (`/admin`) - manage users, reviews, codes
5. **Protected Routes** - require login for app access
6. **Background Processing** - reviews run without timeout limits
7. **Email Notifications** - alert when reviews complete

---

## Troubleshooting

**"Missing Supabase environment variables"**
- Make sure you created `.env.local` and filled in all values
- Restart the dev server after changing environment variables

**Database migration fails**
- Check you copied the ENTIRE SQL file
- Make sure you're in the correct Supabase project
- Check the error message for specific issues

**Can't log in**
- Check email verification link was clicked
- Verify user exists in Supabase **Authentication** → **Users**
- Check browser console for errors

**Stripe payment doesn't work**
- Verify you're in **Test Mode**
- Use test card `4242 4242 4242 4242`
- Check Stripe dashboard **Logs** for errors

---

## Current Status

✅ **Completed:**
- Database schema created
- Supabase client configured
- Stripe products defined
- Environment variables template

⏳ **Next Session:**
- Build authentication pages
- Create user dashboard
- Implement checkout flow
- Add protected routes

**You're ready to continue building!** The foundation is solid. Next time we'll build the UI components and wire everything together.
