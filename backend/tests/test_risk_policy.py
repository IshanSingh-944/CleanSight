import pytest
from app.services.risk_policy import RiskPolicy

def test_risk_policy_levels():
    assert RiskPolicy.evaluate_risk("whitespace", 5.0, "name") == "Low"
    assert RiskPolicy.evaluate_risk("constant_column", 100.0, "col") == "Low"
    assert RiskPolicy.evaluate_risk("missing_values", 2.0, "normal_col") == "Medium"
    assert RiskPolicy.evaluate_risk("missing_values", 2.0, "customer_id") == "High"
    assert RiskPolicy.evaluate_risk("duplicate_rows", 25.0, "") == "High"
