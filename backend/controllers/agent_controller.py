import logging
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

logger = logging.getLogger(__name__)

from controllers.feed_controller import add_event
from models.agent_store import agent_histories, agents, agents_stats
from services.agent_runner import run_agent

try:
    from utils.contract_client import register_agent as register_agent_onchain

    ONCHAIN_AVAILABLE = True
except ImportError:
    ONCHAIN_AVAILABLE = False
    register_agent_onchain = None


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
    stats["roi"] = (
        round((stats["total_profit_algo"] / total_volume) * 100, 2)
        if total_volume
        else 0.0
    )


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
        "default_bet_amount": float(data.get("default_bet_amount", 0.01)),
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

    onchain_result = None
    if ONCHAIN_AVAILABLE and register_agent_onchain:
        try:
            onchain_result = register_agent_onchain(agent)
        except Exception as e:
            pass

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

    result = {"message": "registered", "agent": serialize_agent(agent_id)}
    if onchain_result:
        result["onchain"] = onchain_result

    return result


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
            print(f"Agent {agent_id} trigger failed: {exc}")
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

    if ONCHAIN_AVAILABLE:
        try:
            from utils.contract_client import record_agent_bet as record_bet_onchain

            record_bet_onchain(
                agent_id, market["id"], bet["id"], float(bet["amount"]), bet["side"]
            )
        except Exception:
            pass


def record_agent_settlement(agent_id, market, bet, payout, outcome):
    if agent_id not in agents:
        return

    stats = agents_stats[agent_id]
    net = round(float(payout) - float(bet["amount"]), 6)
    won = bet["side"] == outcome
    if won:
        stats["wins"] += 1
    else:
        stats["losses"] += 1
    stats["total_profit_algo"] += net
    _refresh_agent_metrics(agent_id)

    history = agent_histories.get(agent_id, [])
    for entry in history:
        if (
            entry["market_id"] == market["id"]
            and entry["created_at"] == bet["created_at"]
        ):
            entry["status"] = "resolved"
            entry["outcome"] = outcome
            entry["payout"] = round(float(payout), 6)
            entry["net"] = net
            break

    if ONCHAIN_AVAILABLE:
        try:
            from utils.contract_client import (
                record_agent_result as record_result_onchain,
            )

            record_result_onchain(agent_id, bet["id"], won, net)
        except Exception:
            pass


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


def seed_default_agents():
    # Only seed if the in-memory store is empty
    if agents:
        return
    
    default_agents = [
        {
            "name": "MomentumBot",
            "creator_wallet": "0xMOMENTUM001WALLET1234567890AB",
            "specialization": "crypto",
            "strategy": "I bet YES on assets with positive 24h momentum and RSI below 70. I exit when RSI exceeds 80.",
        },
        {
            "name": "ReversalBot",
            "creator_wallet": "0xREVERSAL002WALLET123456789ABCD",
            "specialization": "crypto",
            "strategy": "Mean reversion: I bet NO when price deviates more than 2 std dev from 20-day MA. Bet YES on reversion.",
        },
        {
            "name": "VolumeBot",
            "creator_wallet": "0xVOLUME003WALLET1234567890EFGH",
            "specialization": "crypto",
            "strategy": "I bet YES when volume exceeds 1.5x 30-day average with concurrent price increase.",
        },
        {
            "name": "NewsBot",
            "creator_wallet": "0xNEWS004WALLET1234567890IJKLM",
            "specialization": "both",
            "strategy": "I analyze GNews headlines for sentiment. Positive news = bet YES. Negative = bet NO. Min confidence 70%.",
        },
        {
            "name": "WhaleBot",
            "creator_wallet": "0xWHALE005WALLET1234567890NPQRS",
            "specialization": "crypto",
            "strategy": "Risk-averse strategy. Only bet when confidence > 80%. Track large wallet movements via on-chain data.",
        },
    ]
    
    logger.info(f"Seeding {len(default_agents)} default agents...")
    for agent_data in default_agents:
        try:
            register_agent(agent_data)
        except Exception as e:
            logger.error(f"Failed to seed agent {agent_data.get('name')}: {e}")
