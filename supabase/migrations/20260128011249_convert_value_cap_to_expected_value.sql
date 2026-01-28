-- Migration: Convert value_cap to expected_value
-- Description: Changes flash_offers.value_cap from VARCHAR(50) to DECIMAL(10,2)
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7

BEGIN;

-- Step 1: Add new expected_value column
ALTER TABLE flash_offers
  ADD COLUMN expected_value DECIMAL(10,2) CHECK (expected_value >= 0 AND expected_value <= 10000.00);

-- Step 2: Log warning for offers with text data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM flash_offers WHERE value_cap IS NOT NULL) THEN
    RAISE WARNING 'Found % offers with value_cap data that will be set to NULL', 
      (SELECT COUNT(*) FROM flash_offers WHERE value_cap IS NOT NULL);
  END IF;
END $$;

-- Step 3: Drop old value_cap column
ALTER TABLE flash_offers
  DROP COLUMN value_cap;

-- Step 4: Update column comment
COMMENT ON COLUMN flash_offers.expected_value IS 'Expected dollar value of the offer in USD (0-10000, nullable)';

-- Success message
SELECT 'Flash offers value_cap to expected_value migration completed successfully!' as message;

COMMIT;;
