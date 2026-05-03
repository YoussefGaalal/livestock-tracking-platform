[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Test-Endpoint {
    param($name, $method, $url, $body, $headers)
    Write-Host "`n=== $name ===" -ForegroundColor Yellow
    try {
        $req = [System.Net.WebRequest]::Create($url)
        $req.Method = $method
        $req.ContentType = "application/json"
        foreach($h in $headers.GetEnumerator()) {
            $req.Headers.Add($h.Key, $h.Value)
        }
        
        if ($body) {
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
            $req.ContentLength = $bytes.Length
            $stream = $req.GetRequestStream()
            $stream.Write($bytes, 0, $bytes.Length)
            $stream.Close()
        }
        
        $resp = $req.GetResponse()
        $status = [int]$resp.StatusCode
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $result = $reader.ReadToEnd()
        Write-Host "Status: $status" -ForegroundColor $(if($status -ge 200 -and $status -lt 300){"Green"}else{"Red"})
        if ($result.Length -gt 600) { $result = $result.Substring(0,600) + "[TRUNCATED]" }
        Write-Host "Body: $result"
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

$baseUrl = "http://localhost:8050/api"
$headers = @{
    "X-User-Id" = "1"
    "X-User-Role" = "Admin"
}

# Test login (no headers needed)
Test-Endpoint -name "POST /auth/login" -method "POST" -url "$baseUrl/auth/login" -body '{"email":"admin@oasis.com","password":"password"}'

# Test logout - should work with auth:sanctum
Test-Endpoint -name "POST /auth/logout" -method "POST" -url "$baseUrl/auth/logout" -body "" -headers $headers

# Test me
Test-Endpoint -name "GET /auth/me" -method "GET" -url "$baseUrl/auth/me" -headers $headers

# Test profile update  
Test-Endpoint -name "PUT /auth/profile" -method "PUT" -url "$baseUrl/auth/profile" -body '{"name":"Updated Admin"}' -headers $headers

# Test users list
Test-Endpoint -name "GET /users" -method "GET" -url "$baseUrl/users" -headers $headers

# Test create user
Test-Endpoint -name "POST /users" -method "POST" -url "$baseUrl/users" -body '{"name":"New User","email":"newapiuser@test.com","password":"password123","role":"Manager"}' -headers $headers

# Test update user
Test-Endpoint -name "PUT /users/2" -method "PUT" -url "$baseUrl/users/2" -body '{"name":"Updated User 2"}' -headers $headers

# Test delete user
Test-Endpoint -name "DELETE /users/5" -method "DELETE" -url "$baseUrl/users/5" -body "" -headers $headers