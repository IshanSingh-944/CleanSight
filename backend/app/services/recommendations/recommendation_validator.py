"""Recommendation validator.

Validates cleaning recommendations against the active dataset schema and
evidence. Rejects unknown columns, unsupported operations, invalid
parameters, and unsubstantiated claims. Never executes raw LLM-generated code.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd

SUPPORTED_OPERATIONS = {
    "impute_missing_values",
    "trim_whitespace",
    "drop_duplicates",
    "drop_constant_column",
    "winsorize_outliers",
    "flag_for_review",
    "preserve_missing",
    "mode_imputation",
    "mean_imputation",
    "median_imputation",
}

SUPPORTED_RISK_LEVELS = {"low", "medium", "high"}


class ValidationError(Exception):
    """Raised when a recommendation fails validation."""


def validate_recommendation(
    recommendation: Dict[str, Any],
    df: pd.DataFrame,
    profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Validate a single recommendation.

    Returns the (possibly normalized) recommendation dict.
    Raises ValidationError if the recommendation is invalid.
    """
    # Required fields
    for field in ("action_id", "issue_type", "proposed_action"):
        if not recommendation.get(field):
            raise ValidationError(f"Missing required field: {field}")

    action_id = str(recommendation["action_id"])
    issue_type = str(recommendation["issue_type"]).lower()
    column = recommendation.get("column")

    # Validate column exists (when referenced)
    if column is not None and column not in df.columns:
        raise ValidationError(f"Unknown column: {column}")

    # Validate operation is supported. Allow free-text proposed_action as long
    # as it references a supported operation concept (substring match), or the
    # issue_type itself maps to a supported concept.
    proposed = str(recommendation.get("proposed_action", "")).lower()
    issue_type_l = str(recommendation.get("issue_type", "")).lower()
    operation_supported = any(op in proposed for op in SUPPORTED_OPERATIONS)
    issue_maps_to_op = any(
        (op in issue_type_l)
        for op in ("impute", "duplicate", "outlier", "whitespace", "constant", "review", "preserve")
    )
    if not operation_supported and not issue_maps_to_op:
        raise ValidationError(f"Unsupported operation: {proposed}")

    # Validate risk level
    risk = str(recommendation.get("risk_level", "medium")).lower()
    if risk not in SUPPORTED_RISK_LEVELS:
        raise ValidationError(f"Invalid risk level: {risk}")

    # Validate affected_rows is consistent with column data when checkable
    affected_rows = int(recommendation.get("affected_rows", 0))
    if column is not None and issue_type == "missing_values":
        actual_missing = int(df[column].isnull().sum())
        if affected_rows > actual_missing:
            raise ValidationError(
                f"affected_rows ({affected_rows}) exceeds missing values in "
                f"'{column}' ({actual_missing})"
            )

    # Normalize
    normalized = dict(recommendation)
    normalized["issue_type"] = issue_type
    normalized["risk_level"] = risk
    normalized["execution_status"] = "pending"
    normalized["requires_approval"] = bool(
        recommendation.get("requires_approval", risk in ("medium", "high"))
    )
    normalized["validation_passed"] = True
    return normalized


def validate_recommendations(
    recommendations: List[Dict[str, Any]],
    df: pd.DataFrame,
    profile: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Validate a list of recommendations.

    Returns valid recommendations. Invalid ones are dropped (not raised) so
    the caller can decide how to surface rejections to the user.
    """
    valid: List[Dict[str, Any]] = []
    for rec in recommendations:
        try:
            valid.append(validate_recommendation(rec, df, profile))
        except ValidationError:
            continue
    return valid


def validate_evidence_consistency(
    recommendation: Dict[str, Any],
    evidence: Dict[str, Any],
) -> List[str]:
    """Check that a recommendation's claims match its evidence.

    Returns a list of inconsistency messages (empty = consistent).
    """
    issues: List[str] = []
    issue_type = str(recommendation.get("issue_type", "")).lower()
    column = recommendation.get("column")
    affected_rows = int(recommendation.get("affected_rows", 0))

    if issue_type == "missing_values" and column:
        ev_missing = int(evidence.get("missing_count", 0))
        if affected_rows > ev_missing:
            issues.append(
                f"affected_rows ({affected_rows}) exceeds evidence missing_count "
                f"({ev_missing}) for column '{column}'"
            )
        ev_pct = float(evidence.get("missing_percentage", 0.0))
        rec_pct = float(recommendation.get("affected_percentage", 0.0))
        if abs(ev_pct - rec_pct) > 1.0:
            issues.append(
                f"affected_percentage ({rec_pct}) inconsistent with evidence "
                f"missing_percentage ({ev_pct})"
            )

    if issue_type == "outlier" and column:
        ev_count = int(evidence.get("outlier_count", 0))
        if affected_rows > ev_count:
            issues.append(
                "affected_rows ({}) exceeds evidence outlier_count ({}) for "
                "column '{}'".format(affected_rows, ev_count, column)
            )

    return issues
