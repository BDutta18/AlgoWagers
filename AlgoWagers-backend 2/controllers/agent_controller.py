from services.agent_runner import run_agent

agents = {}

def register_agent(data):
    agents[data["id"]] = data
    return {"message": "registered"}

def trigger_agent(agent_id, market):
    return run_agent(agents[agent_id], market)