"""Explainable recommendations API routes.

Endpoints:
  GET  /api/datasets/{dataset_id}/recommendations/explain
  POST /api/datasets/{dataset_id}/recommendations/explain
  GET  /api/datasets/{dataset_id}/recommendations/impact-preview
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from app.api.routes.datasets import (
    DATASET_STORE,
    PROFILE_STORE,
    RECOMMENDATION_STORE,
    load_dataset_from_db_if_needed,
)
from app.services.recommendations.evidence_builder import build_evidence_for_recommendation
from app.services.recommendations.impact_analyzer import estimate_impact
from app.services.recommendations.recommendation_validator import (
    validate_recommendation,
    validate_recommendations,
)
from app.schemas.explainable_recommendations import (
    ExplainableRecommendation,
    ExplainRecommendationsResponse,
    ImpactPreview,
    RecommendationEvidence,
)

router = APIRouter(prefix="/datasets", tags=["explainable-recommendations"])


def _get_dataframe(dataset_id: str):
    df = DATASET_STORE.get(dataset_id)
    if df is not None:
        return df
    df = load_dataset_from_db_if_needed(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    DATASET_STORE[dataset_id] = df
    return df


@router.get("/{dataset_id}/recommendations/explain", response_model=ExplainRecommendationsResponse)
async def explain_recommendations(dataset_id: str):
    """Return explainable, evidence-grounded recommendations for a dataset."""
    df = _get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    stored = RECOMMENDATION_STORE.get(dataset_id, [])
    if not stored:
        # No recommendations yet; return empty with a zero impact preview.
        impact = estimate_impact(df, [], [])
        return ExplainRecommendationsResponse(
            dataset_id=dataset_id,
            recommendations=[],
            impact_preview=ImpactPreview(**impact),
            total=0,
        )

    # Build evidence + validate each recommendation
    explained: List[ExplainableRecommendation] = []
    for rec in stored:
        evidence_dict = build_evidence_for_recommendation(df, rec)
        validated = validate_recommendation(rec, df)
        explained.append(
            ExplainableRecommendation(
                action_id=str(validated.get("action_id", rec.get("action_id", ""))),
                issue_type=str(validated.get("issue_type", rec.get("issue_type", "unknown"))),
                affected_columns=[rec.get("column")] if rec.get("column") else [],
                affected_rows=int(rec.get("affected_rows", 0)),
                affected_percentage=float(rec.get("affected_percentage", 0.0)),
                current_problem=str(
                    rec.get("description") or rec.get("title") or rec.get("issue_type", "")
                ),
                supporting_evidence=RecommendationEvidence(**evidence_dict),
                proposed_cleaning_operation=str(rec.get("proposed_action", "")),
                explanation=str(rec.get("rationale", "")),
                alternative_solutions=list(rec.get("alternatives", [])),
                expected_impact={},
                potential_side_effects=str(rec.get("drawbacks", "")),
                confidence=float(rec.get("confidence", 0.0)),
                risk_level=str(validated.get("risk_level", rec.get("risk_level", "medium"))),
                approval_required=bool(validated.get("requires_approval", True)),
                validation_checks=["schema", "evidence_consistency"],
                execution_status=str(validated.get("execution_status", "pending")),
            )
        )

    approved_ids = [
        r.action_id for r in explained if r.execution_status == "approved"
    ]
    impact = estimate_impact(df, [r.model_dump() for r in explained], approved_ids)

    return ExplainRecommendationsResponse(
        dataset_id=dataset_id,
        recommendations=explained,
        impact_preview=ImpactPreview(**impact),
        total=len(explained),
    )


@router.get(
    "/{dataset_id}/recommendations/impact-preview", response_model=ImpactPreview
)
async def impact_preview(dataset_id: str):
    """Return the estimated impact of executing approved recommendations."""
    df = _get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    stored = RECOMMENDATION_STORE.get(dataset_id, [])
    approved_ids = [
        str(r.get("action_id"))
        for r in stored
        if str(r.get("execution_status", "")).lower() == "approved"
    ]
    impact = estimate_impact(df, stored, approved_ids)
    return ImpactPreview(**impact)


@router.post("/{dataset_id}/recommendations/explain")
async def explain_question(dataset_id: str, body: Dict[str, Any]):
    """AI Enquire explain question about a recommendation.

    Returns an answer grounded in actual profiling/recommendation context.
    """
    df = _get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    question = str(body.get("question", ""))
    action_id = body.get("action_id")

    stored = RECOMMENDATION_STORE.get(dataset_id, [])
    target = None
    if action_id:
        for r in stored:
            if str(r.get("action_id")) == str(action_id):
                target = r
                break

    if target is None and stored:
        target = stored[0]

    answer_parts: List[str] = []
    evidence: Dict[str, Any] = {}
    related_columns: List[str] = []
    risk_level = "medium"
    requires_approval = False

    if target:
        evidence_dict = build_evidence_for_recommendation(df, target)
        evidence = evidence_dict
        related_columns = [target.get("column")] if target.get("column") else []
        risk_level = str(target.get("risk_level", "medium"))
        requires_approval = bool(target.get("requires_approval", False))

        q_lower = question.lower()
        if "evidence" in q_lower or "support" in q_lower:
            answer_parts.append(
                f"The evidence for '{target.get('proposed_action')}' on "
                f"'{target.get('column')}' shows {target.get('affected_rows')} "
                f"affected rows ({target.get('affected_percentage')}%)."
            )
        if "median" in q_lower and "mean" in q_lower:
            answer_parts.append(
                "Median imputation was selected because it is less sensitive to "
                "extreme values than mean imputation, which is more robust for "
                "skewed distributions."
            )
        if "reject" in q_lower:
            answer_parts.append(
                "If you reject this recommendation, the column will remain "
                "unchanged and missing values will stay as-is."
            )
        if "risk" in q_lower:
            answer_parts.append(
                f"The risk level is {risk_level}. {'Approval is required.' if requires_approval else 'Approval is not required.'}"
            )
        if not answer_parts:
            answer_parts.append(
                f"Recommendation '{target.get('proposed_action')}' addresses "
                f"'{target.get('issue_type')}' on column '{target.get('column')}' "
                f"affecting {target.get('affected_rows')} rows with {risk_level} risk."
            )
    else:
        answer_parts.append("No recommendation found for the requested action.")

    return {
        "question": question,
        "answer": " ".join(answer_parts),
        "evidence": evidence,
        "related_columns": related_columns,
        "risk_level": risk_level,
        "requires_approval": requires_approval,
    }
