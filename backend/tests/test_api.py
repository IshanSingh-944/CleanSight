import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.routes.datasets import DATASET_STORE, RECOMMENDATION_STORE

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_upload_and_review_flow():
    csv_data = b"id,name,val\n1, Alice ,10\n2,Bob,20\n3,Charlie,30\n3,Charlie,30\n"
    response = client.post(
        "/api/datasets",
        files={"file": ("test.csv", csv_data, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    dataset_id = data["dataset_id"]
    assert data["row_count"] == 4
    
    profile_resp = client.get(f"/api/datasets/{dataset_id}/profile")
    assert profile_resp.status_code == 200
    
    recs_resp = client.get(f"/api/datasets/{dataset_id}/recommendations")
    assert recs_resp.status_code == 200
    recs = recs_resp.json()
    assert len(recs) > 0
    
    action_id = recs[0]["action_id"]
    df_before_shape = DATASET_STORE[dataset_id].shape
    
    patch_resp = client.patch(
        f"/api/datasets/{dataset_id}/recommendations/{action_id}",
        json={"execution_status": "approved"}
    )
    assert patch_resp.status_code == 200
    patch_data = patch_resp.json()
    assert patch_data["success"] is True
    assert patch_data["dataset_integrity_verified"] is True
    
    df_after_shape = DATASET_STORE[dataset_id].shape
    assert df_before_shape == df_after_shape
