import os
import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL") or "https://c099f57ec10a2e.lhr.life"

def test_leads_endpoint():
    login_payload = {
        "email": "admin@flowcrm.local",
        "password": "FlowAdmin123!"
    }
    auth_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=30)
    assert auth_res.status_code == 200, f"Login failed with {auth_res.status_code}"
    token = auth_res.json()["token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    leads_res = requests.get(f"{BASE_URL}/api/leads", headers=headers, timeout=30)
    assert leads_res.status_code == 200, f"Expected 200, got {leads_res.status_code}"
    leads_data = leads_res.json()
    assert "items" in leads_data or isinstance(leads_data, list), "Unexpected leads response structure"

test_leads_endpoint()
