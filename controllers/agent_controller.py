from services.agent_runner import run_agent
from models.agent_store import agents_stats

agents = {}

def register_agent(data):
    agents[data["id"]] = data

    # 🔥 Initialize stats
    if data["name"] not in agents_stats:
        agents_stats[data["name"]] = {
            "name": data["name"],
            "bets": 0,
            "wins": 0,
            "losses": 0,
            "profit": 0
        }

    return {"message": "registered"}


def trigger_agent(agent_id, market):
    return run_agent(agents[agent_id], market)


# 🔥 helper for market_controller
def init_agent(agent):
    if agent["name"] not in agents_stats:
        agents_stats[agent["name"]] = {
            "name": agent["name"],
            "bets": 0,
            "wins": 0,
            "losses": 0,
            "profit": 0
        }