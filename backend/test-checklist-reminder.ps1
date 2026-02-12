# Test Checklist Daily Reminder endpoint
# Run from project root or backend folder. Backend must be running on http://127.0.0.1:8000
# Add ?debug=1 to see why sent=0: .\backend\test-checklist-reminder.ps1 -Debug

param([switch]$Debug)
$secret = "mysecret123"  # Must match CHECKLIST_CRON_SECRET in backend/.env
$uri = "http://127.0.0.1:8000/checklist/send-daily-reminders"
if ($Debug) { $uri += "?debug=1" }

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
