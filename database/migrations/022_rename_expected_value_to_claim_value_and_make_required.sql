-- Migration: Rename expected_value to claim_value and make it required
-- Description: Renames flash_offers.expected_value to claim_value and adds NOT NULL constraint
-- This reflects that the value represents the actual claim value, not just an estimate
-- Note: This migration is idempotent and safe to run multiple times

BEGIN;

-- Step 1: Rename the column (only if expected_value exists and claim_value doesn't)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash_offers' AND column_name = 'expected_value'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash_offers' AND column_name = 'claim_value'
  ) THEN
    ALTER TABLE flash_offers RENAME COLUMN expected_value TO claim_value;
    RAISE NOTICE 'Renamed expected_value to claim_value';
  ELSE
    RAISE NOTICE 'Column already renamed or claim_value already exists, skipping rename';
  END IF;
END $$;

-- Step 2: Make the column NOT NULL (set default for existing NULL values first)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash_offers' 
    AND column_name = 'claim_value'
    AND is_nullable = 'YES'
  ) THEN
    -- Set NULL values to 0.00
    UPDATE flash_offers SET claim_value = 0.00 WHERE claim_value IS NULL;
    RAISE NOTICE 'Set NULL claim_value to 0.00';
    
    -- Add NOT NULL constraint
    ALTER TABLE flash_offers ALTER COLUMN claim_value SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to claim_value';
  ELSE
    RAISE NOTICE 'claim_value is already NOT NULL, skipping';
  END IF;
END $$;

-- Step 3: Update column comment (only if claim_value exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash_offers' AND column_name = 'claim_value'
  ) THEN
    COMMENT ON COLUMN flash_offers.claim_value IS 'Dollar value of the claim in USD (0-10000, required)';
    RAISE NOTICE 'Updated claim_value column comment';
  END IF;
END $$;

-- Success message
SELECT 'Flash offers expected_value renamed to claim_value and made required!' as message;

COMMIT;
