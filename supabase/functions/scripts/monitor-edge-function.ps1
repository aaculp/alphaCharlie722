# Monitor Edge Function Metrics and Alerts
# 
# This script monitors the send-flash-offer-push Edge Function and checks for:
# - Error rate > 5%
# - Execution time > 25s
# - FCM failure rate > 10%
# - Rate limit violations > 100/hour
#
# Requirements: 6.5, 9.6

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectRef,
    
    [Parameter(Mandatory=$false)]
    [int]$LogLimit = 500,
    
    [Parameter(Mandatory=$false)]
    [switch]$Continuous,
    
    [Parameter(Mandatory=$false)]
    [int]$IntervalSeconds = 60
)

# Color codes for output
$ErrorColor = "Red"
$WarningColor = "Yellow"
$InfoColor = "Cyan"
$SuccessColor = "Green"

# Alert thresholds
$ERROR_RATE_THRESHOLD = 0.05  # 5%
$EXECUTION_TIME_THRESHOLD = 25000  # 25 seconds
$FCM_FAILURE_RATE_THRESHOLD = 0.10  # 10%
$RATE_LIMIT_VIOLATIONS_THRESHOLD = 100  # per hour

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Get-EdgeFunctionLogs {
    param(
        [string]$ProjectRef,
        [int]$Limit
    )
    
    try {
        $logs = supabase functions logs send-flash-offer-push --project-ref $ProjectRef --limit $Limit 2>&1
        return $logs
    } catch {
        Write-ColorOutput "Error fetching logs: $_" $ErrorColor
        return $null
    }
}

function Analyze-Logs {
    param(
        [string[]]$Logs
    )
    
    if (-not $Logs -or $Logs.Count -eq 0) {
        Write-ColorOutput "No logs to analyze" $WarningColor
        return $null
    }
    
    # Initialize counters
    $totalRequests = 0
    $errorCount = 0
    $executionTimes = @()
    $fcmSuccessCount = 0
    $fcmFailureCount = 0
    $rateLimitViolations = 0
    $alerts = @()
    
    # Parse logs
    foreach ($log in $Logs) {
        # Count total requests (look for "Request completed" messages)
        if ($log -match "Request completed in (\d+)ms") {
            $totalRequests++
            $executionTime = [int]$matches[1]
            $executionTimes += $executionTime
            
            # Check execution time threshold
            if ($executionTime -gt $EXECUTION_TIME_THRESHOLD) {
                $alerts += @{
                    Type = "execution_time"
                    Severity = "WARNING"
                    Message = "Execution time exceeded 25 seconds: ${executionTime}ms"
                    Value = $executionTime
                }
            }
        }
        
        # Count errors
        if ($log -match "\[ERROR\]") {
            $errorCount++
        }
        
        # Count FCM results
        if ($log -match "FCM send complete: (\d+) succeeded, (\d+) failed") {
            $fcmSuccessCount += [int]$matches[1]
            $fcmFailureCount += [int]$matches[2]
        }
        
        # Count rate limit violations
        if ($log -match "rate limit exceeded" -or $log -match "RATE_LIMIT_EXCEEDED") {
            $rateLimitViolations++
        }
        
        # Capture existing alerts from logs
        if ($log -match "\[ALERT\]\[(WARNING|CRITICAL)\]") {
            $alerts += @{
                Type = "logged_alert"
                Severity = $matches[1]
                Message = $log
                Value = 0
            }
        }
    }
    
    # Calculate metrics
    $errorRate = if ($totalRequests -gt 0) { $errorCount / $totalRequests } else { 0 }
    $avgExecutionTime = if ($executionTimes.Count -gt 0) { 
        ($executionTimes | Measure-Object -Average).Average 
    } else { 0 }
    $fcmFailureRate = if (($fcmSuccessCount + $fcmFailureCount) -gt 0) {
        $fcmFailureCount / ($fcmSuccessCount + $fcmFailureCount)
    } else { 0 }
    
    # Check error rate threshold
    if ($errorRate -gt $ERROR_RATE_THRESHOLD) {
        $alerts += @{
            Type = "error_rate"
            Severity = "WARNING"
            Message = "Error rate exceeded 5%: $([math]::Round($errorRate * 100, 2))%"
            Value = $errorRate
        }
    }
    
    # Check FCM failure rate threshold
    if ($fcmFailureRate -gt $FCM_FAILURE_RATE_THRESHOLD) {
        $alerts += @{
            Type = "fcm_failure_rate"
            Severity = "WARNING"
            Message = "FCM failure rate exceeded 10%: $([math]::Round($fcmFailureRate * 100, 2))%"
            Value = $fcmFailureRate
        }
    }
    
    # Check rate limit violations threshold
    if ($rateLimitViolations -gt $RATE_LIMIT_VIOLATIONS_THRESHOLD) {
        $alerts += @{
            Type = "rate_limit_violations"
            Severity = "WARNING"
            Message = "Rate limit violations exceeded 100/hour: $rateLimitViolations"
            Value = $rateLimitViolations
        }
    }
    
    return @{
        TotalRequests = $totalRequests
        ErrorCount = $errorCount
        ErrorRate = $errorRate
        AvgExecutionTime = $avgExecutionTime
        FcmSuccessCount = $fcmSuccessCount
        FcmFailureCount = $fcmFailureCount
        FcmFailureRate = $fcmFailureRate
        RateLimitViolations = $rateLimitViolations
        Alerts = $alerts
    }
}

