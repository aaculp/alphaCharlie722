# Apply migration 018 fix to add missing collection_follows column
# This script adds the missing column to the notification_preferences table

Write-Host "🔧 Applying migration 018 fix..." -ForegroundColor Cyan

# Read the migration file
$migrationPath = Join-Path $PSScriptRoot "018_add_social_notification_preferences.sql"

if (-not (Test-Path $migrationPath)) {
    Write-Host "❌ Migration file not found: $migrationPath" -ForegroundColor Red
    exit 1
}

$migrationSQL = Get-Content $migrationPath -Raw

Write-Host "📄 Migration file loaded" -ForegroundColor Green
Write-Host ""
Write-Host "This will add the missing 'collection_follows' column to notification_preferences table" -ForegroundColor Yellow
Write-Host ""
Write-Host "To apply this migration:" -ForegroundColor Cyan
Write-Host "1. Go to your Supabase Dashboard" -ForegroundColor White
Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
Write-Host "3. Copy and paste the SQL below" -ForegroundColor White
Write-Host "4. Click 'Run'" -ForegroundColor White
Write-Host ""
Write-Host "=== SQL TO RUN ===" -ForegroundColor Green
Write-Host $migrationSQL
Write-Host "=== END SQL ===" -ForegroundColor Green
Write-Host ""
Write-Host "✅ After running the SQL, restart your app to clear the schema cache" -ForegroundColor Cyan
