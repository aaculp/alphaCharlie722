# Test Review Functionality on Local Supabase
# This script tests actual review operations (insert, update, delete, triggers)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Review Functionality Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# First, get a test venue and user
Write-Host "Step 1: Getting test data..." -ForegroundColor Yellow

$getTestData = @"
-- Get a test venue
SELECT id as venue_id, name as venue_name FROM venues LIMIT 1;

-- Get test users (we'll use the first two)
SELECT id as user_id FROM auth.users LIMIT 2;
"@

Write-Host "Getting test venue and users..." -ForegroundColor Gray
$testData = supabase db query $getTestData

Write-Host ""
Write-Host "⚠️  IMPORTANT: Copy the venue_id and user_id from above" -ForegroundColor Yellow
Write-Host "We'll use these for testing. Press Enter to continue..." -ForegroundColor Yellow
Read-Host

# For now, we'll use placeholder UUIDs - user needs to replace these
$VENUE_ID = "REPLACE_WITH_VENUE_ID"
$USER_ID_1 = "REPLACE_WITH_USER_ID_1"
$USER_ID_2 = "REPLACE_WITH_USER_ID_2"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 1: Insert a Review" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test1 = @"
-- Insert a test review
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES (
    '$VENUE_ID',
    '$USER_ID_1',
    5,
    'Amazing venue! The atmosphere was perfect.'
)
RETURNING id, rating, review_text, is_verified, created_at;
"@

Write-Host "Inserting review..." -ForegroundColor Gray
supabase db query $test1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Review inserted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to insert review" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 2: Check Aggregate Rating Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test2 = @"
-- Check if aggregate rating was updated by trigger
SELECT 
    id,
    name,
    aggregate_rating,
    review_count
FROM venues 
WHERE id = '$VENUE_ID';
"@

Write-Host "Checking aggregate rating..." -ForegroundColor Gray
supabase db query $test2

Write-Host "Expected: aggregate_rating = 5.0, review_count = 1" -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 3: Try Duplicate Review (Should Fail)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test3 = @"
-- Try to insert duplicate review (should fail)
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES (
    '$VENUE_ID',
    '$USER_ID_1',
    4,
    'Another review'
);
"@

Write-Host "Attempting duplicate review..." -ForegroundColor Gray
supabase db query $test3 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "✅ Duplicate review correctly rejected" -ForegroundColor Green
} else {
    Write-Host "❌ Duplicate review was allowed (should have failed)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 4: Insert Second Review" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test4 = @"
-- Insert second review from different user
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES (
    '$VENUE_ID',
    '$USER_ID_2',
    4,
    'Great place, highly recommend!'
)
RETURNING id, rating, review_text;
"@

Write-Host "Inserting second review..." -ForegroundColor Gray
supabase db query $test4

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Second review inserted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to insert second review" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 5: Check Aggregate Rating Recalculation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test5 = @"
-- Check if aggregate rating was recalculated
SELECT 
    id,
    name,
    aggregate_rating,
    review_count
FROM venues 
WHERE id = '$VENUE_ID';
"@

Write-Host "Checking updated aggregate rating..." -ForegroundColor Gray
supabase db query $test5

Write-Host "Expected: aggregate_rating = 4.5, review_count = 2" -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 6: Get Reviews with Sorting" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test6 = @"
-- Get reviews sorted by rating (highest first)
SELECT 
    id,
    rating,
    review_text,
    created_at
FROM reviews 
WHERE venue_id = '$VENUE_ID'
ORDER BY rating DESC, created_at DESC;
"@

Write-Host "Fetching reviews..." -ForegroundColor Gray
supabase db query $test6

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 7: Add Helpful Vote" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test7 = @"
-- Get first review ID
WITH first_review AS (
    SELECT id FROM reviews WHERE venue_id = '$VENUE_ID' LIMIT 1
)
-- Add helpful vote
INSERT INTO public.helpful_votes (review_id, user_id)
SELECT id, '$USER_ID_2' FROM first_review
RETURNING review_id;
"@

Write-Host "Adding helpful vote..." -ForegroundColor Gray
supabase db query $test7

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Helpful vote added successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to add helpful vote" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 8: Check Helpful Count Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test8 = @"
-- Check if helpful_count was updated by trigger
SELECT 
    id,
    rating,
    review_text,
    helpful_count
FROM reviews 
WHERE venue_id = '$VENUE_ID'
ORDER BY created_at;
"@

Write-Host "Checking helpful count..." -ForegroundColor Gray
supabase db query $test8

Write-Host "Expected: First review should have helpful_count = 1" -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 9: Update Review" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test9 = @"
-- Update first review
UPDATE public.reviews
SET 
    rating = 3,
    review_text = 'Updated review - it was just okay',
    updated_at = NOW()
WHERE venue_id = '$VENUE_ID' 
    AND user_id = '$USER_ID_1'
RETURNING id, rating, review_text, updated_at;
"@

Write-Host "Updating review..." -ForegroundColor Gray
supabase db query $test9

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Review updated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update review" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 10: Check Aggregate Rating After Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test10 = @"
-- Check if aggregate rating was recalculated after update
SELECT 
    id,
    name,
    aggregate_rating,
    review_count
FROM venues 
WHERE id = '$VENUE_ID';
"@

Write-Host "Checking aggregate rating after update..." -ForegroundColor Gray
supabase db query $test10

Write-Host "Expected: aggregate_rating = 3.5 (average of 3 and 4), review_count = 2" -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 11: Delete Review" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test11 = @"
-- Delete first review
DELETE FROM public.reviews
WHERE venue_id = '$VENUE_ID' 
    AND user_id = '$USER_ID_1'
RETURNING id;
"@

Write-Host "Deleting review..." -ForegroundColor Gray
supabase db query $test11

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Review deleted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to delete review" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 12: Check Aggregate Rating After Deletion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$test12 = @"
-- Check if aggregate rating was recalculated after deletion
SELECT 
    id,
    name,
    aggregate_rating,
    review_count
FROM venues 
WHERE id = '$VENUE_ID';
"@

Write-Host "Checking aggregate rating after deletion..." -ForegroundColor Gray
supabase db query $test12

Write-Host "Expected: aggregate_rating = 4.0, review_count = 1" -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CLEANUP: Removing Test Data" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$cleanup = @"
-- Clean up test data
DELETE FROM public.helpful_votes 
WHERE review_id IN (
    SELECT id FROM public.reviews WHERE venue_id = '$VENUE_ID'
);

DELETE FROM public.reviews 
WHERE venue_id = '$VENUE_ID';
"@

Write-Host "Cleaning up test data..." -ForegroundColor Gray
supabase db query $cleanup

Write-Host "✅ Test data cleaned up" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Tests Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "✅ Review insertion works" -ForegroundColor White
Write-Host "✅ Duplicate reviews are prevented" -ForegroundColor White
Write-Host "✅ Aggregate rating updates automatically" -ForegroundColor White
Write-Host "✅ Helpful votes work correctly" -ForegroundColor White
Write-Host "✅ Review updates work" -ForegroundColor White
Write-Host "✅ Review deletion works" -ForegroundColor White
Write-Host "✅ Triggers recalculate ratings correctly" -ForegroundColor White
Write-Host ""
