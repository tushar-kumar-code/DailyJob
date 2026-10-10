from fastapi.testclient import TestClient

def test_checkin_and_checkout_flow(client: TestClient, employer_headers, worker_headers):
    # Setup confirmed job & application
    job_resp = client.post("/api/jobs", json={
        "titleHi": "साइट सुपरविजन",
        "tradeId": "mason",
        "location": "Jaistambh Chowk",
        "city": "Raipur",
        "latitude": 21.2400,
        "longitude": 81.6300,
        "wage": 650,
        "date": "2026-10-30"
    }, headers=employer_headers)
    job_id = job_resp.json()["id"]

    apply_resp = client.post(f"/api/jobs/{job_id}/apply", json={}, headers=worker_headers)
    app_id = apply_resp.json()["id"]

    # Employer selects & worker confirms
    client.patch(f"/api/applications/{app_id}/status", json={"status": "selected"}, headers=employer_headers)
    client.patch(f"/api/applications/{app_id}/status", json={"status": "confirmed"}, headers=worker_headers)

    # 1. Invalid Check-in: Too far (e.g. 100km away)
    far_resp = client.post(f"/api/applications/{app_id}/check-in", json={
        "latitude": 22.5000,
        "longitude": 82.5000
    }, headers=worker_headers)
    assert far_resp.status_code == 400
    assert "Too far" in far_resp.text

    # 2. Valid Check-in: Near worksite (e.g. within 50 meters)
    near_resp = client.post(f"/api/applications/{app_id}/check-in", json={
        "latitude": 21.2401,
        "longitude": 81.6301
    }, headers=worker_headers)
    assert near_resp.status_code == 200
    data = near_resp.json()
    assert data["status"] == "started"
    assert data["checkInTime"] is not None

    # 3. Valid Check-out: Worker completes work
    checkout_resp = client.post(f"/api/applications/{app_id}/check-out", json={
        "latitude": 21.2402,
        "longitude": 81.6302,
        "notes": "Work completed successfully"
    }, headers=worker_headers)
    assert checkout_resp.status_code == 200
    checkout_data = checkout_resp.json()
    assert checkout_data["status"] == "completed"
    assert checkout_data["checkOutTime"] is not None