function Display-Metrics {
    param(
        [hashtable]$Metrics
    )
    
    Write-ColorOutput "`n=== Edge Function Metrics ===" $InfoColor
    Write-ColorOutput "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" $InfoColor
    Write-ColorOutput ""
    
    # Display metrics
    Write-ColorOutput "Total Requests: $($Metrics.TotalRequests)" "White"
    
    # Error rate with color coding
    $errorRatePercent = [math]::Round($Metrics.ErrorRate * 100, 2)
    $errorRateColor = if ($Metrics.ErrorRate -gt $ERROR_RATE_THRESHOLD) { $ErrorColor } else { $SuccessColor }
    Write-ColorOutput "Error Rate: $errorRatePercent% (Threshold: 5%)" $errorRateColor
    
    # Execution time with color coding
    $avgExecTime = [math]::Round($Metrics.AvgExecutionTime, 0)
    $execTimeColor = if ($avgExecTime -gt $EXECUTION_TIME_THRESHOLD) { $ErrorColor } else { $SuccessColor }
    Write-ColorOutput "Avg Execution Time: ${avgExecTime}ms (Threshold: 25000ms)" $execTimeColor
    
    # FCM metrics with color coding
    $fcmFailurePercent = [math]::Round($Metrics.FcmFailureRate * 100, 2)
    $fcmColor = if ($Metrics.FcmFailureRate -gt $FCM_FAILURE_RATE_THRESHOLD) { $ErrorColor } else { $SuccessColor }
    Write-ColorOutput "FCM Success: $($Metrics.FcmSuccessCount)" "White"
    Write-ColorOutput "FCM Failures: $($Metrics.FcmFailureCount)" "White"
    Write-ColorOutput "FCM Failure Rate: $fcmFailurePercent% (Threshold: 10%)" $fcmColor
    
    # Rate limit violations with color coding
    $rateLimitColor = if ($Metrics.RateLimitViolations -gt $RATE_LIMIT_VIOLATIONS_THRESHOLD) { $ErrorColor } else { $SuccessColor }
    Write-ColorOutput "Rate Limit Violations: $($Metrics.RateLimitViolations) (Threshold: 100/hour)" $rateLimitColor
    
    # Display alerts
    if ($Metrics.Alerts.Count -gt 0) {
        Write-ColorOutput "`n=== ALERTS ===" $ErrorColor
        foreach ($alert in $Metrics.Alerts) {
            $alertColor = if ($alert.Severity -eq "CRITICAL") { $ErrorColor } else { $WarningColor }
            Write-ColorOutput "[$($alert.Severity)] $($alert.Type): $($alert.Message)" $alertColor
        }
    } else {
        Write-ColorOutput "`nNo alerts triggered" $SuccessColor
    }
    
    Write-ColorOutput "`n================================`n" $InfoColor
}

function Monitor-EdgeFunction {
    param(
        [string]$ProjectRef,
        [int]$LogLimit,
        [bool]$IsContinuous,
        [int]$IntervalSeconds
    )
    
    do {
        Write-ColorOutput "Fetching logs from Edge Function..." $InfoColor
        
        # Get logs
        $logs = Get-EdgeFunctionLogs -ProjectRef $ProjectRef -Limit $LogLimit
        
        if ($logs) {
            # Analyze logs
            $metrics = Analyze-Logs -Logs $logs
            
            if ($metrics) {
                # Display metrics
                Display-Metrics -Metrics $metrics
                
                # If there are critical alerts, exit with error code
                $criticalAlerts = $metrics.Alerts | Where-Object { $_.Severity -eq "CRITICAL" }
                if ($criticalAlerts.Count -gt 0) {
                    Write-ColorOutput "CRITICAL ALERTS DETECTED!" $ErrorColor
                    if (-not $IsContinuous) {
                        exit 1
                    }
                }
            }
        }
        
        if ($IsContinuous) {
            Write-ColorOutput "Waiting $IntervalSeconds seconds before next check..." $InfoColor
            Start-Sleep -Seconds $IntervalSeconds
        }
        
    } while ($IsContinuous)
}

# Main execution
Write-ColorOutput "Starting Edge Function Monitoring" $InfoColor
Write-ColorOutput "Project: $ProjectRef" $InfoColor
Write-ColorOutput "Log Limit: $LogLimit" $InfoColor

if ($Continuous) {
    Write-ColorOutput "Mode: Continuous (every $IntervalSeconds seconds)" $InfoColor
    Write-ColorOutput "Press Ctrl+C to stop`n" $WarningColor
} else {
    Write-ColorOutput "Mode: Single check`n" $InfoColor
}

Monitor-EdgeFunction -ProjectRef $ProjectRef -LogLimit $LogLimit -IsContinuous $Continuous -IntervalSeconds $IntervalSeconds

Write-ColorOutput "Monitoring complete" $SuccessColor
