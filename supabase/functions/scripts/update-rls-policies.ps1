# Update RLS Policies for Device Tokens
# Requirements: 10.5 - Update RLS policies to secure device_tokens table

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectRef = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Local = $false
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "RLS Policy Update" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script updates RLS policies for the device_tokens table." -ForegroundColor Yellow
Write-Host "It removes permissive testing policies and applies secure policies." -ForegroundColor Yellow
Write-Host ""

# Create temporary SQL file with RLS policy updates
$rlsSql = @"
-- Update RLS Policies for device_tokens table
-- This removes testing policies and applies secure production policies

-- Enable RLS on device_tokens if not already enabled
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Remove permissive testing policy
DROP POLICY IF EXISTS "Allow reading device tokens for push notifications (TESTING)" ON device_tokens;

-- Remove any old restrictive policies
DROP POLICY IF EXISTS "Users can only view own tokens" ON device_tokens;
DROP POLICY IF EXISTS "Users can view own device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Users can manage own device tokens" ON device_tokens;

-- Create secure policy: Users can only manage their own device tokens
CREATE POLICY "Users can manage own device tokens"
ON device_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'device_tokens';
"@

$tempSqlFile = "temp_rls_update.sql"
$rlsSql | Out-File -FilePath $tempSqlFile -Encoding UTF8

try {
    if ($Local) {
        Write-Host "Updating RLS policies on LOCAL database..." -ForegroundColor Yellow
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
        
        # Run SQL using psql
        Write-Host "Executing RLS policy updates..." -ForegroundColor Yellow
        
        $dbUrl = "postgresql://postgres:postgres@localhost:54322/postgres"
        Get-Content $tempSqlFile | psql $dbUrl
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[ERROR] RLS policy update failed!" -ForegroundColor Red
            exit 1
        }
        
    } else {
        Write-Host "Updating RLS policies on REMOTE database..." -ForegroundColor Yellow
        
        if ([string]::IsNullOrEmpty($ProjectRef)) {
            Write-Host "[ERROR] Project reference is required for remote update." -ForegroundColor Red
            Write-Host "Usage: .\update-rls-policies.ps1 -ProjectRef <your-project-ref>" -ForegroundColor Yellow
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
        
        # Execute SQL using Supabase CLI
        Write-Host "Executing RLS policy updates..." -ForegroundColor Yellow
        
        supabase db execute -f $tempSqlFile --project-ref $ProjectRef
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[ERROR] RLS policy update failed!" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "RLS policies updated successfully!" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Changes applied:" -ForegroundColor Yellow
    Write-Host "  - Removed testing policy: 'Allow reading device tokens for push notifications (TESTING)'" -ForegroundColor Gray
    Write-Host "  - Created secure policy: 'Users can manage own device tokens'" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Security notes:" -ForegroundColor Yellow
    Write-Host "  - Users can only access their own device tokens" -ForegroundColor Gray
    Write-Host "  - Edge Function uses service role key to bypass RLS" -ForegroundColor Gray
    Write-Host "  - No client can read other users' tokens" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test with a client to ensure users can manage their tokens" -ForegroundColor Gray
    Write-Host "  2. Test Edge Function to ensure it can read all tokens" -ForegroundColor Gray
    Write-Host "  3. Monitor for any RLS policy violations in logs" -ForegroundColor Gray
    Write-Host ""
    
} finally {
    # Clean up temporary file
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile -Force
    }
}
