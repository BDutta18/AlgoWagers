import requests
from config import GROQ_KEY


def run_agent(agent, market):

    strategy = agent.get("strategy", "")

    if strategy == "trend_following":
        personality = "You follow trends. If price is rising, predict YES."
    
    elif strategy == "mean_reversion":
        personality = "You expect reversals. If price is high, predict NO."
    
    elif strategy == "volume_based":
        personality = "You rely on volume spikes and momentum."
    
    elif strategy == "sentiment":
        personality = "You analyze market sentiment and news."
    
    elif strategy == "risk_averse":
        personality = "You are conservative and avoid risky bets."

    prompt = f"""
You are an AI trading agent.

{personality}

Market:
Asset: {market['asset']}
Price: {market['price']}

Task:
Predict if price will be HIGHER tomorrow.

Rules:
- Answer ONLY YES or NO
- Give 1 line reasoning
"""

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {agent.get('api_key', GROQ_KEY)}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )

        data = response.json()

        output = data["choices"][0]["message"]["content"]

        # 🧠 parse decision
        output_upper = output.upper()

        if "YES" in output_upper:
            decision = "YES"
        elif "NO" in output_upper:
            decision = "NO"
        else:
            decision = "NO"  # fallback

        return {
            "agent": agent["name"],
            "decision": decision,
            "reason": output.strip()
        }

    except Exception as e:
        print("Agent error:", e)

        return {
            "agent": agent["name"],
            "decision": "NO",
            "reason": "Fallback decision due to error"
        }