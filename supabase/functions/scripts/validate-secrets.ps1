# Validate Supabase Secrets Configuration
# Requirements: 10.2 - Validate that all required secrets are configured

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectRef = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Local = $false
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Supabase Secrets Validation" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Required secrets for Edge Function
# Note: SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL are automatically provided by Supabase
$requiredSecrets = @(
    "FIREBASE_SERVICE_ACCOUNT"
)

$allValid = $true

if ($Local) {
    Write-Host "Validating LOCAL environment..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check .env file for local development
    $envFile = ".env"
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -Raw
        
        foreach ($secret in $requiredSecrets) {
            if ($envContent -match "$secret=") {
                Write-Host "[OK] $secret is configured" -ForegroundColor Green
            } else {
                Write-Host "[MISSING] $secret is NOT configured" -ForegroundColor Red
                $allValid = $false
            }
        }
    } else {
        Write-Host "[ERROR] .env file not found. Create one with required secrets." -ForegroundColor Red
        $allValid = $false
    }
} else {
    Write-Host "Validating REMOTE environment..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrEmpty($ProjectRef)) {
        Write-Host "[ERROR] Project reference is required for remote validation." -ForegroundColor Red
        Write-Host "Usage: .\validate-secrets.ps1 -ProjectRef <your-project-ref>" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Project: $ProjectRef" -ForegroundColor Cyan
    Write-Host ""
    
    # List secrets using Supabase CLI
    Write-Host "Fetching secrets from Supabase..." -ForegroundColor Yellow
    $secretsOutput = supabase secrets list --project-ref $ProjectRef 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to fetch secrets. Make sure you're logged in:" -ForegroundColor Red
        Write-Host "  supabase login" -ForegroundColor Yellow
        exit 1
    }
    
    # Parse secrets output
    $configuredSecrets = @()
    $secretsOutput | ForEach-Object {
        if ($_ -match "^\s*(\w+)\s+") {
            $configuredSecrets += $matches[1]
        }
    }
    
    # Validate each required secret
    foreach ($secret in $requiredSecrets) {
        if ($configuredSecrets -contains $secret) {
            Write-Host "[OK] $secret is configured" -ForegroundColor Green
        } else {
            Write-Host "[MISSING] $secret is NOT configured" -ForegroundColor Red
            $allValid = $false
        }
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan

if ($allValid) {
    Write-Host "All required secrets are configured!" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "Some secrets are missing. Please configure them before deploying." -ForegroundColor Red
    Write-Host ""
    Write-Host "To set secrets, use:" -ForegroundColor Yellow
    Write-Host "  supabase secrets set FIREBASE_SERVICE_ACCOUNT='<json-content>'" -ForegroundColor Gray
    Write-Host "  supabase secrets set SUPABASE_SERVICE_ROLE_KEY='<key>'" -ForegroundColor Gray
    Write-Host "  supabase secrets set SUPABASE_URL='<url>'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "For local development, add them to .env file" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
