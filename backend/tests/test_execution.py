import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.routes.datasets import DATASET_STORE, RECOMMENDATION_STORE

client = TestClient(app)

def test_execution_workflow_and_export():
    csv_data = b"id,name,val\n1, Alice ,10\n2,Bob,20\n3,Charlie,30\n3,Charlie,30\n"
    response = client.post(
        "/api/datasets",
        files={"file": ("test_exec.csv", csv_data, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    dataset_id = data["dataset_id"]
    
    recs_resp = client.get(f"/api/datasets/{dataset_id}/recommendations")
    recs = recs_resp.json()
    assert len(recs) > 0
    
    # Collect all recommendation action IDs (regardless of initial risk classification)
    approved_ids = [r["action_id"] for r in recs]
    assert len(approved_ids) > 0
    
    # Execute cleaning
    exec_resp = client.post(
        f"/api/datasets/{dataset_id}/execute",
        json={"approved_action_ids": approved_ids}
    )
    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()
    assert exec_data["status"] in ["success", "partial"]
    assert exec_data["original_row_count"] == 4
    assert len(exec_data["audit_log"]) > 0
    
    # Verify cleaning results endpoint
    results_resp = client.get(f"/api/datasets/{dataset_id}/cleaning-results")
    assert results_resp.status_code == 200
    assert results_resp.json()["execution_id"] == exec_data["execution_id"]
    
    # Verify export endpoint (CSV)
    export_csv = client.get(f"/api/datasets/{dataset_id}/export?format=csv")
    assert export_csv.status_code == 200
    assert "id,name,val" in export_csv.text

    # Verify export endpoint (Excel)
    export_xlsx = client.get(f"/api/datasets/{dataset_id}/export?format=xlsx")
    assert export_xlsx.status_code == 200
    assert export_xlsx.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

def test_original_dataset_immutability():
    csv_data = b"col1,col2\n  a  ,10\n  b  ,20\n"
    response = client.post(
        "/api/datasets",
        files={"file": ("immutable.csv", csv_data, "text/csv")}
    )
    dataset_id = response.json()["dataset_id"]
    original_df_shape = DATASET_STORE[dataset_id].shape
    
    recs = client.get(f"/api/datasets/{dataset_id}/recommendations").json()
    approved_ids = [r["action_id"] for r in recs]
    
    client.post(
        f"/api/datasets/{dataset_id}/execute",
        json={"approved_action_ids": approved_ids}
    )
    
    # Original dataset store must remain unchanged
    assert DATASET_STORE[dataset_id].shape == original_df_shape

def test_high_risk_blocking():
    csv_data = b"id,revenue,val\n1,100,10\n2,,20\n"
    response = client.post(
        "/api/datasets",
        files={"file": ("highrisk.csv", csv_data, "text/csv")}
    )
    dataset_id = response.json()["dataset_id"]
    recs = client.get(f"/api/datasets/{dataset_id}/recommendations").json()
    
    high_risk_ids = [r["action_id"] for r in recs if r["risk_level"] == "High"]
    if high_risk_ids:
        exec_resp = client.post(
            f"/api/datasets/{dataset_id}/execute",
            json={"approved_action_ids": high_risk_ids}
        )
        audit_log = exec_resp.json()["audit_log"]
        for item in audit_log:
            if item["action_id"] in high_risk_ids:
                assert item["status"] == "blocked"
