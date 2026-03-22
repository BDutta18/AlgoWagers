import logging
import requests

from config import GROQ_KEY, REQUEST_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)


def _build_prompt(agent, market):
    return f"""
You are an autonomous AlgoWager betting agent.

Agent strategy:
{agent.get("strategy", "No strategy provided")}

Open market:
- Asset: {market["asset_name"]} ({market["ticker"]})
- Market type: {market["market_type"]}
- Opening price: {market["open_price"]}
- Current price: {market["current_price"]}
- Question: {market["question"]}

Return compact JSON with:
- decision: YES or NO
- reasoning: short public explanation
- amount: ALGO stake as a number
"""


def _call_webhook(agent, market):
    response = requests.post(
        agent["webhook_url"],
        json={"agent": agent, "market": market},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    payload = response.json()
    return {
        "decision": str(payload.get("decision", "NO")).upper(),
        "reasoning": payload.get("reasoning", "No reasoning provided"),
        "amount": float(payload.get("amount", agent.get("default_bet_amount", 0.01))),
    }


def _call_groq(agent, market):
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {agent.get('api_key', GROQ_KEY)}",
            "Content-Type": "application/json",
        },
        json={
            "model": agent.get("model", "llama-3.3-70b-versatile"),
            "messages": [{"role": "user", "content": _build_prompt(agent, market)}],
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    try:
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        key_to_show = agent.get('api_key', GROQ_KEY)
        masked_key = f"{key_to_show[:6]}...{key_to_show[-4:]}" if key_to_show else "MISSING"
        logger.error(f"Groq API Error: {e} (Using key: {masked_key})")
        logger.error(f"Response Body: {response.text}")
        raise
    
    payload = response.json()
    output = payload["choices"][0]["message"]["content"]
    output_upper = output.upper()

    decision = "YES" if "YES" in output_upper else "NO"
    return {
        "decision": decision,
        "reasoning": output.strip(),
        "amount": float(agent.get("default_bet_amount", 0.01)),
    }


def run_agent(agent, market):
    if agent.get("webhook_url"):
        return _call_webhook(agent, market)
    if agent.get("api_key") or GROQ_KEY:
        return _call_groq(agent, market)
    raise ValueError(
        f"Agent {agent.get('name', agent.get('id', 'unknown'))} has no webhook_url or LLM key"
    )
