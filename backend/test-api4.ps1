[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$token = $null

function Get-WithAuth {
    param($url, $tok)
    $req = [System.Net.WebRequest]::Create($url)
    $req.Method = "GET"
    $req.ContentType = "application/json"
    $req.Headers.Add("Authorization", "Bearer $tok")
    $resp = $req.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $reader.ReadToEnd()
}

function Post-WithAuth {
    param($url, $body, $tok)
    $req = [System.Net.WebRequest]::Create($url)
    $req.Method = "POST"
    $req.ContentType = "application/json"
    $req.Headers.Add("Authorization", "Bearer $tok")
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $resp = $req.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $reader.ReadToEnd()
}

Write-Host "=== Testing /auth/me with Bearer token ===" -ForegroundColor Cyan
try {
    $token = "28|yH0VbH0SHcBFndY3pjXofDT6jUuYNELHVm6fU33vb48c76a8"
    $result = Get-WithAuth -url "http://localhost:8050/api/auth/me" -tok $token
    Write-Host "Response: $result"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host "`n=== Testing /users with Bearer token ===" -ForegroundColor Cyan
try {
    $result = Get-WithAuth -url "http://localhost:8050/api/users" -tok $token
    Write-Host "Response: $result"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}