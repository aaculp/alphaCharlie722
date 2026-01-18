# Send Test Push Notification via Firebase
# This sends a direct test notification to a specific FCM token

param(
    [string]$Token = "cl5G33W2SRODwX2rAFfAhF:APA91bHXEg1XpIbg5aPbWXDBohQ5jIwlPn5pfyn1zE8jj3Kv4rwtXMpSFOmRMQcCynsfBd3pJQHcTWgZmQNP04dvZ2KcPq-BQXGPcmZiATIXbikaa4d1q4k"
)

Write-Host "🔔 Sending test push notification..." -ForegroundColor Cyan
Write-Host "Token: $($Token.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

# You can test this in Firebase Console:
# 1. Go to https://console.firebase.google.com/
# 2. Select your project
# 3. Go to Cloud Messaging
# 4. Click "Send test message"
# 5. Paste the token above
# 6. Add title and body
# 7. Click "Test"

Write-Host "📋 To test via Firebase Console:" -ForegroundColor Yellow
Write-Host "1. Go to: https://console.firebase.google.com/" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Navigate to: Engage → Cloud Messaging" -ForegroundColor White
Write-Host "4. Click 'Send test message'" -ForegroundColor White
Write-Host "5. Paste this token:" -ForegroundColor White
Write-Host "   $Token" -ForegroundColor Cyan
Write-Host "6. Add notification details:" -ForegroundColor White
Write-Host "   Title: Test Flash Offer" -ForegroundColor White
Write-Host "   Body: This is a test notification from Firebase" -ForegroundColor White
Write-Host "7. Click 'Test'" -ForegroundColor White
Write-Host ""
Write-Host "✅ If the notification appears on the device, Firebase is working!" -ForegroundColor Green
Write-Host "❌ If not, check:" -ForegroundColor Red
Write-Host "   - Device has internet connection" -ForegroundColor White
Write-Host "   - App has notification permissions" -ForegroundColor White
Write-Host "   - Token matches the Firebase project" -ForegroundColor White
Write-Host "   - google-services.json is correct" -ForegroundColor White
