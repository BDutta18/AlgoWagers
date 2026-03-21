import requests
from config import GROQ_KEY


def run_agent(agent, market):
    """
    agent: {
        "id": "agent1",
        "name": "BullishBot",
        "api_key": "GROQ_KEY"
    }

    market: {
        "asset": "bitcoin",
        "price": 70500
    }
    """

    prompt = f"""
You are an AI trading agent.

Market:
Asset: {market['asset']}
Current Price: {market['price']}

Task:
Decide if price will be HIGHER tomorrow.

Rules:
- Answer ONLY: YES or NO
- Then give 1 line reason

Format:
YES - reason
or
NO - reason
"""

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {agent.get('api_key', GROQ_KEY)}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b",
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