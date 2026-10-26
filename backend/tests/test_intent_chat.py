import pytest
from app.services.ai_chat import AIChatAssistant

def test_intent_classification():
    assert AIChatAssistant.classify_intent("hello") == "GREETING"
    assert AIChatAssistant.classify_intent("yo sup") == "GREETING"
    assert AIChatAssistant.classify_intent("how are you") == "HOW_ARE_YOU"
    assert AIChatAssistant.classify_intent("thanks a lot") == "THANKS"
    assert AIChatAssistant.classify_intent("okay got it") == "ACKNOWLEDGMENT"
    assert AIChatAssistant.classify_intent("Tell me a joke") == "OFF_TOPIC"
    assert AIChatAssistant.classify_intent("What are the biggest data-quality issues?") == "LLM_QUERY"
    assert AIChatAssistant.classify_intent("Why are there missing values in salary?") == "LLM_QUERY"
    assert AIChatAssistant.classify_intent("Which recommendations are risky?") == "LLM_QUERY"

def test_greeting_variants():
    greeting_resp = AIChatAssistant.generate_chat_response({}, [], {}, "hello", [])
    assert len(greeting_resp) > 0

def test_off_topic_refusal():
    off_resp = AIChatAssistant.generate_chat_response({}, [], {}, "Tell me a joke", [])
    assert "focused on your dataset" in off_resp

def test_dataset_grounded_answer():
    profile = {
        "filename": "test.csv",
        "row_count": 100,
        "column_count": 3,
        "total_missing_cells": 10,
        "missing_percentage": 3.33,
        "duplicate_row_count": 2,
        "risk_summary": {"Low": 1, "Medium": 1, "High": 0},
        "columns": [{"name": "salary", "inferred_type": "float64", "missing_count": 5, "missing_percentage": 5.0, "unique_count": 50}]
    }
    recs = [{
        "action_id": "rec_1",
        "issue_type": "missing_values",
        "column": "salary",
        "title": "Impute Missing Values in 'salary'",
        "rationale": "Maintains statistical power",
        "risk_level": "Medium",
        "execution_status": "pending",
        "proposed_action": "Impute missing using median"
    }]
    ans = AIChatAssistant.generate_chat_response(profile, recs, None, "What are the biggest data-quality issues?", [])
    assert len(ans) > 0
