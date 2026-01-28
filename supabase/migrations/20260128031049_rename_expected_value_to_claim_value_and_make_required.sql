-- Migration: Rename expected_value to claim_value and make it required
-- Description: Renames flash_offers.expected_value to claim_value and adds NOT NULL constraint
-- This reflects that the value represents the actual claim value, not just an estimate

BEGIN;

-- Step 1: Rename the column
ALTER TABLE flash_offers
  RENAME COLUMN expected_value TO claim_value;

-- Step 2: Make the column NOT NULL (set default for existing NULL values first)
UPDATE flash_offers
SET claim_value = 0.00
WHERE claim_value IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE flash_offers
  ALTER COLUMN claim_value SET NOT NULL;

-- Step 4: Update column comment
COMMENT ON COLUMN flash_offers.claim_value IS 'Dollar value of the claim in USD (0-10000, required)';

-- Success message
SELECT 'Flash offers expected_value renamed to claim_value and made required!' as message;

COMMIT;;
