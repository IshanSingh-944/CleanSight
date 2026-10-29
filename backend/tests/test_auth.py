import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_and_dual_mode():
    # Register user
    reg_resp = client.post(
        "/api/auth/register",
        json={"email": "testuser@cleansight.ai", "password": "password123", "full_name": "Test Analyst"}
    )
    assert reg_resp.status_code == 200
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testuser@cleansight.ai"
    token = data["access_token"]

    # Login user
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "testuser@cleansight.ai", "password": "password123"}
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # Upload dataset as authenticated user
    csv_data = b"id,val\n1,10\n2,20\n"
    upload_resp = client.post(
        "/api/datasets",
        files={"file": ("user_dataset.csv", csv_data, "text/csv")},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert upload_resp.status_code == 200
    dataset_id = upload_resp.json()["dataset_id"]

    # Check history endpoint
    history_resp = client.get(
        "/api/datasets/my-history",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert history_resp.status_code == 200
    history_data = history_resp.json()
    assert len(history_data["datasets"]) >= 1
    assert history_data["datasets"][0]["dataset_id"] == dataset_id

    # Check guest upload still works without token
    guest_resp = client.post(
        "/api/datasets",
        files={"file": ("guest_dataset.csv", csv_data, "text/csv")}
    )
    assert guest_resp.status_code == 200
    assert "dataset_id" in guest_resp.json()
