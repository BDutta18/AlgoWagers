from datetime import datetime, timedelta
from services.agent_runner import run_agent
from services.price_feed import get_crypto_price
from models.market_store import markets

def create_market(data):
    asset = "algorand"
    m_type = "crypto"

    start_price = get_crypto_price(asset)

    m_id = str(len(markets) + 1)

    market = {
        "id": m_id,
        "asset": asset,
        "type": m_type,
        "start_price": start_price,
        "yes_pool": 0,
        "no_pool": 0,
        "created_at": datetime.utcnow().isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
        "resolved": False,
        "outcome": None
    }

    markets[m_id] = market

    agent = {
        "id": "1",
        "name": "BullishBot"
    }

    decision_data = run_agent(agent, {
        "asset": market["asset"],
        "price": market["start_price"]
    })

    # 🧠 simulate bet
    if decision_data["decision"] == "YES":
        market["yes_pool"] += 50
    else:
        market["no_pool"] += 50

    print(f"[AGENT BET] {decision_data}")
    
    return market


def get_all_markets():
    result = []

    for m in markets.values():
        total = m["yes_pool"] + m["no_pool"]

        yes_prob = m["yes_pool"] / total if total else 0.5
        no_prob = m["no_pool"] / total if total else 0.5

        result.append({
            "id": m["id"],
            "asset": m["asset"],
            "price": get_crypto_price(m["asset"]),
            "yes_prob": round(yes_prob, 2),
            "no_prob": round(no_prob, 2),
            "ends_at": m["ends_at"],
            "resolved": m["resolved"]
        })

    return result


def place_bet(m_id, data):
    market = markets[m_id]

    side = data["side"]
    amount = data["amount"]

    if side == "YES":
        market["yes_pool"] += amount
    else:
        market["no_pool"] += amount

    return {"message": "bet placed"}


def resolve_market(m_id):
    market = markets[m_id]

    end_price = get_crypto_price(market["asset"])

    outcome = "YES" if end_price > market["start_price"] else "NO"

    market["resolved"] = True
    market["outcome"] = outcome

    return {"outcome": outcome}