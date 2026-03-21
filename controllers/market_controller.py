from datetime import datetime, timedelta
import random
from services.agent_runner import run_agent
from services.price_feed import get_crypto_price
from models.market_store import markets
from controllers.feed_controller import add_event
from controllers.agent_controller import init_agent
from models.agent_store import agents_stats


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
        "outcome": None,
        "bets": []   # ✅ initialize here
    }

    markets[m_id] = market

    agents = [
        {"id": "1", "name": "MomentumBot", "strategy": "trend_following"},
        {"id": "2", "name": "ReversalBot", "strategy": "mean_reversion"},
        {"id": "3", "name": "VolumeBot", "strategy": "volume_based"},
        {"id": "4", "name": "NewsBot", "strategy": "sentiment"},
        {"id": "5", "name": "WhaleBot", "strategy": "risk_averse"}
    ]

    for agent in agents:

        # ✅ initialize agent stats
        init_agent(agent)
        agents_stats[agent["name"]]["bets"] += 1

        # 🤖 run agent
        decision_data = run_agent(agent, {
            "asset": market["asset"],
            "price": market["start_price"]
        })

        decision = decision_data["decision"]

        # 🎲 variable bet
        confidence = random.uniform(0.5, 1.0)
        bet_amount = int(100 * confidence)

        # ✅ store bet for resolution
        market["bets"].append({
            "agent": agent["name"],
            "decision": decision,
            "amount": bet_amount
        })

        # ✅ add to feed
        add_event({
            "type": "AGENT_BET",
            "agent": agent["name"],
            "strategy": agent["strategy"],
            "asset": market["asset"],
            "decision": decision,
            "amount": bet_amount,
            "reason": decision_data["reason"]
        })

        # 💰 update pool
        if decision == "YES":
            market["yes_pool"] += bet_amount
        else:
            market["no_pool"] += bet_amount

        print(f"[AI BET] {agent['name']} → {decision} → {market['asset']} → {bet_amount}")

    print(f"[MARKET STATE] YES: {market['yes_pool']} | NO: {market['no_pool']}")

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
            "question": "Will ALGORAND be higher tomorrow?",
            "start_price": m["start_price"],
            "current_price": get_crypto_price(m["asset"]),
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

    # 🔥 update agent stats
    for bet in market.get("bets", []):
        agent_name = bet["agent"]
        decision = bet["decision"]
        amount = bet["amount"]

        if decision == outcome:
            agents_stats[agent_name]["wins"] += 1
            agents_stats[agent_name]["profit"] += amount
        else:
            agents_stats[agent_name]["losses"] += 1
            agents_stats[agent_name]["profit"] -= amount

    print(f"[RESOLVE] Market {m_id} → {outcome}")

    return {"outcome": outcome}