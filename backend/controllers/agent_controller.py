from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from controllers.feed_controller import add_event
from models.agent_store import agent_histories, agents, agents_stats
from services.agent_runner import run_agent


def _utc_now():
    return datetime.now(timezone.utc)


def _ensure_agent_stats(agent_id, name, creator_wallet, specialization="both"):
    if agent_id not in agents_stats:
        agents_stats[agent_id] = {
            "agent_id": agent_id,
            "name": name,
            "creator_wallet": creator_wallet,
            "specialization": specialization,
            "strategy": "",
            "total_bets": 0,
            "wins": 0,
            "losses": 0,
            "total_profit_algo": 0.0,
            "total_volume_algo": 0.0,
            "win_rate": 0.0,
            "roi": 0.0,
            "last_decision_at": None,
        }
    if agent_id not in agent_histories:
        agent_histories[agent_id] = []
    return agents_stats[agent_id]


def _refresh_agent_metrics(agent_id):
    stats = agents_stats[agent_id]
    total_volume = stats["total_volume_algo"]

    resolved_bets = stats["wins"] + stats["losses"]
    stats["win_rate"] = (
        round((stats["wins"] / resolved_bets) * 100, 2) if resolved_bets else 0.0
    )
    stats["roi"] = round((stats["total_profit_algo"] / total_volume) * 100, 2) if total_volume else 0.0


def register_agent(data):
    agent_id = data.get("id") or data.get("address") or str(uuid4())
    agent = {
        "id": agent_id,
        "name": data["name"],
        "creator_wallet": data["creator_wallet"],
        "wallet_address": data.get("wallet_address", agent_id),
        "specialization": data.get("specialization", "both"),
        "strategy": data.get("strategy", ""),
        "webhook_url": data.get("webhook_url"),
        "api_key": data.get("api_key"),
        "model": data.get("model"),
        "default_bet_amount": float(data.get("default_bet_amount", 1)),
        "status": data.get("status", "active"),
        "registered_at": _utc_now().isoformat(),
    }

    agents[agent_id] = agent
    stats = _ensure_agent_stats(
        agent_id,
        agent["name"],
        agent["creator_wallet"],
        agent["specialization"],
    )
    stats["strategy"] = agent["strategy"]

    add_event(
        {
            "type": "AGENT_REGISTERED",
            "actor_type": "agent",
            "agent_id": agent_id,
            "agent": agent["name"],
            "creator_wallet": agent["creator_wallet"],
            "specialization": agent["specialization"],
        }
    )
    return {"message": "registered", "agent": serialize_agent(agent_id)}


def list_agents():
    return [serialize_agent(agent_id) for agent_id in agents]


def get_agent_history(agent_id):
    if agent_id not in agents:
        raise KeyError(f"Agent {agent_id} not found")
    return agent_histories.get(agent_id, [])


def get_leaderboard():
    leaderboard = sorted(
        [serialize_agent(agent_id) for agent_id in agents],
        key=lambda agent: agent["roi"],
        reverse=True,
    )
    return leaderboard


def trigger_agent(agent_id, market):
    if agent_id not in agents:
        raise KeyError(f"Agent {agent_id} not found")
    agent = agents[agent_id]
    if "market_id" in market:
        from controllers.market_controller import get_market, place_bet

        market_snapshot = get_market(market["market_id"])
        decision = run_agent(agent, market_snapshot)
        placed = place_bet(
            market["market_id"],
            {
                "side": decision["decision"],
                "amount": decision["amount"],
                "bettor_type": "agent",
                "bettor_id": agent_id,
                "reasoning": decision["reasoning"],
            },
        )
        return {"agent_id": agent_id, **decision, "bet": placed["bet"]}

    decision = run_agent(agent, market)
    return {"agent_id": agent_id, **decision}


def trigger_active_agents_for_market(market):
    decisions = []

    for agent_id, agent in agents.items():
        if agent.get("status") != "active":
            continue
        specialization = agent.get("specialization", "both")
        if specialization not in ("both", market["market_type"]):
            continue

        try:
            result = run_agent(agent, market)
        except Exception as exc:
            add_event(
                {
                    "type": "AGENT_TRIGGER_FAILED",
                    "actor_type": "agent",
                    "agent_id": agent_id,
                    "agent": agent["name"],
                    "market_id": market["id"],
                    "error": str(exc),
                }
            )
            continue
        decisions.append(
            {
                "agent_id": agent_id,
                "decision": result["decision"],
                "reasoning": result["reasoning"],
                "amount": float(result["amount"]),
            }
        )

    return decisions


def record_agent_bet(agent_id, market, bet):
    if agent_id not in agents:
        return

    stats = agents_stats[agent_id]
    stats["total_bets"] += 1
    stats["total_volume_algo"] += float(bet["amount"])
    stats["last_decision_at"] = bet["created_at"]
    _refresh_agent_metrics(agent_id)

    agent_histories[agent_id].insert(
        0,
        {
            "market_id": market["id"],
            "asset_name": market["asset_name"],
            "ticker": market["ticker"],
            "decision": bet["side"],
            "amount": bet["amount"],
            "reasoning": bet.get("reasoning"),
            "status": "open",
            "created_at": bet["created_at"],
        },
    )


def record_agent_settlement(agent_id, market, bet, payout, outcome):
    if agent_id not in agents:
        return

    stats = agents_stats[agent_id]
    net = round(float(payout) - float(bet["amount"]), 6)
    if bet["side"] == outcome:
        stats["wins"] += 1
    else:
        stats["losses"] += 1
    stats["total_profit_algo"] += net
    _refresh_agent_metrics(agent_id)

    history = agent_histories.get(agent_id, [])
    for entry in history:
        if entry["market_id"] == market["id"] and entry["created_at"] == bet["created_at"]:
            entry["status"] = "resolved"
            entry["outcome"] = outcome
            entry["payout"] = round(float(payout), 6)
            entry["net"] = net
            break


def serialize_agent(agent_id):
    agent = agents[agent_id]
    stats = agents_stats[agent_id]
    payload = deepcopy(stats)
    payload.update(
        {
            "id": agent_id,
            "wallet_address": agent["wallet_address"],
            "status": agent["status"],
            "registered_at": agent["registered_at"],
            "webhook_url": agent.get("webhook_url"),
            "bets_count": stats["total_bets"],
        }
    )
    return payload
