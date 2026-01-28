-- Verification Script: Check claim_value migration status
-- Run this to verify the migration was applied correctly

-- Check 1: Verify claim_value column exists and is NOT NULL
SELECT 
  'Column Check' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'flash_offers' 
      AND column_name = 'claim_value'
      AND data_type = 'numeric'
      AND is_nullable = 'NO'
    ) THEN '✅ PASS: claim_value exists and is NOT NULL'
    ELSE '❌ FAIL: claim_value column not found or is nullable'
  END as result;

-- Check 2: Verify expected_value column does NOT exist
SELECT 
  'Old Column Check' as test,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'flash_offers' 
      AND column_name = 'expected_value'
    ) THEN '✅ PASS: expected_value column removed'
    ELSE '⚠️  WARNING: expected_value column still exists'
  END as result;

-- Check 3: Verify value_cap column does NOT exist
SELECT 
  'Legacy Column Check' as test,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'flash_offers' 
      AND column_name = 'value_cap'
    ) THEN '✅ PASS: value_cap column removed'
    ELSE '⚠️  WARNING: value_cap column still exists'
  END as result;

-- Check 4: Verify CHECK constraint exists
SELECT 
  'Constraint Check' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'flash_offers'::regclass 
      AND conname LIKE '%claim_value%'
    ) THEN '✅ PASS: CHECK constraint exists on claim_value'
    ELSE '❌ FAIL: CHECK constraint not found'
  END as result;

-- Check 5: Verify no NULL values exist
SELECT 
  'NULL Value Check' as test,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM flash_offers WHERE claim_value IS NULL
    ) THEN '✅ PASS: No NULL values in claim_value'
    ELSE '❌ FAIL: NULL values found in claim_value'
  END as result;

-- Check 6: Show sample data
SELECT 
  'Sample Data' as test,
  'See results below' as result;

SELECT 
  id,
  title,
  claim_value,
  status,
  created_at
FROM flash_offers 
ORDER BY created_at DESC 
LIMIT 5;

-- Summary
SELECT 
  '=== MIGRATION STATUS ===' as summary,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'flash_offers' 
      AND column_name = 'claim_value'
      AND is_nullable = 'NO'
    ) THEN '✅ Migration completed successfully!'
    ELSE '❌ Migration incomplete - please run migrations'
  END as status;
