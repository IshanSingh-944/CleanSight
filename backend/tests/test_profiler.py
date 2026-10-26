import pandas as pd
import pytest
from app.services.profiler import Profiler
from app.services.issue_detector import IssueDetector
from app.services.recommendation_engine import RecommendationEngine

def test_profiler_basic():
    df = pd.DataFrame({
        "col_num": [1, 2, 3, None, 5],
        "col_str": [" a ", "b", "c", "d", "e"],
        "col_const": [10, 10, 10, 10, 10]
    })
    profile = Profiler.profile_dataframe(df, "ds_test", "test.csv", 100, "csv")
    assert profile["row_count"] == 5
    assert profile["column_count"] == 3
    assert profile["total_missing_cells"] == 1
    assert "col_const" in profile["constant_columns"]

def test_issue_detector_and_engine():
    df = pd.DataFrame({
        "id": [1, 2, 3, 3, 4],
        "score": [10, 20, 1000, None, 50],
        "category": ["A", "B", None, "A", "C"]
    })
    issues = IssueDetector.detect_issues(df)
    recs = RecommendationEngine.generate_recommendations(issues)
    assert len(recs) > 0
    assert any(r["issue_type"] == "duplicate_rows" for r in recs) or any(r["issue_type"] == "missing_values" for r in recs)
