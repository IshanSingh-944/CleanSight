"""Sprint 1 Data Intelligence backend tests.

Covers type inference, column profiling, quality scoring, missing-value
analysis, dataset profiling, and API endpoints.
"""

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.profiling.type_inference import infer_semantic_type, infer_all_columns
from app.services.profiling.column_profiler import profile_all_columns, profile_numeric
from app.services.profiling.quality_scorer import compute_quality_score
from app.services.profiling.missing_value_analyzer import analyze_missing_values
from app.services.profiling.dataset_profiler import profile_dataset_extended

client = TestClient(app)


# ---------- Type inference ----------

def test_type_inference_numeric_column():
    s = pd.Series([1.0, 2.0, 3.0])
    info = infer_semantic_type(s)
    assert info["semantic_type"] == "numeric"
    assert info["confidence"] > 0.9


def test_type_inference_email_column():
    s = pd.Series(["a@b.com", "c@d.com"])
    info = infer_semantic_type(s)
    assert info["semantic_type"] == "email"


def test_type_inference_phone_column():
    s = pd.Series(["9876543210", "9123456789"])
    info = infer_semantic_type(s)
    assert info["semantic_type"] == "phone"


def test_type_inference_postal_code_column():
    s = pd.Series(["400001", "400002"])
    info = infer_semantic_type(s)
    assert info["semantic_type"] == "postal_code"


def test_type_inference_identifier_column():
    s = pd.Series([123456789012, 123456789013, 123456789014])
    info = infer_semantic_type(s)
    assert info["semantic_type"] == "identifier"


def test_type_inference_datetime_strings():
    s = pd.Series(["2025-10-21", "2025-10-22"])
    info = infer_semantic_type(s)
    assert info["semantic_type"] == "datetime"


def test_type_inference_boolean_strings():
    s = pd.Series(["TRUE", "FALSE", "TRUE"])
    info = infer_semantic_type(s)
    assert info["semantic_type"] == "boolean"


def test_type_inference_empty_column():
    s = pd.Series([None, None])
    info = infer_semantic_type(s)
    assert info["semantic_type"] == "empty"
    assert info["confidence"] == 1.0


# ---------- Column profiling ----------

def test_column_profiler_numeric():
    df = pd.DataFrame({"num": [1.0, 2.0, None, 4.0, 100.0]})
    cols = profile_all_columns(df)
    assert cols[0]["semantic_type"] == "numeric"
    stats = cols[0]["statistics"]
    assert stats["outlier_count"] == 1  # 100 is an outlier
    assert stats["min"] == 1.0
    assert stats["max"] == 100.0


def test_column_profiler_categorical():
    df = pd.DataFrame({"cat": ["A", "B", None, "A", "B"]})
    cols = profile_all_columns(df)
    assert cols[0]["semantic_type"] == "categorical"
    assert cols[0]["statistics"]["unique_values"] == 2
    assert cols[0]["null_count"] == 1


def test_column_profiler_datetime():
    df = pd.DataFrame({"date": pd.to_datetime(["2025-01-01", None, "2025-01-03"])})
    cols = profile_all_columns(df)
    assert cols[0]["semantic_type"] == "datetime"
    assert cols[0]["statistics"]["invalid_date_count"] == 0


def test_column_profiler_boolean():
    df = pd.DataFrame({"flag": [True, False, True, None]})
    cols = profile_all_columns(df)
    assert cols[0]["semantic_type"] == "boolean"
    assert cols[0]["statistics"]["true_count"] == 2


def test_column_profiler_all_null_column():
    df = pd.DataFrame({"empty": [None, None, None]})
    cols = profile_all_columns(df)
    assert cols[0]["semantic_type"] == "empty"
    assert cols[0]["null_count"] == 3


# ---------- Quality score ----------

def test_quality_score_complete_dataset():
    df = pd.DataFrame({"a": [1, 2, 3], "b": ["x", "y", "z"]})
    res = compute_quality_score(df)
    assert res["overall_score"] == 100.0


def test_quality_score_with_missing():
    df = pd.DataFrame({"a": [1, None, 3], "b": ["x", "y", None]})
    res = compute_quality_score(df)
    assert res["overall_score"] is not None
    assert 0 <= res["overall_score"] <= 100
    assert res["dimensions"]["completeness"]["score"] < 100


