"""Deterministic semantic type inference engine.

Infers the difference between physical (pandas) data types and semantic
(data meaning) types without using an LLM as the primary mechanism.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

# Compiled regexes for deterministic detection
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
# Phone: 7-15 digits, allowing common separators
PHONE_RE = re.compile(r"^\+?[\d\s().-]{7,20}$")
POSTAL_CODE_RE = re.compile(r"^\d{5}(?:[-\s]\d{4})?$|^\d{6}$|^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$")
# Identifier-like: purely numeric strings of substantial length, or alphanumeric codes
IDENTIFIER_NUMERIC_RE = re.compile(r"^\d{7,}$")
DATE_RE = re.compile(
    r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$"
    r"|^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$"
    r"|^(\d{4})(\d{2})(\d{2})$"
)
CURRENCY_RE = re.compile(r"^[\$€£¥₹]\s?\d{1,3}(,\d{3})*(\.\d+)?$|^\d{1,3}(,\d{3})*(\.\d+)?\s?[\$€£¥₹]$")

BOOLEAN_TRUE = {"true", "t", "yes", "y", "1", "on"}
BOOLEAN_FALSE = {"false", "f", "no", "n", "0", "off"}


def _is_categorical_object(series: pd.Series) -> bool:
    return pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series)


def _sample_values(series: pd.Series, limit: int = 5) -> List[Any]:
    samples = series.dropna().head(limit).tolist()
    cleaned: List[Any] = []
    for val in samples:
        if isinstance(val, (float, np.floating)):
            cleaned.append(float(val))
        elif isinstance(val, (int, np.integer)):
            cleaned.append(int(val))
        elif isinstance(val, pd.Timestamp):
            cleaned.append(val.isoformat())
        else:
            cleaned.append(str(val))
    return cleaned


def infer_semantic_type(series: pd.Series) -> Dict[str, Any]:
    """Infer the semantic type of a single column.

    Returns a dict with:
      - original_type: pandas dtype name
      - suggested_type: recommended physical type
      - semantic_type: human-readable meaning
      - confidence: 0.0 to 1.0
      - explanation: deterministic reason
      - example_values: up to 5 sample values
    """
    result: Dict[str, Any] = {
        "original_type": str(series.dtype),
        "suggested_type": str(series.dtype),
        "semantic_type": "unknown",
        "confidence": 0.0,
        "explanation": "",
        "example_values": _sample_values(series),
    }

    non_null = series.dropna()
    row_count = len(series)
    non_null_count = len(non_null)

    if non_null_count == 0:
        result.update({
            "semantic_type": "empty",
            "suggested_type": "object",
            "confidence": 1.0,
            "explanation": "Column contains no non-null values.",
        })
        return result

    # ---- Numeric physical type ----
    if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
        result["semantic_type"] = "numeric"
        result["confidence"] = 0.95
        result["explanation"] = (
            f"Column is stored as {series.dtype} with {non_null_count} non-null numeric values."
        )
        # Check for identifier-like numeric columns (long sequences)
        if _looks_like_identifier(non_null):
            result["semantic_type"] = "identifier"
            result["suggested_type"] = "object"
            result["confidence"] = 0.8
            result["explanation"] = (
                "Numeric column contains long sequential values consistent with "
                "identifiers; treat as categorical/object, not for arithmetic."
            )
        return result

    # ---- Boolean physical type ----
    if pd.api.types.is_bool_dtype(series):
        result.update({
            "semantic_type": "boolean",
            "confidence": 0.98,
            "explanation": "Column is stored as boolean.",
        })
        return result

    # ---- Datetime physical type ----
    if pd.api.types.is_datetime64_any_dtype(series):
        result.update({
            "semantic_type": "datetime",
            "confidence": 0.98,
            "explanation": "Column is stored as datetime64.",
        })
        return result

    # ---- Object / string physical type ----
    if _is_categorical_object(series):
        str_series = non_null.astype(str).str.strip()
        total = len(str_series)

        # Email
        email_mask = str_series.str.match(EMAIL_RE)
        email_count = int(email_mask.sum())
        if email_count == total:
            result.update({
                "semantic_type": "email",
                "suggested_type": "object",
                "confidence": 0.95,
                "explanation": f"All {total} non-null values match email pattern.",
            })
            return result

        # Date-like strings (check before phone/numeric since dates contain digits/separators)
        date_mask = str_series.str.match(DATE_RE)
        date_count = int(date_mask.sum())
        if date_count == total and total > 0:
            # Try parsing to confirm
            try:
                parsed = pd.to_datetime(str_series, errors="coerce")
                valid_count = int(parsed.notna().sum())
                if valid_count == total:
                    result.update({
                        "semantic_type": "datetime",
                        "suggested_type": "datetime64[ns]",
                        "confidence": 0.9,
                        "explanation": (
                            f"All {total} non-null values match date pattern and parse successfully."
                        ),
                    })
                    return result
            except Exception:
                pass

        # Postal code
        postal_mask = str_series.str.match(POSTAL_CODE_RE)
        postal_count = int(postal_mask.sum())
        if postal_count == total and total > 0:
            result.update({
                "semantic_type": "postal_code",
                "suggested_type": "object",
                "confidence": 0.85,
                "explanation": f"All {total} non-null values match postal-code pattern.",
            })
            return result

        # Phone (check after date/postal to avoid false matches)
        phone_mask = str_series.str.match(PHONE_RE)
        phone_count = int(phone_mask.sum())
        if phone_count == total and total > 0:
            result.update({
                "semantic_type": "phone",
                "suggested_type": "object",
                "confidence": 0.85,
                "explanation": f"All {total} non-null values match phone-number pattern.",
            })
            return result

        # Currency strings
        currency_mask = str_series.str.match(CURRENCY_RE)
        currency_count = int(currency_mask.sum())
        if currency_count == total and total > 0:
            result.update({
                "semantic_type": "currency",
                "suggested_type": "float64",
                "confidence": 0.8,
                "explanation": f"All {total} non-null values match currency pattern.",
            })
            return result

        # Boolean-like categories
        lowered = str_series.str.lower()
        true_count = int(lowered.isin(BOOLEAN_TRUE).sum())
        false_count = int(lowered.isin(BOOLEAN_FALSE).sum())
        bool_count = true_count + false_count
        if bool_count == total and total > 0 and total >= 2:
            result.update({
                "semantic_type": "boolean",
                "suggested_type": "boolean",
                "confidence": 0.9,
                "explanation": (
                    f"All {total} non-null values are boolean-like ({true_count} true, "
                    f"{false_count} false)."
                ),
            })
            return result

        # Numeric strings (all values parse as numbers)
        numeric_converted = pd.to_numeric(str_series, errors="coerce")
        numeric_valid = int(numeric_converted.notna().sum())
        if numeric_valid == total and total > 0:
            # Check identifier-like (long numeric strings)
            if _looks_like_identifier(non_null):
                result.update({
                    "semantic_type": "identifier",
                    "suggested_type": "object",
                    "confidence": 0.8,
                    "explanation": (
                        "Column contains numeric strings consistent with identifiers; "
                        "do not convert to numeric for arithmetic."
                    ),
                })
                return result
            result.update({
                "semantic_type": "numeric",
                "suggested_type": "float64",
                "confidence": 0.85,
                "explanation": (
                    f"All {total} non-null values are numeric strings; can be cast to numeric."
                ),
            })
            return result

        # Categorical (default for object)
        nunique = int(non_null.nunique())
        cardinality_ratio = nunique / total if total > 0 else 0
        if cardinality_ratio > 0.9 and total > 10:
            semantic = "identifier"
            suggested = "object"
            explanation = (
                f"High cardinality ({nunique} unique of {total} values) consistent "
                "with an identifier column."
            )
            confidence = 0.75
        else:
            semantic = "categorical"
            suggested = "object"
            explanation = (
                f"Categorical column with {nunique} unique value(s) of {total} non-null rows."
            )
            confidence = 0.85
        result.update({
            "semantic_type": semantic,
            "suggested_type": suggested,
            "confidence": confidence,
            "explanation": explanation,
        })
        return result

    # Fallback
    result.update({
        "semantic_type": "unknown",
        "confidence": 0.5,
        "explanation": "Could not determine a confident semantic type.",
    })
    return result


def _looks_like_identifier(series: pd.Series) -> bool:
    """Heuristic: long numeric sequences are likely identifiers."""
    if len(series) == 0:
        return False
    try:
        nums = pd.to_numeric(series, errors="coerce").dropna()
        if len(nums) == 0:
            return False
        # Values with 7+ digits, or largely unique sequential numbers
        digit_lengths = nums.astype(str).str.len()
        long_digit_ratio = float((digit_lengths >= 7).sum()) / len(nums)
        unique_ratio = float(nums.nunique()) / len(nums)
        return long_digit_ratio > 0.6 and unique_ratio > 0.9
    except Exception:
        return False


def infer_all_columns(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Run type inference on every column of a DataFrame."""
    return {col: infer_semantic_type(df[col]) for col in df.columns}
