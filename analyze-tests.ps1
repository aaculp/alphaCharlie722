# Analyze existing tests and map to tasks

Write-Host "=== Analyzing Existing Tests ===" -ForegroundColor Cyan

$testFiles = Get-ChildItem -Path "supabase\functions\send-flash-offer-push\*.test.ts"

Write-Host "`nTest Files Found:" -ForegroundColor Yellow
$testFiles | ForEach-Object { Write-Host "  - $($_.Name)" }

Write-Host "`n=== Test Coverage by File ===" -ForegroundColor Cyan

foreach ($file in $testFiles) {
    Write-Host "`n$($file.Name):" -ForegroundColor Green
    $content = Get-Content $file.FullName -Raw
    
    # Count Deno.test calls
    $testCount = ([regex]::Matches($content, "Deno\.test\(")).Count
    Write-Host "  Total tests: $testCount"
    
    # Find property references
    $properties = [regex]::Matches($content, "Property \d+:")
    if ($properties.Count -gt 0) {
        Write-Host "  Properties tested:"
        $properties | ForEach-Object { Write-Host "    - $($_.Value)" }
    }
    
    # Find requirement references
    $requirements = [regex]::Matches($content, "Requirements?: [\d\., ]+")
    if ($requirements.Count -gt 0) {
        Write-Host "  Requirements covered:"
        $requirements | Select-Object -First 3 | ForEach-Object { Write-Host "    - $($_.Value)" }
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
$totalTests = 0
$testFiles | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $count = ([regex]::Matches($content, "Deno\.test\(")).Count
    $totalTests += $count
}
Write-Host "Total test cases: $totalTests" -ForegroundColor Green
