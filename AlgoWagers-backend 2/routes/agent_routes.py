from flask import Blueprint, request
from controllers.agent_controller import register_agent, trigger_agent

agent_bp = Blueprint("agents", __name__)

@agent_bp.route("/register", methods=["POST"])
def register():
    return register_agent(request.json)

@agent_bp.route("/<agent_id>/trigger", methods=["POST"])
def trigger(agent_id):
    return trigger_agent(agent_id, request.json)