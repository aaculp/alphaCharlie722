# Run Database Migrations
# Requirements: 10.1, 10.5 - Run database migrations for notification preferences and rate limits

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectRef = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Local = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$MigrationFile = "database/migrations/017_notification_preferences_and_rate_limits.sql"
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Database Migration Runner" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if migration file exists
if (-not (Test-Path $MigrationFile)) {
    Write-Host "[ERROR] Migration file not found: $MigrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Migration file: $MigrationFile" -ForegroundColor Cyan
Write-Host ""

if ($Local) {
    Write-Host "Running migration on LOCAL database..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if local Supabase is running
    Write-Host "Checking if local Supabase is running..." -ForegroundColor Gray
    $statusOutput = supabase status 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Local Supabase is not running." -ForegroundColor Red
        Write-Host "Start it with: supabase start" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "[OK] Local Supabase is running" -ForegroundColor Green
    Write-Host ""
    
    # Run migration using psql
    Write-Host "Executing migration..." -ForegroundColor Yellow
    
    # Get local database connection details
    $dbUrl = "postgresql://postgres:postgres@localhost:54322/postgres"
    
    # Execute migration
    Get-Content $MigrationFile | psql $dbUrl
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Migration failed!" -ForegroundColor Red
        exit 1
    }
    
} else {
    Write-Host "Running migration on REMOTE database..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrEmpty($ProjectRef)) {
        Write-Host "[ERROR] Project reference is required for remote migration." -ForegroundColor Red
        Write-Host "Usage: .\run-migrations.ps1 -ProjectRef <your-project-ref>" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Project: $ProjectRef" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if logged in
    Write-Host "Checking authentication..." -ForegroundColor Gray
    $loginCheck = supabase projects list 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Not logged in to Supabase." -ForegroundColor Red
        Write-Host "Login with: supabase login" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "[OK] Authenticated" -ForegroundColor Green
    Write-Host ""
    
    # Execute migration using Supabase CLI
    Write-Host "Executing migration..." -ForegroundColor Yellow
    
    supabase db execute -f $MigrationFile --project-ref $ProjectRef
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Migration failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  1. Migration already applied (check if tables exist)" -ForegroundColor Gray
        Write-Host "  2. Syntax errors in SQL (review the migration file)" -ForegroundColor Gray
        Write-Host "  3. Permission issues (check database role)" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tables created/updated:" -ForegroundColor Yellow
Write-Host "  - notification_preferences" -ForegroundColor Gray
Write-Host "  - flash_offer_rate_limits" -ForegroundColor Gray
Write-Host ""

Write-Host "RLS policies updated:" -ForegroundColor Yellow
Write-Host "  - device_tokens (secure policies)" -ForegroundColor Gray
Write-Host "  - notification_preferences (user access)" -ForegroundColor Gray
Write-Host "  - flash_offer_rate_limits (no direct access)" -ForegroundColor Gray
Write-Host ""

Write-Host "Functions created:" -ForegroundColor Yellow
Write-Host "  - cleanup_expired_rate_limits()" -ForegroundColor Gray
Write-Host "  - update_notification_preferences_updated_at()" -ForegroundColor Gray
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify tables exist in your database" -ForegroundColor Gray
Write-Host "  2. Test RLS policies with a test user" -ForegroundColor Gray
Write-Host "  3. Deploy Edge Function if not already done" -ForegroundColor Gray
Write-Host ""
