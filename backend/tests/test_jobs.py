from fastapi.testclient import TestClient

def test_worker_cannot_create_job(client: TestClient, worker_headers):
    payload = {
        "titleHi": "प्लंबर चाहिए",
        "titleEn": "Need Plumber",
        "tradeId": "plumber",
        "location": "Pandri",
        "city": "Raipur",
        "wage": 600,
        "date": "2026-10-10"
    }
    response = client.post("/api/jobs", json=payload, headers=worker_headers)
    assert response.status_code == 403
    assert "Only employers" in response.text

def test_employer_can_create_job(client: TestClient, employer_headers):
    payload = {
        "titleHi": "दुकान में इलेक्ट्रीशियन चाहिए",
        "titleEn": "Electrician needed for shop",
        "tradeId": "electrician",
        "location": "Telibandha",
        "city": "Raipur",
        "latitude": 21.2400,
        "longitude": 81.6500,
        "wage": 750,
        "date": "2026-10-12",
        "workersNeeded": 2,
        "urgent": True,
        "description": "Wiring overhaul needed immediately"
    }
    response = client.post("/api/jobs", json=payload, headers=employer_headers)
    assert response.status_code == 201
    job = response.json()
    assert job["employerId"] == "test_employer_1"
    assert job["tradeId"] == "electrician"
    assert job["wage"] == 750

def test_list_and_filter_jobs(client: TestClient):
    response = client.get("/api/jobs")
    assert response.status_code == 200
    jobs = response.json()
    assert isinstance(jobs, list)
    assert len(jobs) > 0

    # Filter by trade
    resp_filtered = client.get("/api/jobs?trade=electrician")
    assert resp_filtered.status_code == 200
    for j in resp_filtered.json():
        assert j["tradeId"] == "electrician"

    # Filter by min wage
    resp_wage = client.get("/api/jobs?min_wage=700")
    assert resp_wage.status_code == 200
    for j in resp_wage.json():
        assert j["wage"] >= 700

def test_employer_modify_own_job(client: TestClient, employer_headers):
    # Create job
    create_resp = client.post("/api/jobs", json={
        "titleHi": "पेंटर काम",
        "tradeId": "painter",
        "location": "Civil Lines",
        "city": "Raipur",
        "wage": 550,
        "date": "2026-10-15"
    }, headers=employer_headers)
    job_id = create_resp.json()["id"]

    # Patch job
    patch_resp = client.patch(f"/api/jobs/{job_id}", json={"wage": 600}, headers=employer_headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["wage"] == 600

def test_prevent_unauthorized_job_modification(client: TestClient, worker_headers, employer_headers):
    # Employer creates job
    create_resp = client.post("/api/jobs", json={
        "titleHi": "कारपेंटर काम",
        "tradeId": "carpenter",
        "location": "Bhilai",
        "city": "Bhilai",
        "wage": 700,
        "date": "2026-10-15"
    }, headers=employer_headers)
    job_id = create_resp.json()["id"]

    # Worker tries to patch
    patch_resp = client.patch(f"/api/jobs/{job_id}", json={"wage": 1200}, headers=worker_headers)
    assert patch_resp.status_code in [403, 404]
