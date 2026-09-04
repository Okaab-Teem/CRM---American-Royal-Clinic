import os
import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL") or "https://c099f57ec10a2e.lhr.life"

def test_admin_authentication():
    payload = {
        "email": "admin@flowcrm.local",
        "password": "FlowAdmin123!"
    }
    res = requests.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=30)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "token" in data, "Token missing in response"
    assert data["user"]["email"] == "admin@flowcrm.local"
    assert data["user"]["role"] == "Admin"

test_admin_authentication()
