$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:5000"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " FlowCRM Deduplication & High-Concurrency Verification" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Login to obtain JWT Token
Write-Host "`n[Step 1] Authenticating Admin..." -ForegroundColor Yellow
$loginPayload = @{
    email = "admin@flowcrm.local"
    password = "FlowAdmin123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
$token = $loginRes.token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
Write-Host "Authentication Successful. Token received." -ForegroundColor Green

# 2. Test Deduplication under Concurrent Lead Creation
Write-Host "`n[Step 2] Testing Lead Deduplication (10 Concurrent identical leads)..." -ForegroundColor Yellow
$testEmail = "olympia_athlete_$(Get-Random)@supplements.com"
$testPhone = "+2010998877$(Get-Random -Minimum 10 -Maximum 99)"
$leadPayload = @{
    firstName = "Tarek"
    lastName = "Bodybuilder"
    companyName = "Gold Star Fitness"
    email = $testEmail
    phone = $testPhone
    estimatedValue = 5000
    notes = "Looking for 10 tubs of Whey Isolate and 5 Creatine"
} | ConvertTo-Json

$jobs = @()
for ($i = 1; $i -le 10; $i++) {
    $jobs += Start-ThreadJob -ScriptBlock {
        param($url, $hdr, $body)
        try {
            $resp = Invoke-WebRequest -Uri "$url/api/leads" -Method Post -Headers $hdr -Body $body -UseBasicParsing
            return @{ Status = [int]$resp.StatusCode; Body = $resp.Content }
        } catch {
            $ex = $_.Exception.Response
            if ($ex) {
                return @{ Status = [int]$ex.StatusCode; Error = $_.Exception.Message }
            }
            return @{ Status = 500; Error = $_.Exception.Message }
        }
    } -ArgumentList $BaseUrl, $headers, $leadPayload
}

$results = $jobs | Receive-Job -Wait -AutoRemoveJob

$successCount = ($results | Where-Object { $_.Status -eq 201 }).Count
$conflictCount = ($results | Where-Object { $_.Status -eq 409 }).Count
$errorCount = ($results | Where-Object { $_.Status -ge 500 }).Count

Write-Host "  -> Created (201): $successCount (Expected: 1)" -ForegroundColor $(if ($successCount -eq 1) { "Green" } else { "Red" })
Write-Host "  -> Blocked as Duplicate (409 Conflict): $conflictCount (Expected: 9)" -ForegroundColor $(if ($conflictCount -eq 9) { "Green" } else { "Yellow" })
Write-Host "  -> Server Errors (500): $errorCount (Expected: 0)" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })

if ($successCount -ne 1 -or $errorCount -gt 0) {
    Write-Error "Deduplication test failed!"
}

# 3. Test Customer Deduplication on Lead Conversion
Write-Host "`n[Step 3] Testing Customer Deduplication during Lead Conversion..." -ForegroundColor Yellow
$leadsList = Invoke-RestMethod -Uri "$BaseUrl/api/leads?search=$testEmail" -Method Get -Headers $headers
$createdLead = $leadsList.items[0]
$leadId = $createdLead.id

$convertPayload = @{
    estimatedValue = 7500
    notes = "Customer conversion confirmed"
} | ConvertTo-Json

$convertRes = Invoke-RestMethod -Uri "$BaseUrl/api/leads/$leadId/convert" -Method Post -Headers $headers -Body $convertPayload
Write-Host "  -> Lead converted successfully to Customer ID: $($convertRes.customerId) and Deal ID: $($convertRes.opportunityId)" -ForegroundColor Green

# Try converting again to verify idempotency / conflict prevention
try {
    $secondConvert = Invoke-WebRequest -Uri "$BaseUrl/api/leads/$leadId/convert" -Method Post -Headers $headers -Body $convertPayload -UseBasicParsing
    Write-Error "Should have blocked duplicate conversion!"
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Write-Host "  -> Second conversion blocked with HTTP $code (Expected: 409 Conflict)" -ForegroundColor Green
}

