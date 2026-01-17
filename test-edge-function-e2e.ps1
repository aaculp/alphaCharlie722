# End-to-End Test Script for Flash Offer Push Notifications
# This script helps automate testing of the Edge Function

param(
    [Parameter(Mandatory=$false)]
    [string]$SupabaseUrl = $env:SUPABASE_URL,
    
    [Parameter(Mandatory=$false)]
    [string]$JwtToken = "",
    
    [Parameter(Mandatory=$false)]
    [string]$OfferId = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("happy-path", "invalid-offer", "no-auth", "dry-run", "all")]
    [string]$TestScenario = "all"
)

Write-Host "=== Flash Offer Push Notification E2E Test ===" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
if (-not $SupabaseUrl) {
    Write-Host "ERROR: SUPABASE_URL not set. Please set environment variable or pass -SupabaseUrl parameter." -ForegroundColor Red
    exit 1
}

$EdgeFunctionUrl = "$SupabaseUrl/functions/v1/send-flash-offer-push"

# Test 1: Happy Path
function Test-HappyPath {
    Write-Host "`n[Test 1] Happy Path - Valid Request" -ForegroundColor Yellow
    
    if (-not $JwtToken) {
        Write-Host "  SKIP: JWT token required. Pass -JwtToken parameter." -ForegroundColor Gray
        return
    }
    
    if (-not $OfferId) {
        Write-Host "  SKIP: Offer ID required. Pass -OfferId parameter." -ForegroundColor Gray
        return
    }
    
    $body = @{
        offerId = $OfferId
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $EdgeFunctionUrl `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $JwtToken"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        Write-Host "  ✓ Request succeeded" -ForegroundColor Green
        Write-Host "  Response:" -ForegroundColor Gray
        Write-Host "    Success: $($response.success)" -ForegroundColor Gray
        Write-Host "    Targeted Users: $($response.targetedUserCount)" -ForegroundColor Gray
        Write-Host "    Sent: $($response.sentCount)" -ForegroundColor Gray
        Write-Host "    Failed: $($response.failedCount)" -ForegroundColor Gray
        
        if ($response.errors -and $response.errors.Count -gt 0) {
            Write-Host "    Errors: $($response.errors.Count)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  ✗ Request failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

# Test 2: Invalid Offer ID
function Test-InvalidOffer {
    Write-Host "`n[Test 2] Invalid Offer ID - Should Return 404" -ForegroundColor Yellow
    
    if (-not $JwtToken) {
        Write-Host "  SKIP: JWT token required. Pass -JwtToken parameter." -ForegroundColor Gray
        return
    }
    
    $invalidOfferId = "00000000-0000-0000-0000-000000000000"
    $body = @{
        offerId = $invalidOfferId
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $EdgeFunctionUrl `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $JwtToken"
                "Content-Type" = "application/json"
            } `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "  ✗ Expected 404 error but got success" -ForegroundColor Red
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Host "  ✓ Correctly returned 404 Not Found" -ForegroundColor Green
            
            if ($_.ErrorDetails) {
                $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "  Error Code: $($errorResponse.code)" -ForegroundColor Gray
                Write-Host "  Error Message: $($errorResponse.error)" -ForegroundColor Gray
            }
        }
        else {
            Write-Host "  ✗ Expected 404 but got $statusCode" -ForegroundColor Red
        }
    }
}

# Test 3: Missing Authentication
function Test-NoAuth {
    Write-Host "`n[Test 3] Missing JWT Token - Should Return 401" -ForegroundColor Yellow
    
    $body = @{
        offerId = "00000000-0000-0000-0000-000000000000"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $EdgeFunctionUrl `
            -Method Post `
            -Headers @{
                "Content-Type" = "application/json"
            } `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "  ✗ Expected 401 error but got success" -ForegroundColor Red
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "  ✓ Correctly returned 401 Unauthorized" -ForegroundColor Green
            
            if ($_.ErrorDetails) {
                $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "  Error Code: $($errorResponse.code)" -ForegroundColor Gray
                Write-Host "  Error Message: $($errorResponse.error)" -ForegroundColor Gray
            }
        }
        else {
            Write-Host "  ✗ Expected 401 but got $statusCode" -ForegroundColor Red
        }
    }
}

# Test 4: Dry Run Mode
function Test-DryRun {
    Write-Host "`n[Test 4] Dry Run Mode - Should Validate Without Sending" -ForegroundColor Yellow
    
    if (-not $JwtToken) {
        Write-Host "  SKIP: JWT token required. Pass -JwtToken parameter." -ForegroundColor Gray
        return
    }
    
    if (-not $OfferId) {
        Write-Host "  SKIP: Offer ID required. Pass -OfferId parameter." -ForegroundColor Gray
        return
    }
    
    $body = @{
        offerId = $OfferId
        dryRun = $true
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $EdgeFunctionUrl `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $JwtToken"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        Write-Host "  ✓ Dry run succeeded" -ForegroundColor Green
        Write-Host "  Response:" -ForegroundColor Gray
        Write-Host "    Success: $($response.success)" -ForegroundColor Gray
        Write-Host "    Targeted Users: $($response.targetedUserCount)" -ForegroundColor Gray
        Write-Host "    Would Send To: $($response.sentCount)" -ForegroundColor Gray
        Write-Host "  Note: No actual notifications sent" -ForegroundColor Cyan
    }
    catch {
        Write-Host "  ✗ Dry run failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

# Run tests based on scenario
switch ($TestScenario) {
    "happy-path" {
        Test-HappyPath
    }
    "invalid-offer" {
        Test-InvalidOffer
    }
    "no-auth" {
        Test-NoAuth
    }
    "dry-run" {
        Test-DryRun
    }
    "all" {
        Test-HappyPath
        Test-InvalidOffer
        Test-NoAuth
        Test-DryRun
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review E2E_TESTING_GUIDE.md for comprehensive testing scenarios" -ForegroundColor Gray
Write-Host "2. Test on physical devices with real notifications" -ForegroundColor Gray
Write-Host "3. Verify analytics in Supabase Dashboard" -ForegroundColor Gray
Write-Host "4. Check Edge Function logs: supabase functions logs send-flash-offer-push" -ForegroundColor Gray
Write-Host ""
