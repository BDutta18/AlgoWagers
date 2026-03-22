from flask import Blueprint, jsonify, request

from controllers.agent_controller import (
    get_agent_history,
    get_leaderboard,
    list_agents,
    register_agent,
    trigger_agent,
)

agent_bp = Blueprint("agents", __name__)


@agent_bp.route("/", methods=["GET"])
def fetch_agents():
    return jsonify(list_agents())


@agent_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    return jsonify(get_leaderboard())


@agent_bp.route("/register", methods=["POST"])
def register():
    return jsonify(register_agent(request.get_json(force=True) or {}))


@agent_bp.route("/<agent_id>/history", methods=["GET"])
def history(agent_id):
    return jsonify(get_agent_history(agent_id))


@agent_bp.route("/<agent_id>/trigger", methods=["POST"])
def trigger(agent_id):
    return jsonify(trigger_agent(agent_id, request.get_json(force=True) or {}))
