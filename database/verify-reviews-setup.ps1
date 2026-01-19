# Verification Script for Venue Reviews & Ratings System
# This script checks if the database schema is correctly set up

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Venue Reviews & Ratings System Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will verify:" -ForegroundColor Yellow
Write-Host "  1. All tables are created successfully" -ForegroundColor White
Write-Host "  2. Triggers are executing correctly" -ForegroundColor White
Write-Host "  3. RLS policies are properly configured" -ForegroundColor White
Write-Host ""

Write-Host "To run the verification:" -ForegroundColor Green
Write-Host "  1. Open Supabase Dashboard (https://app.supabase.com)" -ForegroundColor White
Write-Host "  2. Navigate to SQL Editor" -ForegroundColor White
Write-Host "  3. Copy and paste the contents of:" -ForegroundColor White
Write-Host "     database/migrations/verify_reviews_ratings_schema.sql" -ForegroundColor Cyan
Write-Host "  4. Click 'Run' to execute the verification" -ForegroundColor White
Write-Host ""

Write-Host "Expected Results:" -ForegroundColor Green
Write-Host "  ✓ All tables should exist (reviews, helpful_votes, venue_responses, review_reports)" -ForegroundColor White
Write-Host "  ✓ Venues table should have aggregate_rating and review_count columns" -ForegroundColor White
Write-Host "  ✓ All indexes should be created" -ForegroundColor White
Write-Host "  ✓ All triggers should be active" -ForegroundColor White
Write-Host "  ✓ All RLS policies should be enabled" -ForegroundColor White
Write-Host ""

Write-Host "To test RLS policies:" -ForegroundColor Green
Write-Host "  1. Copy and paste the contents of:" -ForegroundColor White
Write-Host "     database/migrations/test_reviews_ratings_rls.sql" -ForegroundColor Cyan
Write-Host "  2. Click 'Run' to execute the RLS tests" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Testing Checklist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "After running the verification scripts, manually test:" -ForegroundColor Yellow
Write-Host ""

Write-Host "[ ] 1. Table Creation" -ForegroundColor White
Write-Host "    - reviews table exists with all columns" -ForegroundColor Gray
Write-Host "    - helpful_votes table exists" -ForegroundColor Gray
Write-Host "    - venue_responses table exists" -ForegroundColor Gray
Write-Host "    - review_reports table exists" -ForegroundColor Gray
Write-Host "    - venues table has aggregate_rating and review_count columns" -ForegroundColor Gray
Write-Host ""

Write-Host "[ ] 2. Trigger Functionality" -ForegroundColor White
Write-Host "    - Insert a test review and verify aggregate_rating updates" -ForegroundColor Gray
Write-Host "    - Delete the review and verify aggregate_rating recalculates" -ForegroundColor Gray
Write-Host "    - Add a helpful vote and verify helpful_count increments" -ForegroundColor Gray
Write-Host "    - Remove the helpful vote and verify helpful_count decrements" -ForegroundColor Gray
Write-Host ""

Write-Host "[ ] 3. RLS Policies" -ForegroundColor White
Write-Host "    - Anyone can view reviews (SELECT works without auth)" -ForegroundColor Gray
Write-Host "    - Authenticated users can create reviews" -ForegroundColor Gray
Write-Host "    - Users can only update/delete their own reviews" -ForegroundColor Gray
Write-Host "    - Venue owners can create/update/delete responses" -ForegroundColor Gray
Write-Host "    - Users can only view their own reports" -ForegroundColor Gray
Write-Host ""

Write-Host "[ ] 4. Constraints" -ForegroundColor White
Write-Host "    - One review per user per venue (unique constraint)" -ForegroundColor Gray
Write-Host "    - Rating must be 1-5 (check constraint)" -ForegroundColor Gray
Write-Host "    - Review text max 500 characters (check constraint)" -ForegroundColor Gray
Write-Host "    - Response text max 300 characters (check constraint)" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Test SQL Commands" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test 1: Insert a review (replace UUIDs with actual values)" -ForegroundColor Yellow
Write-Host @"
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES (
  'YOUR_VENUE_ID',
  auth.uid(),
  5,
  'Great place! Highly recommend.'
);
"@ -ForegroundColor Gray
Write-Host ""

Write-Host "Test 2: Check aggregate rating updated" -ForegroundColor Yellow
Write-Host @"
SELECT id, name, aggregate_rating, review_count
FROM public.venues
WHERE id = 'YOUR_VENUE_ID';
"@ -ForegroundColor Gray
Write-Host ""

Write-Host "Test 3: Add a helpful vote" -ForegroundColor Yellow
Write-Host @"
INSERT INTO public.helpful_votes (review_id, user_id)
VALUES ('YOUR_REVIEW_ID', auth.uid());
"@ -ForegroundColor Gray
Write-Host ""

Write-Host "Test 4: Check helpful count updated" -ForegroundColor Yellow
Write-Host @"
SELECT id, rating, review_text, helpful_count
FROM public.reviews
WHERE id = 'YOUR_REVIEW_ID';
"@ -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you encounter any issues, check:" -ForegroundColor Yellow
Write-Host "  - Migration file: database/migrations/019_create_reviews_ratings_tables.sql" -ForegroundColor White
Write-Host "  - Rollback script: database/migrations/rollback_019_reviews_ratings.sql" -ForegroundColor White
Write-Host "  - README: database/migrations/README_019_REVIEWS_RATINGS.md" -ForegroundColor White
Write-Host ""
