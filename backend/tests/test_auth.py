from fastapi.testclient import TestClient

def test_missing_auth_token(client: TestClient):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert any(term in response.text for term in ["Not authenticated", "Missing", "Authentication required"])

def test_invalid_auth_token(client: TestClient):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer bad"})
    assert response.status_code == 401

def test_valid_auth_token(client: TestClient, worker_headers):
    response = client.get("/api/auth/me", headers=worker_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "test_worker_1"
    assert data["role"] == "worker"

def test_verify_token_endpoint(client: TestClient):
    response = client.post("/api/auth/verify-token", json={"idToken": "mock_token_test_worker_1"})
    assert response.status_code == 200
    data = response.json()
    uid = data.get("uid") or data.get("user", {}).get("uid")
    assert uid == "test_worker_1"
