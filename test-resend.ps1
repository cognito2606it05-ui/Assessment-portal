# ==============================================================================
# Quantex Assessment Portal - Resend API Diagnostic & Test Script
# ==============================================================================

param(
    [string]$Recipient = "cognito.2603it01@gmail.com",
    [string]$ApiKey = $(if ($env:RESEND_API_KEY) { $env:RESEND_API_KEY } else { "" }),
    [string]$Sender = "Quantex Assessment Portal <onboarding@resend.dev>"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Testing Resend API Email Delivery" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Recipient: $Recipient"
Write-Host "Sender   : $Sender"
Write-Host "API Key  : $($ApiKey.Substring(0, [Math]::Min(12, $ApiKey.Length)))***"

$testOtp = [string](Get-Random -Minimum 100000 -Maximum 999999)
Write-Host "Generated Test OTP: $testOtp" -ForegroundColor Magenta

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

$body = @{
    from = $Sender
    to = @($Recipient)
    subject = "Quantex Exam Portal - Live Verification OTP: $testOtp"
    html = @"
<div style='font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;'>
    <h2 style='color: #1e3a8a; margin: 0 0 10px 0;'>QUANTEX RECRUITMENT ASSESSMENT 2026</h2>
    <p style='color: #475569; font-size: 14px;'>Hello Candidate,</p>
    <p style='color: #475569; font-size: 14px;'>Your live verification OTP code is:</p>
    <div style='background: #eff6ff; border: 2px dashed #2563eb; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;'>
        <span style='font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e40af;'>$testOtp</span>
    </div>
    <p style='color: #64748b; font-size: 12px;'>Valid for 10 minutes. Real-time test via Resend API.</p>
</div>
"@
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers $headers -Body $body
    Write-Host "`n[SUCCESS] Resend API Call Succeeded!" -ForegroundColor Green
    Write-Host "Delivery Message ID: $($response.id)" -ForegroundColor Green
    Write-Host "Email has been dispatched to $Recipient. Check your inbox/spam." -ForegroundColor Cyan
} catch {
    Write-Host "`n[FAILED] Resend API Call Failed!" -ForegroundColor Red
    $errText = $_.ErrorDetails.Message
    if (-not $errText -and $_.Exception.Response) {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errText = $sr.ReadToEnd()
    }
    Write-Host "Details: $errText" -ForegroundColor Yellow
    Write-Host "Exception: $($_.Exception.Message)" -ForegroundColor Red
}

