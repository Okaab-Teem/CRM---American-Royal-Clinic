import os
import requests

TARGET_URL = os.getenv("TESTSPRITE_TARGET_URL", "http://localhost:5000")

def test_api_root():
    res = requests.get(f"{TARGET_URL}/", timeout=30)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data.get("status") == "ok", f"Expected status ok, got {data.get('status')}"
    assert "FlowCRM API" in data.get("name", ""), f"Expected FlowCRM API in name, got {data.get('name')}"

test_api_root()
