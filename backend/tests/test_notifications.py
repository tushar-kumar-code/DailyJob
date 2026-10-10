from fastapi.testclient import TestClient

def test_user_notifications(client: TestClient, worker_headers):
    # Fetch notifications
    resp = client.get("/api/notifications", headers=worker_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "notifications" in data
    assert "unreadCount" in data

    # Mark all read
    mark_resp = client.patch("/api/notifications/read-all", headers=worker_headers)
    assert mark_resp.status_code == 200
