# Complete Deployment Script
# Runs all deployment steps in order
# Requirements: 10.1, 10.2, 10.5, 10.6

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectRef,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipMigrations = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipRLS = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipFunction = $false
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Flash Offer Push Backend Deployment  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project: $ProjectRef" -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date

# Step 1: Validate secrets
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Validating Secrets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

& "$PSScriptRoot\validate-secrets.ps1" -ProjectRef $ProjectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[DEPLOYMENT FAILED] Secret validation failed" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# Step 2: Run database migrations
if (-not $SkipMigrations) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Step 2: Running Database Migrations" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    & "$PSScriptRoot\run-migrations.ps1" -ProjectRef $ProjectRef
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[DEPLOYMENT FAILED] Database migration failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "To rollback, see ROLLBACK.md" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2
} else {
    Write-Host "[SKIPPED] Database migrations" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Update RLS policies
if (-not $SkipRLS) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Step 3: Updating RLS Policies" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    & "$PSScriptRoot\update-rls-policies.ps1" -ProjectRef $ProjectRef
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[DEPLOYMENT FAILED] RLS policy update failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "To rollback, see ROLLBACK.md" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2
} else {
    Write-Host "[SKIPPED] RLS policy updates" -ForegroundColor Yellow
    Write-Host ""
}

# Step 4: Deploy Edge Function
if (-not $SkipFunction) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Step 4: Deploying Edge Function" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    & "$PSScriptRoot\deploy-edge-function.ps1" -ProjectRef $ProjectRef -SkipValidation
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[DEPLOYMENT FAILED] Edge Function deployment failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "To rollback, see ROLLBACK.md" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
    Write-Host ""
} else {
    Write-Host "[SKIPPED] Edge Function deployment" -ForegroundColor Yellow
    Write-Host ""
}

# Deployment complete
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL!  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Deployment completed in $($duration.TotalSeconds) seconds" -ForegroundColor Cyan
Write-Host ""

Write-Host "What was deployed:" -ForegroundColor Yellow
if (-not $SkipMigrations) {
    Write-Host "  ✓ Database migrations (notification_preferences, flash_offer_rate_limits)" -ForegroundColor Green
}
if (-not $SkipRLS) {
    Write-Host "  ✓ RLS policies (device_tokens security)" -ForegroundColor Green
}
if (-not $SkipFunction) {
    Write-Host "  ✓ Edge Function (send-flash-offer-push)" -ForegroundColor Green
}
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the Edge Function with a dry-run request" -ForegroundColor Gray
Write-Host "  2. Monitor logs: supabase functions logs send-flash-offer-push --project-ref $ProjectRef" -ForegroundColor Gray
Write-Host "  3. Deploy React Native app updates to use the Edge Function" -ForegroundColor Gray
Write-Host "  4. Monitor for errors in the first 24-48 hours" -ForegroundColor Gray
Write-Host ""

Write-Host "Testing command:" -ForegroundColor Yellow
Write-Host @"
  curl -X POST https://<your-project>.supabase.co/functions/v1/send-flash-offer-push \
    -H "Authorization: Bearer <jwt-token>" \
    -H "Content-Type: application/json" \
    -d '{"offerId": "<test-offer-id>", "dryRun": true}'
"@ -ForegroundColor Gray
Write-Host ""

Write-Host "If issues occur, see ROLLBACK.md for rollback instructions" -ForegroundColor Yellow
Write-Host ""
