from fastapi.testclient import TestClient

def test_dispute_creation_and_access(client: TestClient, employer_headers, worker_headers, worker2_headers):
    # Employer creates job
    job_resp = client.post("/api/jobs", json={
        "titleHi": "गोदाम अनलोडिंग",
        "tradeId": "helper",
        "location": "Bhanpuri",
        "city": "Raipur",
        "wage": 500,
        "date": "2026-11-01"
    }, headers=employer_headers)
    job_id = job_resp.json()["id"]

    # Worker 1 applies
    client.post(f"/api/jobs/{job_id}/apply", json={}, headers=worker_headers)

    # Worker 1 creates dispute -> Success
    disp_payload = {
        "jobId": job_id,
        "reason": "payment_delay",
        "description": "Payment was promised immediately after work but is still pending.",
        "evidence": []
    }
    disp_resp = client.post("/api/disputes", json=disp_payload, headers=worker_headers)
    assert disp_resp.status_code == 200
    assert disp_resp.json()["reporterId"] == "test_worker_1"

    # Worker 2 tries to file dispute on this job -> Forbidden
    bad_disp = client.post("/api/disputes", json=disp_payload, headers=worker2_headers)
    assert bad_disp.status_code == 403
