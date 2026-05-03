import requests
import json

BASE_URL = "http://localhost:8050/api"
HEADERS = {"Content-Type": "application/json"}

def test_endpoint(name, method, path, data=None, extra_headers=None):
    url = f"{BASE_URL}{path}"
    headers = {**HEADERS}
    if extra_headers:
        headers.update(extra_headers)
    
    print(f"\n=== {method} {path} ===")
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers)
        elif method == "POST":
            resp = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            resp = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers)
        
        print(f"Status: {resp.status_code}")
        body = resp.text
        if len(body) > 500:
            body = body[:500] + "...[TRUNCATED]"
        print(f"Body: {body}")
        return resp
    except Exception as e:
        print(f"Error: {e}")
        return None

# Test 1: Login
print("Testing Login...")
r = test_endpoint("Login", "POST", "/auth/login", {"email": "admin@oasis.com", "password": "password"})
token = None
if r and r.status_code == 200:
    try:
        token = r.json().get("token")
        print(f"Token: {token[:30]}..." if token else "No token")
    except:
        pass

# Test 2: Logout with Bearer token
if token:
    test_endpoint("Logout", "POST", "/auth/logout", extra_headers={"Authorization": f"Bearer {token}"})

# Test 3: Get current user with Bearer token  
if token:
    test_endpoint("GET /auth/me", "GET", "/auth/me", extra_headers={"Authorization": f"Bearer {token}"})

# Test 4: Update profile
if token:
    test_endpoint("PUT /auth/profile", "PUT", "/auth/profile", {"name": "Updated Admin"}, {"Authorization": f"Bearer {token}"})

# Test 5: List users (no auth, public)
test_endpoint("GET /users", "GET", "/users")

# Test 6: List users with X-User-Id header (not working since routes require sanctum)
test_endpoint("GET /users (X-User)", "GET", "/users", extra_headers={"X-User-Id": "1", "X-User-Role": "Admin"})

# Test 7: Create user with X-User-Id header
test_endpoint("POST /users", "POST", "/users", {"name": "Test User", "email": "test123@test.com", "password": "password123", "role": "Manager"}, {"X-User-Id": "1", "X-User-Role": "Admin"})

# Test 8: Update user with X-User-Id header
test_endpoint("PUT /users/2", "PUT", "/users/2", {"name": "Updated User"}, {"X-User-Id": "1", "X-User-Role": "Admin"})

# Test 9: Delete user with X-User-Id header
test_endpoint("DELETE /users/6", "DELETE", "/users/6", extra_headers={"X-User-Id": "1", "X-User-Role": "Admin"})