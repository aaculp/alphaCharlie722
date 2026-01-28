-- Migration: Convert value_cap to expected_value
-- Description: Changes flash_offers.value_cap from VARCHAR(50) to DECIMAL(10,2)
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
-- Note: This migration is idempotent and safe to run multiple times

BEGIN;

-- Step 1: Add new expected_value column (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash_offers' AND column_name = 'expected_value'
  ) THEN
    ALTER TABLE flash_offers
      ADD COLUMN expected_value DECIMAL(10,2) CHECK (expected_value >= 0 AND expected_value <= 10000.00);
    RAISE NOTICE 'Added expected_value column';
  ELSE
    RAISE NOTICE 'expected_value column already exists, skipping';
  END IF;
END $$;

-- Step 2: Log warning for offers with text data (only if value_cap exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash_offers' AND column_name = 'value_cap'
  ) THEN
    IF EXISTS (SELECT 1 FROM flash_offers WHERE value_cap IS NOT NULL) THEN
      RAISE WARNING 'Found % offers with value_cap data that will be set to NULL', 
        (SELECT COUNT(*) FROM flash_offers WHERE value_cap IS NOT NULL);
    END IF;
  ELSE
    RAISE NOTICE 'value_cap column does not exist, skipping warning';
  END IF;
END $$;

-- Step 3: Drop old value_cap column (only if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash_offers' AND column_name = 'value_cap'
  ) THEN
    ALTER TABLE flash_offers DROP COLUMN value_cap;
    RAISE NOTICE 'Dropped value_cap column';
  ELSE
    RAISE NOTICE 'value_cap column does not exist, skipping drop';
  END IF;
END $$;

-- Step 4: Update column comment (only if expected_value exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash_offers' AND column_name = 'expected_value'
  ) THEN
    COMMENT ON COLUMN flash_offers.expected_value IS 'Expected dollar value of the offer in USD (0-10000, nullable)';
    RAISE NOTICE 'Updated expected_value column comment';
  END IF;
END $$;

-- Success message
SELECT 'Flash offers value_cap to expected_value migration completed successfully!' as message;

COMMIT;
