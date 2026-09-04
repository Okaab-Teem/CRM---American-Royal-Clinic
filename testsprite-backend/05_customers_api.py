import os
import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL") or "https://c099f57ec10a2e.lhr.life"

def test_customers_list():
    login_payload = {
        "email": "admin@flowcrm.local",
        "password": "FlowAdmin123!"
    }
    auth_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=30)
    assert auth_res.status_code == 200, f"Login failed with {auth_res.status_code}"
    token = auth_res.json()["token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/api/customers", headers=headers, timeout=30)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "items" in data or isinstance(data, list), "Expected items in customers response"

test_customers_list()
