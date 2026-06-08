# Run this in PowerShell to manually trigger all scrapers NOW
# Replace YOUR_CRON_SECRET with the value from your Vercel env vars

$secret = $env:CRON_SECRET  # or paste directly

$routes = @(
    "https://www.creditiq.app/api/cron/ig-start-runs",
    "https://www.creditiq.app/api/cron/ig-fetch-results",
    "https://www.creditiq.app/api/cron/ig-intelligence",
    "https://www.creditiq.app/api/cron/reddit-scrape",
    "https://www.creditiq.app/api/cron/youtube-scrape"
)

foreach ($route in $routes) {
    Write-Host "Triggering: $route"
    $response = Invoke-WebRequest -Uri $route -Method GET -Headers @{"x-cron-secret" = $secret} -UseBasicParsing
    Write-Host "Status: $($response.StatusCode) | Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))"
    Write-Host "---"
    Start-Sleep -Seconds 2
}
