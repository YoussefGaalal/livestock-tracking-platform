[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("Content-Type", "application/json")

Write-Host "Testing endpoints with Bearer token and X-User-Id header..." -ForegroundColor Cyan

$baseUrl = "http://localhost:8050/api"

# Test 1: Login first to get token
Write-Host "`n=== 1. POST /auth/login ===" -ForegroundColor Yellow
try {
    $result = $wc.UploadString("$baseUrl/auth/login", "POST", '{"email":"admin@oasis.com","password":"password"}')
    Write-Host "Response: $result"
    $json = $result | ConvertFrom-Json
    $token = $json.token
    Write-Host "Token obtained: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    $token = $null
}

# Test 2: Logout with token
if ($token) {
    Write-Host "`n=== 2. POST /auth/logout (Bearer) ===" -ForegroundColor Yellow
    $wc.Headers.Add("Authorization", "Bearer $token")
    try {
        $result = $wc.UploadString("$baseUrl/auth/logout", "POST", "")
        Write-Host "Response: $result" -ForegroundColor Green
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

# Test 3: Get current user with token
Write-Host "`n=== 3. GET /auth/me (Bearer) ===" -ForegroundColor Yellow
try {
    $result = $wc.DownloadString("$baseUrl/auth/me")
    Write-Host "Response: $result" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 4: Update profile with token
Write-Host "`n=== 4. PUT /auth/profile (Bearer) ===" -ForegroundColor Yellow
try {
    $result = $wc.UploadString("$baseUrl/auth/profile", "PUT", '{"name":"Updated Admin"}')
    Write-Host "Response: $result" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 5: List users
Write-Host "`n=== 5. GET /users (Bearer) ===" -ForegroundColor Yellow
try {
    $result = $wc.DownloadString("$baseUrl/users")
    Write-Host "Response: $result" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 6: Create user
Write-Host "`n=== 6. POST /users (Bearer) ===" -ForegroundColor Yellow
try {
    $result = $wc.UploadString("$baseUrl/users", "POST", '{"name":"Test User","email":"testapi'+(Get-Random)+'@test.com","password":"password123","role":"Manager"}')
    Write-Host "Response: $result" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 7: Update user
Write-Host "`n=== 7. PUT /users/2 (Bearer) ===" -ForegroundColor Yellow
try {
    $result = $wc.UploadString("$baseUrl/users/2", "PUT", '{"name":"Updated User"}')
    Write-Host "Response: $result" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 8: Delete user
Write-Host "`n=== 8. DELETE /users/10 (Bearer) ===" -ForegroundColor Yellow
try {
    $result = $wc.UploadString("$baseUrl/users/10", "DELETE", "")
    Write-Host "Response: $result" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}