# PowerShell script to apply the RPC fix for review triggers
# This script helps you run the SQL file in Supabase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Review Trigger RPC Fix - Setup Guide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PROBLEM:" -ForegroundColor Yellow
Write-Host "  Database triggers don't fire when reviews are updated through the app."
Write-Host "  This causes venue ratings to become stale."
Write-Host ""

Write-Host "SOLUTION:" -ForegroundColor Green
Write-Host "  Use PostgreSQL RPC functions that the app calls directly."
Write-Host "  This ensures venue ratings update atomically with reviews."
Write-Host ""

Write-Host "STEPS TO FIX:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Open Supabase Dashboard" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Copy the SQL script" -ForegroundColor White
Write-Host "   File: database/fix-review-trigger-with-rpc.sql" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Paste and run the SQL in Supabase SQL Editor" -ForegroundColor White
Write-Host ""

Write-Host "4. Verify the output shows:" -ForegroundColor White
Write-Host "   ✅ RPC functions created successfully!" -ForegroundColor Green
Write-Host "   ✅ Venue ratings updated!" -ForegroundColor Green
Write-Host ""

Write-Host "5. Reload your app with cache reset:" -ForegroundColor White
Write-Host "   npm start --reset-cache" -ForegroundColor Gray
Write-Host ""

Write-Host "6. Test the fix:" -ForegroundColor White
Write-Host "   - Open Palm Bay Test Venue" -ForegroundColor Gray
Write-Host "   - Update your review rating" -ForegroundColor Gray
Write-Host "   - Go back to HomeScreen" -ForegroundColor Gray
Write-Host "   - Pull down to refresh" -ForegroundColor Gray
Write-Host "   - Verify the venue card shows updated rating" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Press any key to open the SQL file..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open the SQL file in default editor
$sqlFile = Join-Path $PSScriptRoot "fix-review-trigger-with-rpc.sql"
if (Test-Path $sqlFile) {
    Start-Process $sqlFile
    Write-Host ""
    Write-Host "✅ SQL file opened!" -ForegroundColor Green
    Write-Host "Copy the contents and paste into Supabase SQL Editor" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "For detailed documentation, see:" -ForegroundColor Cyan
Write-Host "  database/REVIEW_TRIGGER_RPC_FIX.md" -ForegroundColor Gray
Write-Host ""
