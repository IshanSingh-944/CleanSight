import os
import json
import random
import http.client
import ssl
from typing import List, Dict, Any

# Load local .env if present for standalone ASGI execution
if os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip().strip("'").strip('"')

GREETING_VARIANTS = [
    "Hey! What would you like to investigate in your dataset?",
    "Hey there! Need help understanding a column or cleaning recommendation?",
    "Hi! Ask me anything about your current dataset or its cleaning plan.",
    "Hello! Want to explore missing values, data inconsistencies, or risk levels?"
]

HOW_ARE_YOU_VARIANTS = [
    "Doing well! Ready to help you investigate your dataset.",
    "Ready when you are. What should we look into?"
]

THANKS_VARIANTS = [
    "You're welcome!",
    "Anytime! Let me know if you want to investigate another data issue."
]

ACKNOWLEDGMENT_VARIANTS = [
    "Sounds good. What would you like to look at next?",
    "Got it. I'm here if you need help with the dataset."
]

OFF_TOPIC_REFUSAL = "I'm focused on your dataset and its cleaning workflow. Ask me about data-quality issues, columns, missing values, recommendations, risk levels, or cleaning results."

def _call_openrouter(api_key: str, messages: list) -> str:
    payload = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": messages,
        "temperature": 0.2
    }).encode("utf-8")

    ctx = ssl.create_default_context()
    conn = http.client.HTTPSConnection("openrouter.ai", timeout=30, context=ctx)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cleansight-ai-frontend.onrender.com",
        "X-Title": "CleanSight AI"
    }
    conn.request("POST", "/api/v1/chat/completions", body=payload, headers=headers)
    resp = conn.getresponse()
    status = resp.status
    body = resp.read().decode("utf-8")
    conn.close()

    print(f"DEBUG: OpenRouter status={status}")

    if status == 200:
        data = json.loads(body)
        return data["choices"][0]["message"]["content"]
    else:
        print(f"DEBUG: OpenRouter error body: {body[:300]}")
        raise Exception(f"OpenRouter returned {status}: {body[:200]}")

class AIChatAssistant:
    @staticmethod
    def classify_intent(user_message: str) -> str:
        msg = user_message.strip().lower()
        greetings = ["hi", "hello", "hey", "hey there", "yo", "sup", "yo sup", "good morning", "good afternoon", "good evening"]
        if msg in greetings:
            return "GREETING"
        if "how are you" in msg or "how're you" in msg:
            return "HOW_ARE_YOU"
        if any(w in msg for w in ["thanks", "thank you", "appreciate it"]):
            return "THANKS"
        if any(w in msg for w in ["okay", "cool", "got it", "nice", "sounds good"]) and len(msg.split()) <= 4:
            return "ACKNOWLEDGMENT"
        off_topic_keywords = ["joke", "weather", "cricket", "match", "python game", "movie", "president", "recipe", "song", "capital of"]
        if any(k in msg for k in off_topic_keywords) and not any(k in msg for k in ["dataset", "column", "missing", "duplicate", "clean", "recommendation", "risk"]):
            return "OFF_TOPIC"
        return "LLM_QUERY"

    @staticmethod
    def generate_chat_response(
        profile: dict,
        recommendations: list,
        execution_result: dict,
        user_message: str,
        history: list
    ) -> str:
        intent = AIChatAssistant.classify_intent(user_message)

        if intent == "OFF_TOPIC":
            return OFF_TOPIC_REFUSAL
        if intent == "GREETING":
            return random.choice(GREETING_VARIANTS)
        if intent == "HOW_ARE_YOU":
            return random.choice(HOW_ARE_YOU_VARIANTS)
        if intent == "THANKS":
            return random.choice(THANKS_VARIANTS)
        if intent == "ACKNOWLEDGMENT":
            return random.choice(ACKNOWLEDGMENT_VARIANTS)

        # Check all possible environment variable variants
        api_key = (
            os.environ.get("OPENROUTER_API_KEY") or 
            os.environ.get("OPENAI_API_KEY") or
            os.getenv("OPENROUTER_API_KEY") or
            os.getenv("OPENAI_API_KEY")
        )
        print(f"DEBUG CHAT: api_key present={bool(api_key)} len={len(api_key) if api_key else 0} keys_in_env={[k for k in os.environ if 'API' in k or 'KEY' in k]}")

        system_instruction = f"""You are CleanSight AI Enquire, an expert data-quality and cleaning assistant.
Answer questions about the currently loaded dataset, profiling results, recommendations, risk levels, and execution outcomes.
Answer the user's question directly using the dataset context below. Be concise and use bullet points where helpful.
You cannot execute cleaning operations — direct users to the UI approval controls for that.

DATASET CONTEXT:
Filename: {profile.get('filename')}
Rows: {profile.get('row_count')} | Columns: {profile.get('column_count')}
Missing Cells: {profile.get('total_missing_cells')} ({profile.get('missing_percentage', 0):.2f}%)
Duplicate Rows: {profile.get('duplicate_row_count')}
Risk Summary: {json.dumps(profile.get('risk_summary', {}))}
Columns: {json.dumps([c['name'] + ' (' + c['inferred_type'] + ', missing: ' + str(c['missing_count']) + ')' for c in profile.get('columns', [])])}
Recommendations: {json.dumps([{'title': r['title'], 'type': r['issue_type'], 'column': r.get('column'), 'risk': r['risk_level'], 'status': r.get('execution_status'), 'rationale': r['rationale'], 'proposed_action': r['proposed_action']} for r in recommendations])}
Execution Result: {json.dumps(execution_result if execution_result else "Not yet executed")}"""

        messages = [{"role": "system", "content": system_instruction}]
        for h in history:
            messages.append({"role": "user" if h.get("role") == "user" else "assistant", "content": h.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        if api_key:
            try:
                answer = _call_openrouter(api_key, messages)
                print(f"DEBUG CHAT: OpenRouter SUCCESS, answer length={len(answer)}")
                return answer
            except Exception as e:
                print(f"DEBUG CHAT: OpenRouter FAILED: {str(e)}")
                return f"⚠️ AI service error: {str(e)[:200]}. Check Render logs for details."
        else:
            print("DEBUG CHAT: NO API KEY found in environment!")
            return "⚠️ No OpenRouter API key found. Please set OPENROUTER_API_KEY in your Render environment variables."
