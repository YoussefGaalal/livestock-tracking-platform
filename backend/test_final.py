import requests

BASE_URL = "http://localhost:8050/api"

# Login first to get fresh token
resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@oasis.com", "password": "password"})
if resp.status_code == 200:
    token = resp.json().get("token")
    print(f"Login successful, token: {token[:20]}...")
    
    # Test /auth/me with fresh token
    resp_me = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token}"})
    print(f"\nGET /auth/me: {resp_me.status_code}")
    print(f"Body: {resp_me.text[:200]}")
    
    # Test /auth/profile with fresh token  
    resp_profile = requests.put(f"{BASE_URL}/auth/profile", 
                                 headers={"Authorization": f"Bearer {token}"},
                                 json={"name": "Updated Name"})
    print(f"\nPUT /auth/profile: {resp_profile.status_code}")
    print(f"Body: {resp_profile.text[:200]}")
    
    # Test /users with Bearer token
    resp_users = requests.get(f"{BASE_URL}/users", headers={"Authorization": f"Bearer {token}"})
    print(f"\nGET /users: {resp_users.status_code}")
    if resp_users.status_code != 200:
        print(f"Body: {resp_users.text[:300]}")
    else:
        print(f"Body: {resp_users.text[:200]}")
else:
    print(f"Login failed: {resp.status_code} - {resp.text}")