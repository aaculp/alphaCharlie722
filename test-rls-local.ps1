# PowerShell script to run RLS tests against local Supabase
$env:SUPABASE_URL = "http://127.0.0.1:54321"
$env:SUPABASE_ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz"

Write-Host "Running RLS tests against local Supabase..." -ForegroundColor Green
Write-Host "URL: $env:SUPABASE_URL" -ForegroundColor Cyan
Write-Host ""

npm test -- deviceTokens.rls.simple.test.ts
