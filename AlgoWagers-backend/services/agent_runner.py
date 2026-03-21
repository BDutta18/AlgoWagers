import requests
import json
import numpy as np
from config import GROQ_KEY
from services.data_pipeline import get_data_bundle
from services.ml_models import train_and_predict_lstm
from services.sports_logic import predict_sports_outcome

LOCKED_SYSTEM_PROMPT = """
You are a market analysis agent. You must ONLY reason about 
the data provided in this message. You cannot use training 
knowledge about prices or news. You cannot reference any 
headline not in the provided list. You cannot reference any 
price not in the provided data. If data is insufficient output 
confidence below 65. Output ONLY valid JSON:
{
  "decision": "YES"|"NO"|"NO_BET",
  "confidence": int (0-100),
  "signals_used": [str],
  "signals_against": [str],
  "reasoning": str (max 280 chars, only reference provided data)
}
"""

def run_agent(agent_config, asset_id, market_type="crypto"):
    """
    Runs an AI agent. Routes to specialized ML models like PyTorch LSTM 
    or Sports Logic engines based on configuration, falling back to LLM.
    """
    # 1. Sports Markets bypass general LLMs for specialized Player-Impact logic
    if market_type == "sports":
        result = predict_sports_outcome(asset_id)
        result["agent"] = agent_config["name"]
        return result

    data_bundle = get_data_bundle(asset_id)
    if not data_bundle:
        return {"agent": agent_config["name"], "decision": "NO_BET", "confidence": 0, "reason": "FAILED_TO_FETCH_DATA"}

    # 2. Advanced ML execution: PyTorch LSTM (80/20 Train/Test split)
    if agent_config.get("strategy") == "trend_following" or "LSTM" in agent_config["name"]:
        # The LSTM now natively fetches live yfinance data
        lstm_out = train_and_predict_lstm(asset_id)
        
        return {
            "agent": agent_config["name"],
            "decision": lstm_out["decision"],
            "confidence": lstm_out["confidence"],
            "reason": lstm_out["reasoning"],
            "data_snapshot": {**data_bundle, "ml_metrics": lstm_out["metrics"]},
            "signals_used": [f"PyTorch LSTM Test Acc: {lstm_out['metrics']['test_accuracy']}"],
            "signals_against": []
        }

    # 3. Standard LLM Execution (Sentiment, News, etc.)
    agent_message = f"DATA_BUNDLE: {json.dumps(data_bundle, indent=2)}\n\nSTRATEGY: {agent_config.get('strategy', 'Neutral')}"

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": LOCKED_SYSTEM_PROMPT},
                    {"role": "user", "content": agent_message}
                ],
                "response_format": {"type": "json_object"}
            }
        )
        content = response.json()["choices"][0]["message"]["content"]
        result = json.loads(content)

        confidence = result.get("confidence", 0)
        decision = result.get("decision", "NO_BET") if confidence >= 65 else "NO_BET"

        return {
            "agent": agent_config["name"],
            "decision": decision,
            "confidence": confidence,
            "reason": result.get("reasoning", "") if confidence >= 65 else f"Confidence {confidence}% below threshold.",
            "data_snapshot": data_bundle,
            "signals_used": result.get("signals_used", []),
            "signals_against": result.get("signals_against", [])
        }
    except Exception as e:
        print(f"Agent Exec Error: {e}")
        return {"agent": agent_config["name"], "decision": "NO_BET", "confidence": 0, "reason": "EXECUTION_FAILURE", "data_snapshot": data_bundle}