"""Configurable business-rule inconsistency detection.

Detects contradictions across related columns (e.g., delivered order with no
delivery date, negative age, start after end). Rules are explainable and
distinguish deterministic violations from statistical anomalies.
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional

import pandas as pd


class BusinessRule:
    """A single configurable business rule."""

    def __init__(
        self,
        rule_id: str,
        name: str,
        description: str,
        rule_type: str,  # 'deterministic' | 'statistical' | 'review'
        columns: List[str],
        check: Callable[[pd.DataFrame], pd.Series],
        severity: str = "medium",
        explanation: str = "",
        suggested_action: str = "",
    ):
        self.rule_id = rule_id
        self.name = name
        self.description = description
        self.rule_type = rule_type
        self.columns = columns
        self.check = check
        self.severity = severity
        self.explanation = explanation
        self.suggested_action = suggested_action

    def evaluate(self, df: pd.DataFrame) -> Dict[str, Any]:
        missing_cols = [c for c in self.columns if c not in df.columns]
        if missing_cols:
            return {
                "rule_id": self.rule_id,
                "name": self.name,
                "violated": False,
                "affected_rows": 0,
                "skipped": True,
                "reason": f"Missing columns: {missing_cols}",
            }

        mask = self.check(df)
        mask = mask.fillna(False)
        affected_rows = int(mask.sum())

        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "rule_type": self.rule_type,
            "violated": affected_rows > 0,
            "affected_rows": affected_rows,
            "affected_percentage": round(affected_rows / len(df) * 100, 2) if len(df) > 0 else 0.0,
            "severity": self.severity,
            "columns": self.columns,
            "explanation": self.explanation,
            "suggested_action": self.suggested_action,
        }


def _build_default_rules() -> List[BusinessRule]:
    """Build a starter set of common-sense business rules.

    These are heuristic examples, not domain truth. Users should extend or
    replace them with rules specific to their dataset.
    """
    rules: List[BusinessRule] = []

    # Delivered order but missing delivery date
    def _delivered_no_date(df: pd.DataFrame) -> pd.Series:
        status = df.get("order_status", pd.Series(dtype=object)).astype(str)
        date = df.get("delivery_date", pd.Series(dtype=object))
        return (status.str.lower().str.contains("deliv", na=False)) & date.isnull()

    rules.append(
        BusinessRule(
            rule_id="delivered_no_delivery_date",
            name="Delivered order missing delivery date",
            description="An order marked delivered has no delivery date recorded.",
            rule_type="deterministic",
            columns=["order_status", "delivery_date"],
            check=_delivered_no_date,
            severity="high",
            explanation=(
                "A delivered order should always have a delivery date; its absence "
                "suggests an incomplete fulfillment record."
            ),
            suggested_action=(
                "Backfill the delivery date or reclassify the order status."
            ),
        )
    )

    # Successful transaction but zero amount
    def _success_zero_amount(df: pd.DataFrame) -> pd.Series:
        status = df.get("transaction_status", pd.Series(dtype=object)).astype(str)
        amount = df.get("transaction_amount", pd.Series(dtype=float))
        return (status.str.lower().str.contains("success", na=False)) & (
            amount.fillna(0) == 0
        )

    rules.append(
        BusinessRule(
            rule_id="success_zero_amount",
            name="Successful transaction with zero amount",
            description="A transaction marked successful has a zero transaction amount.",
            rule_type="deterministic",
            columns=["transaction_status", "transaction_amount"],
            check=_success_zero_amount,
            severity="high",
            explanation=(
                "A successful transaction with a zero amount is contradictory and "
                "may indicate a payment-processing or recording error."
            ),
            suggested_action="Verify the transaction amount and payment status.",
        )
    )

    # Negative age
    def _negative_age(df: pd.DataFrame) -> pd.Series:
        age = df.get("age", pd.Series(dtype=float))
        return age.notnull() & (age < 0)

    rules.append(
        BusinessRule(
            rule_id="negative_age",
            name="Negative customer age",
            description="A customer record has a negative age value.",
            rule_type="deterministic",
            columns=["age"],
            check=_negative_age,
            severity="medium",
            explanation="Age cannot be negative; this is a data-entry or ingestion error.",
            suggested_action="Correct or remove the invalid age values.",
        )
    )

    # Start date after end date
    def _start_after_end(df: pd.DataFrame) -> pd.Series:
        start = pd.to_datetime(df.get("start_date", pd.Series(dtype=object)), errors="coerce")
        end = pd.to_datetime(df.get("end_date", pd.Series(dtype=object)), errors="coerce")
        return start.notnull() & end.notnull() & (start > end)

    rules.append(
        BusinessRule(
            rule_id="start_after_end",
            name="Start date after end date",
            description="The start date occurs after the end date.",
            rule_type="deterministic",
            columns=["start_date", "end_date"],
            check=_start_after_end,
            severity="medium",
            explanation="A start date later than the end date is logically impossible "
            "for a valid interval.",
            suggested_action="Swap or correct the date values.",
        )
    )

    # Discount exceeds allowed range (0-100)
    def _discount_out_of_range(df: pd.DataFrame) -> pd.Series:
        discount = df.get("discount_percentage", pd.Series(dtype=float))
        return discount.notnull() & ((discount < 0) | (discount > 100))

    rules.append(
        BusinessRule(
            rule_id="discount_out_of_range",
            name="Discount percentage outside valid range",
            description="Discount percentage is below 0 or above 100.",
            rule_type="deterministic",
            columns=["discount_percentage"],
            check=_discount_out_of_range,
            severity="medium",
            explanation=(
                "Discount percentages should fall between 0% and 100%; values outside "
                "this range are likely data-entry errors."
            ),
            suggested_action="Review and correct discount values.",
        )
    )

    # Payment status conflicts with payment date
    def _paid_no_date(df: pd.DataFrame) -> pd.Series:
        status = df.get("payment_status", pd.Series(dtype=object)).astype(str)
        date = df.get("payment_date", pd.Series(dtype=object))
        return status.str.lower().str.contains("paid", na=False) & date.isnull()

    rules.append(
        BusinessRule(
            rule_id="paid_no_payment_date",
            name="Paid status with no payment date",
            description="A payment marked paid has no payment date recorded.",
            rule_type="deterministic",
            columns=["payment_status", "payment_date"],
            check=_paid_no_date,
            severity="medium",
            explanation="A paid transaction should have a corresponding payment date.",
            suggested_action="Backfill the payment date or adjust the status.",
        )
    )

    return rules


class BusinessRuleDetector:
    """Detects business-rule inconsistencies across related columns."""

    def __init__(self, rules: Optional[List[BusinessRule]] = None):
        self.rules = rules if rules is not None else _build_default_rules()

    def add_rule(self, rule: BusinessRule) -> None:
        self.rules.append(rule)

    def detect(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Evaluate all rules against the dataframe."""
        findings: List[Dict[str, Any]] = []
        for rule in self.rules:
            result = rule.evaluate(df)
            if result.get("skipped"):
                continue
            findings.append(result)

        severity_order = {"high": 0, "medium": 1, "low": 2}
        findings.sort(
            key=lambda r: (severity_order.get(r.get("severity", "low"), 3), -r.get("affected_rows", 0))
        )
        return findings
