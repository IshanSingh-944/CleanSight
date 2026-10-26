import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chat_enquire_endpoint():
    csv_data = b"id,name,val\n1, Alice ,10\n2,Bob,20\n"
    response = client.post(
        "/api/datasets",
        files={"file": ("chat_test.csv", csv_data, "text/csv")}
    )
    assert response.status_code == 200
    dataset_id = response.json()["dataset_id"]

    chat_resp = client.post(
        f"/api/datasets/{dataset_id}/chat",
        json={
            "message": "What are the biggest data-quality issues?",
            "history": []
        }
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    assert "response" in data
    assert data["dataset_id"] == dataset_id
    assert len(data["response"]) > 0
