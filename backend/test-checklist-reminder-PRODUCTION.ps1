# Test Checklist Daily Reminder - PRODUCTION (Render)
# Uses: https://ip-internal-manage-software.onrender.com
# IMPORTANT: The browser uses GET - this endpoint needs POST. Run this script instead of opening URL in browser.

param([switch]$Debug)
$secret = "mysecret123"  # Must match CHECKLIST_CRON_SECRET in Render Environment
$baseUrl = "https://ip-internal-manage-software.onrender.com"
$uri = "$baseUrl/checklist/send-daily-reminders"
if ($Debug) { $uri += "?debug=1" }

Write-Host "Calling POST $uri"
try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Headers @{
        "X-Cron-Secret" = $secret
    } -UseBasicParsing
    Write-Host "Success:" $response.Content
} catch {
    Write-Host "Error:" $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host $reader.ReadToEnd()
    }
}
