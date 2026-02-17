// scripts/migrate-beta-codes.js
// Migrates BETA001-BETA020 codes from utils/codes.js into Supabase database

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { BETA_CODES } from '../utils/codes.js';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateBetaCodes() {
  console.log('🚀 Starting beta code migration...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const [code, data] of Object.entries(BETA_CODES)) {
    try {
      // Check if code already exists
      const { data: existing } = await supabase
        .from('promo_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping ${code} - already exists`);
        continue;
      }

      // Insert the code
      const { error } = await supabase.from('promo_codes').insert({
        code,
        quicklooks_total: 3,
        quicklooks_remaining: data.quickLooksRemaining,
        full_reviews_total: 1,
        full_reviews_remaining: data.fullReviewsRemaining,
        active: data.active,
        expires_at: data.expiresAt,
        assigned_to: data.assignedTo,
        assigned_email: data.email,
        is_beta_code: true,
        description: `Beta tester code for ${data.assignedTo}`,
      });

      if (error) {
        console.error(`❌ Error inserting ${code}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Migrated ${code} → ${data.assignedTo}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Unexpected error with ${code}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Complete!');
  console.log(`✅ Successfully migrated: ${successCount} codes`);
  console.log(`❌ Errors: ${errorCount} codes`);
}

migrateBetaCodes().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
