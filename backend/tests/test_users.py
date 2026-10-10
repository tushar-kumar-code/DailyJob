from fastapi.testclient import TestClient

def test_get_user_profile(client: TestClient, worker_headers):
    response = client.get("/api/users/profile", headers=worker_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "test_worker_1"
    assert data["role"] == "worker"

def test_update_worker_profile(client: TestClient, worker_headers):
    payload = {
        "name": "Ramesh Kumar Sharma",
        "age": 29,
        "phone": "9876543210",
        "city": "Raipur",
        "trade": "plumber",
        "dailyWage": 600
    }
    response = client.put("/api/users/profile/worker", json=payload, headers=worker_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["profile_completed"] is True
    assert data["worker_profile"]["dailyWage"] == 600

def test_switch_role(client: TestClient, worker_headers):
    response = client.post("/api/users/switch-role", json={"role": "employer"}, headers=worker_headers)
    assert response.status_code == 200
    assert response.json()["role"] == "employer"

    # Switch back to worker
    response2 = client.post("/api/users/switch-role", json={"role": "worker"}, headers=worker_headers)
    assert response2.status_code == 200
    assert response2.json()["role"] == "worker"

def test_prevent_escalating_to_admin(client: TestClient, worker_headers):
    response = client.post("/api/users/switch-role", json={"role": "admin"}, headers=worker_headers)
    assert response.status_code == 400
