-- Rollback Script: Venue Reviews & Ratings System
-- Run this script to completely remove the reviews and ratings system
-- WARNING: This will delete all review data permanently!

-- ============================================================================
-- Confirmation Message
-- ============================================================================

SELECT 'WARNING: This will permanently delete all review data!' as warning;
SELECT 'Make sure you have a backup before proceeding.' as warning;

-- ============================================================================
-- Drop RLS Policies
-- ============================================================================

-- Reviews table policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

-- Helpful votes table policies
DROP POLICY IF EXISTS "Anyone can view helpful votes" ON public.helpful_votes;
DROP POLICY IF EXISTS "Authenticated users can create helpful votes" ON public.helpful_votes;
DROP POLICY IF EXISTS "Users can delete own helpful votes" ON public.helpful_votes;

-- Venue responses table policies
DROP POLICY IF EXISTS "Anyone can view venue responses" ON public.venue_responses;
DROP POLICY IF EXISTS "Venue owners can create responses" ON public.venue_responses;
DROP POLICY IF EXISTS "Venue owners can update responses" ON public.venue_responses;
DROP POLICY IF EXISTS "Venue owners can delete responses" ON public.venue_responses;

-- Review reports table policies
DROP POLICY IF EXISTS "Users can view own reports" ON public.review_reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.review_reports;

-- ============================================================================
-- Drop Triggers
-- ============================================================================

-- Reviews table triggers
DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_insert ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_update ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_delete ON public.reviews;
DROP TRIGGER IF EXISTS trigger_set_verified_status ON public.reviews;
DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;

-- Helpful votes table triggers
DROP TRIGGER IF EXISTS trigger_update_helpful_count_on_insert ON public.helpful_votes;
DROP TRIGGER IF EXISTS trigger_update_helpful_count_on_delete ON public.helpful_votes;

-- Venue responses table triggers
DROP TRIGGER IF EXISTS venue_responses_updated_at ON public.venue_responses;

-- ============================================================================
-- Drop Functions
-- ============================================================================

DROP FUNCTION IF EXISTS update_venue_rating();
DROP FUNCTION IF EXISTS update_helpful_count();
DROP FUNCTION IF EXISTS set_verified_status();
DROP FUNCTION IF EXISTS update_reviews_updated_at();

-- ============================================================================
-- Drop Tables (in correct order due to foreign keys)
-- ============================================================================

DROP TABLE IF EXISTS public.review_reports CASCADE;
DROP TABLE IF EXISTS public.venue_responses CASCADE;
DROP TABLE IF EXISTS public.helpful_votes CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;

-- ============================================================================
-- Remove Columns from Venues Table
-- ============================================================================

ALTER TABLE public.venues 
DROP COLUMN IF EXISTS aggregate_rating,
DROP COLUMN IF EXISTS review_count;

-- Drop the index
DROP INDEX IF EXISTS public.idx_venues_aggregate_rating;

-- ============================================================================
-- Revoke Permissions
-- ============================================================================

-- Note: These will fail if tables are already dropped, which is fine
REVOKE ALL ON public.reviews FROM authenticated;
REVOKE ALL ON public.helpful_votes FROM authenticated;
REVOKE ALL ON public.venue_responses FROM authenticated;
REVOKE ALL ON public.review_reports FROM authenticated;

REVOKE ALL ON public.reviews FROM anon;
REVOKE ALL ON public.helpful_votes FROM anon;
REVOKE ALL ON public.venue_responses FROM anon;

-- ============================================================================
-- Success Message
-- ============================================================================

SELECT 'Venue reviews and ratings system has been completely removed.' as message;
SELECT 'All review data has been permanently deleted.' as warning;
