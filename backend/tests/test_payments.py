from fastapi.testclient import TestClient

def test_payment_lifecycle_and_authorization(client: TestClient, employer_headers, worker_headers, worker2_headers):
    # Setup completed job
    job_resp = client.post("/api/jobs", json={
        "titleHi": "पेंटिंग कार्य",
        "tradeId": "painter",
        "location": "Pachpedi Naka",
        "city": "Raipur",
        "latitude": 21.2100,
        "longitude": 81.6500,
        "wage": 600,
        "date": "2026-10-28"
    }, headers=employer_headers)
    job_id = job_resp.json()["id"]

    apply_resp = client.post(f"/api/jobs/{job_id}/apply", json={}, headers=worker_headers)
    app_id = apply_resp.json()["id"]

    client.patch(f"/api/applications/{app_id}/status", json={"status": "selected"}, headers=employer_headers)
    client.patch(f"/api/applications/{app_id}/status", json={"status": "confirmed"}, headers=worker_headers)
    client.post(f"/api/applications/{app_id}/check-in", json={"latitude": 21.2100, "longitude": 81.6500}, headers=worker_headers)
    client.post(f"/api/applications/{app_id}/check-out", json={"latitude": 21.2100, "longitude": 81.6500}, headers=worker_headers)

    # 1. Worker tries to mark paid -> Forbidden
    worker_pay_resp = client.post(f"/api/payments/{app_id}/mark-paid", json={}, headers=worker_headers)
    assert worker_pay_resp.status_code == 403

    # 2. Employer marks paid -> Success
    emp_pay_resp = client.post(f"/api/payments/{app_id}/mark-paid", json={}, headers=employer_headers)
    assert emp_pay_resp.status_code == 200
    pay_data = emp_pay_resp.json()
    assert pay_data["paymentStatus"] == "paid"

    # 3. Worker views payment record -> Success
    worker_get_pay = client.get(f"/api/payments/{app_id}", headers=worker_headers)
    assert worker_get_pay.status_code == 200

    # 4. Unrelated worker 2 tries to view payment record -> Forbidden
    w2_get_pay = client.get(f"/api/payments/{app_id}", headers=worker2_headers)
    assert w2_get_pay.status_code == 403
