function Test-Endpoint {
    param($Name, $Method, $Uri, $Body, $Headers)
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        if ($Body) { $params.Body = $Body }
        if ($Headers) { $params.Headers = $Headers }
        $r = Invoke-WebRequest @params
        Write-Host "Status: $($r.StatusCode)" -ForegroundColor Green
        $content = $r.Content
        if ($content.Length -gt 500) { $content = $content.Substring(0,500) + "..." }
        Write-Host "Body: $content"
    } catch {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)"
    }
}

$baseUrl = "http://localhost:8050/api"
$headerNoAuth = @{ "X-User-Id" = "1"; "X-User-Role" = "Admin" }

# Test 1: Login
Test-Endpoint -Name "POST /auth/login" -Method POST -Uri "$baseUrl/auth/login" -Body '{"email":"admin@oasis.com","password":"password"}'

# Test 2: Logout (no auth required or with headers)
Test-Endpoint -Name "POST /auth/logout (no auth)" -Method POST -Uri "$baseUrl/auth/logout"

# Test 3: Logout with headers
Test-Endpoint -Name "POST /auth/logout (with headers)" -Method POST -Uri "$baseUrl/auth/logout" -Headers $headerNoAuth

# Test 4: Get current user (no auth)
Test-Endpoint -Name "GET /auth/me (no auth)" -Method GET -Uri "$baseUrl/auth/me"

# Test 5: Get current user with headers
Test-Endpoint -Name "GET /auth/me (with headers)" -Method GET -Uri "$baseUrl/auth/me" -Headers $headerNoAuth

# Test 6: Update profile (no auth)
Test-Endpoint -Name "PUT /auth/profile (no auth)" -Method PUT -Uri "$baseUrl/auth/profile" -Body '{"name":"Updated Name"}'

# Test 7: Update profile with headers
Test-Endpoint -Name "PUT /auth/profile (with headers)" -Method PUT -Uri "$baseUrl/auth/profile" -Headers $headerNoAuth -Body '{"name":"Updated Name"}'

# Test 8: List users (no auth)
Test-Endpoint -Name "GET /users (no auth)" -Method GET -Uri "$baseUrl/users"

# Test 9: List users with headers
Test-Endpoint -Name "GET /users (with headers)" -Method GET -Uri "$baseUrl/users" -Headers $headerNoAuth

# Test 10: Create user
Test-Endpoint -Name "POST /users (with headers)" -Method POST -Uri "$baseUrl/users" -Headers $headerNoAuth -Body '{"name":"Test User","email":"test@example.com","password":"password123","role":"User"}'

# Test 11: Update user
Test-Endpoint -Name "PUT /users/2 (with headers)" -Method PUT -Uri "$baseUrl/users/2" -Headers $headerNoAuth -Body '{"name":"Updated User"}'

# Test 12: Delete user
Test-Endpoint -Name "DELETE /users/5 (with headers)" -Method DELETE -Uri "$baseUrl/users/5" -Headers $headerNoAuth