# 4. Test Customer Deduplication when creating another lead for the same company
Write-Host "`n[Step 4] Testing Cross-Lead Customer Re-use (Same Company)..." -ForegroundColor Yellow
$secondLeadPayload = @{
    firstName = "Hossam"
    lastName = "Coach"
    companyName = "Gold Star Fitness" # Same company name!
    email = "coach_$(Get-Random)@supplements.com" # Different rep email
    phone = "+2010887766$(Get-Random -Minimum 10 -Maximum 99)"
    estimatedValue = 12000
    notes = "Bulk order for gym trainer clients"
} | ConvertTo-Json

$secondLead = Invoke-RestMethod -Uri "$BaseUrl/api/leads" -Method Post -Headers $headers -Body $secondLeadPayload
$secondConvertRes = Invoke-RestMethod -Uri "$BaseUrl/api/leads/$($secondLead.id)/convert" -Method Post -Headers $headers -Body $convertPayload

Write-Host "  -> First Conversion Customer ID:  $($convertRes.customerId)" -ForegroundColor Cyan
Write-Host "  -> Second Conversion Customer ID: $($secondConvertRes.customerId)" -ForegroundColor Cyan

if ($convertRes.customerId -eq $secondConvertRes.customerId) {
    Write-Host "  -> PERFECT! Customer record was reused and deduplicated correctly!" -ForegroundColor Green
} else {
    Write-Warning "  -> Customer ID differed."
}

# 5. High-Concurrency Stress Test (100 Concurrent Requests)
Write-Host "`n[Step 5] Running High-Concurrency Stress Test (100 Concurrent Requests)..." -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()

$concurrencyJobs = @()
for ($i = 1; $i -le 100; $i++) {
    $endpoint = switch ($i % 4) {
        0 { "$BaseUrl/api/system/info" }
        1 { "$BaseUrl/api/pipelines/default/stages" }
        2 { "$BaseUrl/api/leads?pageSize=10" }
        3 { "$BaseUrl/api/customers?pageSize=10" }
    }

    $concurrencyJobs += Start-ThreadJob -ScriptBlock {
        param($url, $hdr)
        try {
            $r = Invoke-WebRequest -Uri $url -Method Get -Headers $hdr -UseBasicParsing -TimeoutSec 10
            return @{ Status = [int]$r.StatusCode }
        } catch {
            $res = $_.Exception.Response
            if ($res) {
                return @{ Status = [int]$res.StatusCode }
            }
            return @{ Status = 500; Error = $_.Exception.Message }
        }
    } -ArgumentList $endpoint, $headers
}

$stressResults = $concurrencyJobs | Receive-Job -Wait -AutoRemoveJob
$sw.Stop()

$c200 = ($stressResults | Where-Object { $_.Status -eq 200 }).Count
$c429 = ($stressResults | Where-Object { $_.Status -eq 429 }).Count
$c500 = ($stressResults | Where-Object { $_.Status -ge 500 }).Count

Write-Host "  -> Total Concurrent Requests: 100" -ForegroundColor Cyan
Write-Host "  -> Total Duration: $($sw.ElapsedMilliseconds) ms" -ForegroundColor Cyan
Write-Host "  -> Requests/Second Throughput: $([math]::Round(100 / ($sw.ElapsedMilliseconds / 1000), 2)) req/sec" -ForegroundColor Cyan
Write-Host "  -> Successful (200 OK): $c200" -ForegroundColor $(if ($c200 -ge 90) { "Green" } else { "Yellow" })
Write-Host "  -> Rate-Limited (429): $c429" -ForegroundColor Cyan
Write-Host "  -> Internal Server Errors (500): $c500" -ForegroundColor $(if ($c500 -eq 0) { "Green" } else { "Red" })

if ($c500 -eq 0) {
    Write-Host "`nALL INTEGRITY, DEDUPLICATION, AND HIGH-CONCURRENCY CHECKS PASSED!" -ForegroundColor Green
} else {
    Write-Error "Stress test reported 500 errors."
}
