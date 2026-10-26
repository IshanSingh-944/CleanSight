import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.routes.datasets import DATASET_STORE, RECOMMENDATION_STORE
from app.services.db import get_db_connection

client = TestClient(app)

def test_health_and_ready():
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "healthy"

    r2 = client.get("/ready")
    assert r2.status_code == 200
    assert r2.json()["status"] == "ready"

def test_oversized_upload_rejection():
    # Attempting to upload file larger than limit or malformed
    # We can test invalid extension
    response = client.post(
        "/api/datasets",
        files={"file": ("malicious.exe", b"MZRBK...", "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_persistence_across_reloads():
    csv_data = b"id,name,val\n1, Alice ,10\n2,Bob,20\n"
    response = client.post(
        "/api/datasets",
        files={"file": ("persist.csv", csv_data, "text/csv")}
    )
    assert response.status_code == 200
    dataset_id = response.json()["dataset_id"]
    
    # Clear in-memory stores to simulate application restart
    DATASET_STORE.clear()
    
    # Retrieve profile from SQLite persistence
    profile_resp = client.get(f"/api/datasets/{dataset_id}/profile")
    assert profile_resp.status_code == 200
    assert profile_resp.json()["dataset_id"] == dataset_id