def test_quality_score_empty_dataset():
    res = compute_quality_score(pd.DataFrame())
    assert res["overall_score"] is None


def test_quality_score_duplicate_rows():
    df = pd.DataFrame({"a": [1, 1, 2], "b": ["x", "x", "y"]})
    res = compute_quality_score(df)
    assert res["dimensions"]["uniqueness"]["score"] < 100
    assert res["dimensions"]["uniqueness"]["affected_records"] == 1


# ---------- Missing value analysis ----------

def test_missing_value_analysis_numeric_recommendation():
    df = pd.DataFrame({"num": [1.0, None, 3.0, None]})
    res = analyze_missing_values(df)
    assert res["columns_with_missing"] == 1
    col = res["columns"][0]
    assert col["column"] == "num"
    assert col["missing_count"] == 2


def test_missing_value_analysis_identifier_flagged():
    df = pd.DataFrame({"id": [123456789012, None, 123456789014]})
    res = analyze_missing_values(df)
    # id with long values -> identifier semantic -> flag_for_review
    col = res["columns"][0]
    assert col["recommendation"]["method"] == "flag_for_review"
    assert col["recommendation"]["approval_required"] is True


def test_missing_value_analysis_datetime_preserved():
    df = pd.DataFrame({"date": pd.to_datetime(["2025-01-01", None, "2025-01-03"])})
    res = analyze_missing_values(df)
    col = res["columns"][0]
    assert col["recommendation"]["method"] == "preserve_missing"


# ---------- Dataset profiling (extended) ----------

def test_extended_profile_immutability():
    df = pd.DataFrame({"a": [1, 2, 3], "b": ["x", "y", "z"]})
    original = df.copy(deep=True)
    profile_dataset_extended(df, "ds", "f.csv", 10, "csv")
    pd.testing.assert_frame_equal(df, original)


def test_extended_profile_type_counts():
    df = pd.DataFrame({"num": [1.0, 2.0], "cat": ["a", "b"], "date": pd.to_datetime(["2025-01-01", "2025-01-02"])})
    prof = profile_dataset_extended(df, "ds", "f.csv", 10, "csv")
    assert prof["numeric_column_count"] == 1
    assert prof["categorical_column_count"] == 1
    assert prof["datetime_column_count"] == 1
    assert prof["empty_row_count"] == 0


# ---------- API endpoints ----------

def test_profile_endpoint():
    csv_data = b"id,val\n1,10\n2,20\n3,30\n"
    r = client.post("/api/datasets", files={"file": ("t.csv", csv_data, "text/csv")})
    assert r.status_code == 200
    ds = r.json()["dataset_id"]
    resp = client.get(f"/api/profiling/datasets/{ds}/profile")
    assert resp.status_code == 200
    data = resp.json()
    assert data["dataset_id"] == ds
    assert "type_distribution" in data


def test_quality_score_endpoint():
    csv_data = b"id,val\n1,10\n2,20\n3,30\n"
    r = client.post("/api/datasets", files={"file": ("t.csv", csv_data, "text/csv")})
    ds = r.json()["dataset_id"]
    resp = client.get(f"/api/profiling/datasets/{ds}/quality-score")
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_score" in data
    assert "dimensions" in data


def test_missing_analysis_endpoint():
    csv_data = b"id,val\n1,10\n2,\n3,30\n"
    r = client.post("/api/datasets", files={"file": ("t.csv", csv_data, "text/csv")})
    ds = r.json()["dataset_id"]
    resp = client.get(f"/api/profiling/datasets/{ds}/missing-analysis")
    assert resp.status_code == 200
    data = resp.json()
    assert data["columns_with_missing"] >= 1


def test_columns_endpoint_pagination():
    csv_data = b"a,b,c\n1,2,3\n4,5,6\n"
    r = client.post("/api/datasets", files={"file": ("t.csv", csv_data, "text/csv")})
    ds = r.json()["dataset_id"]
    resp = client.get(f"/api/profiling/datasets/{ds}/columns?page=1&page_size=2")
    assert resp.status_code == 200
    assert resp.headers.get("X-Total-Count") == "3"
    assert len(resp.json()) == 2
