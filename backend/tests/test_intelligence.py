"""Tests for cross-column intelligence (Sprint P0 Feature 1)."""

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.intelligence.relationship_analyzer import (
    analyze_all_column_pairs,
    analyze_numeric_numeric,
    analyze_categorical_categorical,
    analyze_numeric_categorical,
    analyze_datetime_numeric,
)
from app.services.intelligence.conditional_missingness import (
    analyze_conditional_missingness,
    find_conditional_missingness,
)
from app.services.intelligence.business_rule_detector import BusinessRule, BusinessRuleDetector
from app.services.intelligence.anomaly_detector import detect_anomalies, detect_numeric_anomalies

client = TestClient(app)


# ---------- Relationship analyzer ----------

def test_numeric_numeric_strong_correlation():
    df = pd.DataFrame({"a": [1.0, 2.0, 3.0, 4.0, 5.0], "b": [2.0, 4.0, 6.0, 8.0, 10.0]})
    res = analyze_numeric_numeric("a", df["a"], "b", df["b"])
    assert res is not None
    assert res["issue_type"] == "numeric_correlation"
    assert res["affected_columns"] == ["a", "b"]
    assert res["evidence"]["pearson"] is not None
    assert abs(res["evidence"]["pearson"] - 1.0) < 1e-6
    assert res["evidence"]["redundant"] is True


def test_numeric_numeric_no_correlation():
    df = pd.DataFrame({"a": [1.0, 2.0, 3.0, 4.0, 5.0], "b": [5.0, 1.0, 4.0, 2.0, 3.0]})
    res = analyze_numeric_numeric("a", df["a"], "b", df["b"])
    assert res is not None
    assert res["severity"] == "low"


def test_categorical_categorical_cooccurrence():
    df = pd.DataFrame({"a": ["x", "x", "y", "y"], "b": ["p", "q", "p", "q"]})
    res = analyze_categorical_categorical("a", df["a"], "b", df["b"])
    assert res is not None
    assert res["issue_type"] == "categorical_cooccurrence"
    assert res["evidence"]["unique_combinations"] == 4


def test_numeric_categorical_group_differences():
    df = pd.DataFrame({"num": [1.0, 1.2, 100.0, 101.0], "cat": ["g1", "g1", "g2", "g2"]})
    res = analyze_numeric_categorical("num", df["num"], "cat", df["cat"])
    assert res is not None
    assert res["issue_type"] == "numeric_by_category"
    assert len(res["evidence"]["top_deviations"]) == 2


def test_datetime_numeric_trend():
    df = pd.DataFrame({
        "dt": pd.to_datetime(["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04"]),
        "num": [1.0, 2.0, 10.0, 11.0],
    })
    res = analyze_datetime_numeric("dt", df["dt"], "num", df["num"])
    assert res is not None
    assert res["issue_type"] == "numeric_over_time"
    assert res["evidence"]["outlier_count_3sigma"] >= 0


def test_analyze_all_column_pairs_limits():
    df = pd.DataFrame({f"c{i}": range(10) for i in range(40)})
    results = analyze_all_column_pairs(df)
    # Should cap at 30 columns -> C(30,2)=435 pairs max, but results fewer
    assert isinstance(results, list)


# ---------- Conditional missingness ----------

def test_conditional_missingness_detected():
    df = pd.DataFrame({
        "amount": [100.0, None, 200.0, None, 300.0],
        "method": ["upi", "upi", "card", "card", "upi"],
    })
    res = analyze_conditional_missingness(df, "amount", "method")
    assert res is not None
    assert res["issue_type"] == "conditional_missingness"
    assert res["affected_columns"] == ["amount", "method"]
    assert res["evidence"]["spread_percentage"] >= 10.0


def test_conditional_missingness_none_when_no_missing():
    df = pd.DataFrame({"amount": [1.0, 2.0, 3.0], "method": ["a", "b", "a"]})
    assert analyze_conditional_missingness(df, "amount", "method") is None


def test_find_conditional_missingness_returns_list():
    df = pd.DataFrame({
        "amount": [100.0, None, 200.0, None],
        "method": ["upi", "upi", "card", "card"],
    })
    results = find_conditional_missingness(df)
    assert isinstance(results, list)


# ---------- Business rule detector ----------

def test_business_rule_detector_negative_age():
    df = pd.DataFrame({"age": [25, -5, 30, 40]})
    findings = BusinessRuleDetector().detect(df)
    neg = [f for f in findings if f["rule_id"] == "negative_age"]
    assert len(neg) == 1
    assert neg[0]["violated"] is True
    assert neg[0]["affected_rows"] == 1


def test_business_rule_detector_delivered_no_date():
    df = pd.DataFrame({
        "order_status": ["delivered", "pending", "delivered"],
        "delivery_date": [None, "2025-01-01", None],
    })
    findings = BusinessRuleDetector().detect(df)
    d = [f for f in findings if f["rule_id"] == "delivered_no_delivery_date"]
    assert len(d) == 1
    assert d[0]["violated"] is True
    assert d[0]["affected_rows"] == 2


def test_custom_rule():
    df = pd.DataFrame({"score": [50, 60, 200]})
    detector = BusinessRuleDetector()
    detector.add_rule(
        BusinessRule(
            rule_id="score_cap",
            name="Score cap",
            description="Score should not exceed 100",
            rule_type="deterministic",
            columns=["score"],
            check=lambda d: d["score"] > 100,
            severity="high",
            explanation="Score exceeds 100",
            suggested_action="Review score values",
        )
    )
    findings = detector.detect(df)
    cap = [f for f in findings if f["rule_id"] == "score_cap"]
    assert len(cap) == 1
    assert cap[0]["affected_rows"] == 1


# ---------- Anomaly detector ----------

def test_detect_numeric_anomalies_outlier():
    df = pd.DataFrame({"val": [1.0, 1.1, 1.2, 100.0, 1.05]})
    findings = detect_numeric_anomalies(df, "val")
    assert len(findings) > 0
    assert findings[0]["column"] == "val"
    assert findings[0]["affected_rows"] >= 1


def test_detect_anomalies_limits_columns():
    df = pd.DataFrame({f"c{i}": [1.0, 2.0, 1000.0, 2.0] for i in range(50)})
    findings = detect_anomalies(df)
    # Should be limited to max_columns (15)
    columns_touched = {f["column"] for f in findings}
    assert len(columns_touched) <= 15


# ---------- API endpoint ----------

def test_intelligence_endpoint():
    csv_data = b"id,amount,quantity,status,region,age\n1,100,2,paid,US,25\n2,None,3,paid,US,30\n3,300,None,unpaid,EU,-5\n"
    r = client.post("/api/datasets", files={"file": ("t.csv", csv_data, "text/csv")})
    assert r.status_code == 200
    ds = r.json()["dataset_id"]
    resp = client.get(f"/api/profiling/datasets/{ds}/intelligence")
    assert resp.status_code == 200
    data = resp.json()
    assert data["dataset_id"] == ds
    assert data["row_count"] == 3
    assert "total_findings" in data
    assert isinstance(data["relationships"], list)
    assert isinstance(data["anomalies"], list)


def test_intelligence_rules_endpoint():
    csv_data = b"id,amount\n1,100\n2,200\n"
    r = client.post("/api/datasets", files={"file": ("t.csv", csv_data, "text/csv")})
    ds = r.json()["dataset_id"]
    resp = client.get(f"/api/profiling/datasets/{ds}/intelligence/rules")
    assert resp.status_code == 200
    data = resp.json()
    assert data["rules_evaluated"] > 0
