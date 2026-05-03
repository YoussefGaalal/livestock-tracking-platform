[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$wc = New-Object System.Net.WebClient

function Test-Api {
    param($Name, $Method, $Url, $Body, $Headers)
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    try {
        if ($Headers) {
            foreach($h in $Headers.GetEnumerator()) {
                $wc.Headers.Add($h.Key, $h.Value)
            }
        }
        if ($Method -eq "POST") {
            $result = $wc.UploadString($Url, "POST", $Body)
        } elseif ($Method -eq "PUT") {
            $result = $wc.UploadString($Url, "PUT", $Body)
        } elseif ($Method -eq "DELETE") {
            $result = $wc.UploadString($Url, "DELETE", $Body)
        } else {
            $result = $wc.DownloadString($Url)
        }
        Write-Host "Success" -ForegroundColor Green
        if ($result.Length -gt 600) { $result = $result.Substring(0,600) + "..." }
        Write-Host "Body: $result"
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    } finally {
        $wc.Headers.Clear()
    }
}

$baseUrl = "http://localhost:8050/api"
$headers = @{ "Content-Type" = "application/json"; "X-User-Id" = "1"; "X-User-Role" = "Admin" }

# Test 1: Login
Test-Api -Name "POST /auth/login" -Method POST -Url "$baseUrl/auth/login" -Body '{"email":"admin@oasis.com","password":"password"}'

# Test 2: Logout
Test-Api -Name "POST /auth/logout" -Method POST -Url "$baseUrl/auth/logout" -Headers $headers

# Test 3: Get me
Test-Api -Name "GET /auth/me" -Method GET -Url "$baseUrl/auth/me" -Headers $headers

# Test 4: Update profile
Test-Api -Name "PUT /auth/profile" -Method PUT -Url "$baseUrl/auth/profile" -Headers $headers -Body '{"name":"Admin Updated"}'

# Test 5: List users
Test-Api -Name "GET /users" -Method GET -Url "$baseUrl/users" -Headers $headers

# Test 6: Create user
Test-Api -Name "POST /users" -Method POST -Url "$baseUrl/users" -Headers $headers -Body '{"name":"New User","email":"newuser@test.com","password":"password123","role":"User"}'

# Test 7: Update user
Test-Api -Name "PUT /users/2" -Method PUT -Url "$baseUrl/users/2" -Headers $headers -Body '{"name":"Updated User"}'

# Test 8: Delete user
Test-Api -Name "DELETE /users/5" -Method DELETE -Url "$baseUrl/users/5" -Headers $headers