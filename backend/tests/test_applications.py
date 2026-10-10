from fastapi.testclient import TestClient

def test_apply_and_duplicate_prevention(client: TestClient, employer_headers, worker_headers):
    # Employer creates a job
    job_resp = client.post("/api/jobs", json={
        "titleHi": "मेसन राजमिस्त्री",
        "tradeId": "mason",
        "location": "Tatibandh",
        "city": "Raipur",
        "wage": 800,
        "date": "2026-10-20"
    }, headers=employer_headers)
    job_id = job_resp.json()["id"]

    # Worker applies
    apply_resp = client.post(f"/api/jobs/{job_id}/apply", json={"note": "Experienced mason ready"}, headers=worker_headers)
    assert apply_resp.status_code == 201
    app_data = apply_resp.json()
    assert app_data["workerId"] == "test_worker_1"
    assert app_data["status"] == "applied"

    # Duplicate apply attempt
    dup_resp = client.post(f"/api/jobs/{job_id}/apply", json={"note": "Applying again"}, headers=worker_headers)
    assert dup_resp.status_code == 400
    assert "already applied" in dup_resp.text

def test_employer_cannot_apply_to_own_job(client: TestClient, employer_headers):
    job_resp = client.post("/api/jobs", json={
        "titleHi": "हेल्पर चाहिए",
        "tradeId": "helper",
        "location": "Mowa",
        "city": "Raipur",
        "wage": 450,
        "date": "2026-10-20"
    }, headers=employer_headers)
    job_id = job_resp.json()["id"]

    resp = client.post(f"/api/jobs/{job_id}/apply", json={}, headers=employer_headers)
    assert resp.status_code == 403

def test_application_lifecycle_transitions(client: TestClient, employer_headers, worker_headers):
    # Create job
    job_resp = client.post("/api/jobs", json={
        "titleHi": "वायरिंग का काम",
        "tradeId": "electrician",
        "location": "Devendra Nagar",
        "city": "Raipur",
        "wage": 700,
        "date": "2026-10-25"
    }, headers=employer_headers)
    job_id = job_resp.json()["id"]

    # Worker applies
    apply_resp = client.post(f"/api/jobs/{job_id}/apply", json={}, headers=worker_headers)
    app_id = apply_resp.json()["id"]

    # Invalid: Worker tries to mark directly as selected
    bad_resp = client.patch(f"/api/applications/{app_id}/status", json={"status": "selected"}, headers=worker_headers)
    assert bad_resp.status_code == 403

    # Valid: Employer selects worker
    sel_resp = client.patch(f"/api/applications/{app_id}/status", json={"status": "selected"}, headers=employer_headers)
    assert sel_resp.status_code == 200
    assert sel_resp.json()["status"] == "selected"

    # Valid: Worker confirms selected application
    conf_resp = client.patch(f"/api/applications/{app_id}/status", json={"status": "confirmed"}, headers=worker_headers)
    assert conf_resp.status_code == 200
    assert conf_resp.json()["status"] == "confirmed"
