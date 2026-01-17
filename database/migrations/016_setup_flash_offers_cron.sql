-- Setup Script: Enable and Schedule Flash Offers Expiration Job
-- Description: Quick setup script to enable pg_cron and schedule the expiration job
-- Requirements: Flash Offers MVP - Task 4.2
-- 
-- INSTRUCTIONS:
-- 1. First, enable pg_cron extension in Supabase Dashboard:
--    Database → Extensions → Enable "pg_cron"
-- 2. Then run this script in the Supabase SQL Editor
-- 3. Verify the job is scheduled by running the verification queries at the end

-- ============================================================================
-- Step 1: Verify pg_cron is Enabled
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'pg_cron extension is not enabled. Please enable it in the Supabase Dashboard: Database → Extensions → pg_cron';
  ELSE
    RAISE NOTICE 'pg_cron extension is enabled ✓';
  END IF;
END $$;

-- ============================================================================
-- Step 2: Remove Existing Job (if any)
-- ============================================================================

DO $$
BEGIN
  -- Check if job exists and unschedule it
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'flash-offers-expiration') THEN
    PERFORM cron.unschedule('flash-offers-expiration');
    RAISE NOTICE 'Removed existing flash-offers-expiration job';
  END IF;
END $$;

-- ============================================================================
-- Step 3: Schedule the Expiration Job
-- ============================================================================
-- Default: Run every 2 minutes (balanced approach)
-- To change frequency, modify the cron expression below:
--   '*/1 * * * *'  = Every 1 minute (most responsive)
--   '*/2 * * * *'  = Every 2 minutes (recommended)
--   '*/5 * * * *'  = Every 5 minutes (lower load)
--   '*/10 * * * *' = Every 10 minutes (minimal load)

SELECT cron.schedule(
  'flash-offers-expiration',           -- Job name
  '*/2 * * * *',                       -- Run every 2 minutes
  $$ SELECT run_flash_offers_expiration_job_with_logging(); $$
);

-- ============================================================================
-- Step 4: Verify Job is Scheduled
-- ============================================================================

-- Display the scheduled job details
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command,
  nodename,
  database
FROM cron.job 
WHERE jobname = 'flash-offers-expiration';

-- ============================================================================
-- Step 5: Run Initial Test
-- ============================================================================

-- Run the job once manually to verify it works
SELECT run_flash_offers_expiration_job_with_logging();

-- View the execution log
SELECT 
  created_at,
  offers_activated,
  offers_expired,
  offers_marked_full,
  claims_expired,
  CASE 
    WHEN array_length(errors, 1) > 0 THEN 'Has Errors'
    ELSE 'Success'
  END as status,
  errors
FROM flash_offers_expiration_log
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Flash Offers Expiration Job Setup Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Job Name: flash-offers-expiration';
  RAISE NOTICE 'Schedule: Every 2 minutes';
  RAISE NOTICE 'Status: Active';
  RAISE NOTICE '';
  RAISE NOTICE 'The job will automatically:';
  RAISE NOTICE '  ✓ Activate scheduled offers';
  RAISE NOTICE '  ✓ Expire offers past end_time';
  RAISE NOTICE '  ✓ Mark offers as full';
  RAISE NOTICE '  ✓ Expire unclaimed tokens';
  RAISE NOTICE '';
  RAISE NOTICE 'Monitor executions with:';
  RAISE NOTICE '  SELECT * FROM flash_offers_expiration_summary LIMIT 10;';
  RAISE NOTICE '';
  RAISE NOTICE 'For more details, see: database/migrations/README_FLASH_OFFERS_EXPIRATION.md';
END $$;

-- ============================================================================
-- Optional: Schedule Log Cleanup Job
-- ============================================================================
-- Uncomment to automatically clean up logs older than 30 days
-- This runs daily at 2 AM

/*
SELECT cron.schedule(
  'flash-offers-log-cleanup',
  '0 2 * * *',  -- Daily at 2 AM
  $$ DELETE FROM flash_offers_expiration_log WHERE created_at < NOW() - INTERVAL '30 days'; $$
);
*/

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these queries to verify everything is working:

-- 1. Check scheduled jobs
-- SELECT * FROM cron.job WHERE jobname LIKE 'flash-offers%';

-- 2. View recent executions
-- SELECT * FROM flash_offers_expiration_summary LIMIT 10;

-- 3. Check for errors
-- SELECT * FROM flash_offers_expiration_log WHERE array_length(errors, 1) > 0;

-- 4. Monitor job performance
-- SELECT 
--   COUNT(*) as executions_last_hour,
--   AVG(offers_expired + claims_expired + offers_activated + offers_marked_full) as avg_updates
-- FROM flash_offers_expiration_log
-- WHERE created_at > NOW() - INTERVAL '1 hour';
