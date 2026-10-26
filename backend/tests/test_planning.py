import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.routes.datasets import DATASET_STORE, RECOMMENDATION_STORE

client = TestClient(app)

def test_planning_endpoint():
    csv_data = b"id,val\n1, 10 \n2,20\n3,None\n3,20\n"
    upload_resp = client.post(
        "/api/datasets",
        files={"file": ("plan_test.csv", csv_data, "text/csv")}
    )
    assert upload_resp.status_code == 200
    dataset_id = upload_resp.json()["dataset_id"]
    
    df_before_shape = DATASET_STORE[dataset_id].shape
    
    plan_resp = client.post(
        f"/api/datasets/{dataset_id}/plan",
        json={"objective": "Prepare dataset for robust regression analysis"}
    )
    assert plan_resp.status_code == 200
    plan_data = plan_resp.json()
    assert plan_data["dataset_id"] == dataset_id
    assert plan_data["recommendations_generated"] > 0
    assert len(plan_data["recommendations"]) > 0
    
    df_after_shape = DATASET_STORE[dataset_id].shape
    assert df_before_shape == df_after_shape
