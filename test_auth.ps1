$headers = @{ "Content-Type" = "application/json" }
$body = '{"email":"admin@cognitoinsights.tech","password":"Satya@9890"}'
$res = Invoke-RestMethod -Uri "https://contest.cognitoinsights.tech/auth.php" -Method Post -Headers $headers -Body $body
$res | ConvertTo-Json -Depth 5