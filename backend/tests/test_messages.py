from fastapi.testclient import TestClient

def test_messages_thread_and_authorization(client: TestClient, employer_headers, worker_headers, worker2_headers):
    # Create job
    job_resp = client.post("/api/jobs", json={
        "titleHi": "दुकान सहायक",
        "tradeId": "helper",
        "location": "Sadar Bazar",
        "city": "Raipur",
        "wage": 500,
        "date": "2026-10-31"
    }, headers=employer_headers)
    job_id = job_resp.json()["id"]

    # Worker 1 applies
    client.post(f"/api/jobs/{job_id}/apply", json={}, headers=worker_headers)

    # Worker 1 sends message
    send_resp = client.post(f"/api/messages/{job_id}", json={"text": "Sir, kal kitne baje aana hai?"}, headers=worker_headers)
    assert send_resp.status_code == 200

    # Employer reads thread
    emp_read = client.get(f"/api/messages/{job_id}", headers=employer_headers)
    assert emp_read.status_code == 200
    msgs = emp_read.json()["conversation"]
    assert len(msgs) >= 1
    assert msgs[-1]["text"] == "Sir, kal kitne baje aana hai?"

    # Unrelated Worker 2 tries to read -> Forbidden
    w2_read = client.get(f"/api/messages/{job_id}", headers=worker2_headers)
    assert w2_read.status_code == 403
