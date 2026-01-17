# Apply migration 018 to production database
# This adds social notification preference columns to notification_preferences table

Write-Host "🔧 Applying migration 018 to production database..." -ForegroundColor Cyan
Write-Host ""

$sql = @"
-- Add social notification preference columns to notification_preferences table
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS friend_requests BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS venue_shares BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS collection_updates BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activity_likes BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activity_comments BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS group_outing_invites BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS group_outing_reminders BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS friend_checkins_nearby BOOLEAN DEFAULT true;
"@

Write-Host "SQL to execute:" -ForegroundColor Yellow
Write-Host $sql
Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor Green
Write-Host "1. Go to: https://supabase.com/dashboard/project/cznhaaigowjhqdjtfeyz/sql/new"
Write-Host "2. Copy the SQL above"
Write-Host "3. Paste it into the SQL Editor"
Write-Host "4. Click 'Run' button"
Write-Host ""
Write-Host "✅ This will add the missing social notification columns to your database"
Write-Host ""
