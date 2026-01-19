# Run Backend Verification Tests on Local Supabase
# This script executes verification queries against your local Supabase instance

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend Verification - Local Supabase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase is running
Write-Host "Checking if Supabase is running..." -ForegroundColor Yellow
$supabaseStatus = supabase status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase is not running!" -ForegroundColor Red
    Write-Host "Please run: supabase start" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase is running" -ForegroundColor Green
Write-Host ""

# Database connection details
$DB_HOST = "localhost"
$DB_PORT = "54322"
$DB_NAME = "postgres"
$DB_USER = "postgres"
$DB_PASSWORD = "postgres"

Write-Host "Running verification tests..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Check if tables exist
Write-Host "TEST 1: Checking if tables exist..." -ForegroundColor Cyan
$query1 = @"
SELECT 
    tablename,
    CASE 
        WHEN tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports') THEN '✅'
        ELSE '❌'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY tablename;
"@

supabase db query $query1

Write-Host ""

# Test 2: Check if venues table has new columns
Write-Host "TEST 2: Checking venues table columns..." -ForegroundColor Cyan
$query2 = @"
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('aggregate_rating', 'review_count') THEN '✅'
        ELSE 'ℹ️'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'venues'
    AND column_name IN ('aggregate_rating', 'review_count', 'id', 'name')
ORDER BY column_name;
"@

supabase db query $query2

Write-Host ""

# Test 3: Check if triggers exist
Write-Host "TEST 3: Checking database triggers..." -ForegroundColor Cyan
$query3 = @"
SELECT 
    tgname as trigger_name,
    '✅' as status
FROM pg_trigger 
WHERE tgname LIKE '%review%' OR tgname LIKE '%helpful%'
ORDER BY tgname;
"@

supabase db query $query3

Write-Host ""

# Test 4: Check if RLS is enabled
Write-Host "TEST 4: Checking RLS policies..." -ForegroundColor Cyan
$query4 = @"
SELECT 
    tablename,
    policyname,
    '✅' as status
FROM pg_policies 
WHERE tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY tablename, policyname;
"@

supabase db query $query4

Write-Host ""

# Test 5: Check if indexes exist
Write-Host "TEST 5: Checking database indexes..." -ForegroundColor Cyan
$query5 = @"
SELECT 
    indexname,
    tablename,
    '✅' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY tablename, indexname;
"@

supabase db query $query5

Write-Host ""

# Test 6: Get a test venue for manual testing
Write-Host "TEST 6: Getting test venue..." -ForegroundColor Cyan
$query6 = @"
SELECT 
    id,
    name,
    COALESCE(aggregate_rating, 0) as aggregate_rating,
    COALESCE(review_count, 0) as review_count
FROM venues 
LIMIT 1;
"@

Write-Host "Available test venue:" -ForegroundColor Yellow
supabase db query $query6

Write-Host ""

# Test 7: Check if any reviews exist
Write-Host "TEST 7: Checking existing reviews..." -ForegroundColor Cyan
$query7 = @"
SELECT 
    COUNT(*) as total_reviews,
    COUNT(DISTINCT venue_id) as venues_with_reviews,
    COUNT(DISTINCT user_id) as users_who_reviewed
FROM reviews;
"@

supabase db query $query7

Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Basic Verification Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review the results above" -ForegroundColor White
Write-Host "2. If all tables/triggers/policies exist, schema is correct ✅" -ForegroundColor White
Write-Host "3. To test functionality, run:" -ForegroundColor White
Write-Host "   .\database\test-review-functionality.ps1" -ForegroundColor Cyan
Write-Host ""
