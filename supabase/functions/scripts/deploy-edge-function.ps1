# Deploy Edge Function to Supabase
# Requirements: 10.1, 10.5 - Deploy Edge Function to named endpoint

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectRef = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Local = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoVerifyJWT = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation = $false
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Edge Function Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Validate secrets first (unless skipped)
if (-not $SkipValidation) {
    Write-Host "Step 1: Validating secrets configuration..." -ForegroundColor Yellow
    Write-Host ""
    
    if ($Local) {
        & "$PSScriptRoot\validate-secrets.ps1" -Local
    } else {
        if ([string]::IsNullOrEmpty($ProjectRef)) {
            Write-Host "[ERROR] Project reference is required for remote deployment." -ForegroundColor Red
            Write-Host "Usage: .\deploy-edge-function.ps1 -ProjectRef <your-project-ref>" -ForegroundColor Yellow
            exit 1
        }
        & "$PSScriptRoot\validate-secrets.ps1" -ProjectRef $ProjectRef
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Secret validation failed. Fix the issues above before deploying." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
} else {
    Write-Host "[WARNING] Skipping secret validation" -ForegroundColor Yellow
    Write-Host ""
}

# Deploy Edge Function
Write-Host "Step 2: Deploying Edge Function..." -ForegroundColor Yellow
Write-Host ""

$functionName = "send-flash-offer-push"
$functionPath = "supabase/functions/$functionName"

# Check if function directory exists
if (-not (Test-Path $functionPath)) {
    Write-Host "[ERROR] Function directory not found: $functionPath" -ForegroundColor Red
    exit 1
}

Write-Host "Function: $functionName" -ForegroundColor Cyan
Write-Host "Path: $functionPath" -ForegroundColor Cyan
Write-Host ""

# Build deployment command
$deployCmd = "supabase functions deploy $functionName"

if ($Local) {
    Write-Host "Deploying to LOCAL Supabase..." -ForegroundColor Yellow
    # For local, we don't need project ref
} else {
    Write-Host "Deploying to REMOTE Supabase..." -ForegroundColor Yellow
    Write-Host "Project: $ProjectRef" -ForegroundColor Cyan
    $deployCmd += " --project-ref $ProjectRef"
}

if ($NoVerifyJWT) {
    Write-Host "[WARNING] JWT verification disabled (for testing only)" -ForegroundColor Yellow
    $deployCmd += " --no-verify-jwt"
}

Write-Host ""
Write-Host "Executing: $deployCmd" -ForegroundColor Gray
Write-Host ""

# Execute deployment
Invoke-Expression $deployCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Not logged in: Run 'supabase login'" -ForegroundColor Gray
    Write-Host "  2. Invalid project ref: Check your project settings" -ForegroundColor Gray
    Write-Host "  3. Syntax errors in function code: Check the logs above" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deployment successful!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

if ($Local) {
    Write-Host "Function URL: http://localhost:54321/functions/v1/$functionName" -ForegroundColor Cyan
} else {
    Write-Host "Function URL: https://<your-project>.supabase.co/functions/v1/$functionName" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the function with a dry-run request" -ForegroundColor Gray
Write-Host "  2. Monitor logs: supabase functions logs $functionName" -ForegroundColor Gray
Write-Host "  3. Deploy database migrations if not already done" -ForegroundColor Gray
Write-Host ""
