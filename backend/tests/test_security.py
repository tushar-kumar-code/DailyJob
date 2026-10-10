from fastapi.testclient import TestClient

def test_admin_metrics_access_control(client: TestClient, worker_headers, employer_headers, admin_headers):
    # Worker denied
    resp_worker = client.get("/api/admin/metrics", headers=worker_headers)
    assert resp_worker.status_code == 403

    # Employer denied
    resp_emp = client.get("/api/admin/metrics", headers=employer_headers)
    assert resp_emp.status_code == 403

    # Admin allowed
    resp_admin = client.get("/api/admin/metrics", headers=admin_headers)
    assert resp_admin.status_code == 200
    assert "metrics" in resp_admin.json()

def test_prevent_role_escalation(client: TestClient, worker_headers):
    resp = client.post("/api/users/switch-role", json={"role": "admin"}, headers=worker_headers)
    assert resp.status_code == 400
    assert "Cannot switch to administrative role" in resp.text

def test_bookmarks_isolation(client: TestClient, worker_headers, worker2_headers, employer_headers):
    # Create a job
    job_resp = client.post("/api/jobs", json={
        "titleHi": "सुरक्षा गार्ड",
        "tradeId": "guard",
        "location": "Ring Road",
        "city": "Raipur",
        "wage": 550,
        "date": "2026-11-05"
    }, headers=employer_headers)
    job_id = job_resp.json()["id"]

    # Worker 1 bookmarks
    client.post(f"/api/jobs/{job_id}/bookmark", headers=worker_headers)

    # Worker 1 sees job in saved
    w1_saved = client.get("/api/user/saved-jobs", headers=worker_headers).json()
    assert any(j["id"] == job_id for j in w1_saved["jobs"])

    # Worker 2 does NOT see job in saved
    w2_saved = client.get("/api/user/saved-jobs", headers=worker2_headers).json()
    assert not any(j["id"] == job_id for j in w2_saved["jobs"])
