# Test FCM Push Notification
# This script sends a test push notification to verify FCM is working

$PROJECT_REF = "cznhaaigowjhqdjtfeyz"
$OFFER_ID = "02c5b66e-6124-4e6d-b584-03ef9369c42b"

Write-Host "🧪 Testing FCM Push Notification..." -ForegroundColor Cyan
Write-Host ""

# Get the JWT token
Write-Host "1. Getting JWT token..." -ForegroundColor Yellow
$token = npx supabase functions serve --env-file supabase/.env.local 2>&1 | Select-String "JWT" | ForEach-Object { $_.ToString().Split(":")[1].Trim() }

if (-not $token) {
    Write-Host "❌ Failed to get JWT token" -ForegroundColor Red
    Write-Host "Run: npx supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Got JWT token" -ForegroundColor Green
Write-Host ""

# Call the edge function
Write-Host "2. Calling send-flash-offer-push function..." -ForegroundColor Yellow
$url = "https://$PROJECT_REF.supabase.co/functions/v1/send-flash-offer-push"

$body = @{
    offerId = $OFFER_ID
    dryRun = $false
} | ConvertTo-Json

Write-Host "URL: $url" -ForegroundColor Gray
Write-Host "Offer ID: $OFFER_ID" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $body

    Write-Host "✅ Response received:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "❌ Error calling function:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
