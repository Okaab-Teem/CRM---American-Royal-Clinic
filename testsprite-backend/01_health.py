import os
import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL") or "https://c099f57ec10a2e.lhr.life"

def test_api_health():
    res = requests.get(f"{BASE_URL}/", timeout=30)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data.get("status") == "ok", f"Expected ok, got {data.get('status')}"
    assert "FlowCRM API" in data.get("name", "")

test_api_health()
