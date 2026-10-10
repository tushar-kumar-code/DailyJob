from fastapi.testclient import TestClient

def test_trade_catalog(client: TestClient):
    resp = client.get("/api/skills/catalog")
    assert resp.status_code == 200
    trades = resp.json()["trades"]
    assert len(trades) > 0

def test_worker_skill_verification(client: TestClient, worker_headers):
    # Verify a skill
    payload = {
        "tradeId": "plumber",
        "experienceYears": 4,
        "answers": [{"q": 1, "a": "PVC Pipe"}]
    }
    resp = client.post("/api/skills/verify", json=payload, headers=worker_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["skill"]["status"] == "verified"
    assert data["skill"]["score"] >= 90

    # Get worker skills
    get_resp = client.get("/api/skills", headers=worker_headers)
    assert get_resp.status_code == 200
    skills = get_resp.json()["skills"]
    assert len(skills) >= 1
