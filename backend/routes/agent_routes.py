import logging
import threading
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request

from controllers.agent_controller import (
    get_agent_history,
    get_leaderboard,
    list_agents,
    register_agent,
    trigger_agent,
)
from models.agent_store import agents
from services.agent_runner import run_agent

logger = logging.getLogger(__name__)

agent_bp = Blueprint("agents", __name__)

_active_connections = []
_connection_lock = threading.Lock()


def broadcast_event(event_type: str, data: dict):
    with _connection_lock:
        for connection in _active_connections[:]:
            try:
                connection.put({"type": event_type, "data": data})
            except Exception:
                _active_connections.remove(connection)


def register_connection(conn):
    with _connection_lock:
        _active_connections.append(conn)


def unregister_connection(conn):
    with _connection_lock:
        if conn in _active_connections:
            _active_connections.remove(conn)


@agent_bp.route("/ws/events")
def agent_events_ws():
    from flask import Response
    import json

    def event_stream():
        import queue

        q = queue.Queue()
        register_connection(q)
        try:
            yield 'data: {"type": "connected", "message": "WebSocket connected"}\n\n'
            while True:
                try:
                    event = q.get(timeout=30)
                    yield f"data: {json.dumps(event)}\n\n"
                except queue.Empty:
                    yield 'data: {"type": "ping"}\n\n'
        finally:
            unregister_connection(q)

    return Response(
        event_stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@agent_bp.route("/events/emit", methods=["POST"])
def emit_agent_event():
    data = request.get_json(force=True) or {}
    event_type = data.get("event_type", "AGENT_ACTIVITY")
    broadcast_event(event_type, data)
    return jsonify({"status": "emitted", "connections": len(_active_connections)})


@agent_bp.route("/connections", methods=["GET"])
def get_connection_count():
    with _connection_lock:
        count = len(_active_connections)
    return jsonify({"active_connections": count})


@agent_bp.route("/", methods=["GET"])
def fetch_agents():
    specialization = request.args.get("specialization")
    status = request.args.get("status")

    all_agents = list_agents()

    if specialization:
        all_agents = [
            a for a in all_agents if a.get("specialization") == specialization
        ]
    if status:
        all_agents = [a for a in all_agents if a.get("status") == status]

    return jsonify(all_agents)


@agent_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    limit = int(request.args.get("limit", "10"))
    board = get_leaderboard()
    return jsonify(board[:limit])


@agent_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True) or {}

    if not data.get("name"):
        return jsonify({"error": "Agent name is required"}), 400
    if not data.get("creator_wallet"):
        return jsonify({"error": "Creator wallet address is required"}), 400

    result = register_agent(data)

    broadcast_event(
        "AGENT_REGISTERED",
        {
            "agent_id": result["agent"]["id"],
            "name": result["agent"]["name"],
            "creator_wallet": result["agent"]["creator_wallet"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    return jsonify(result)


@agent_bp.route("/<agent_id>", methods=["GET"])
def get_agent(agent_id):
    if agent_id not in agents:
        return jsonify({"error": "Agent not found"}), 404

    from controllers.agent_controller import serialize_agent

    return jsonify(serialize_agent(agent_id))


@agent_bp.route("/<agent_id>/history", methods=["GET"])
def history(agent_id):
    try:
        return jsonify(get_agent_history(agent_id))
    except KeyError:
        return jsonify({"error": "Agent not found"}), 404


@agent_bp.route("/<agent_id>/trigger", methods=["POST"])
def trigger(agent_id):
    if agent_id not in agents:
        return jsonify({"error": "Agent not found"}), 404

    market = request.get_json(force=True) or {}

    if not market:
        return jsonify({"error": "Market data required"}), 400

    try:
        result = trigger_agent(agent_id, market)

        broadcast_event(
            "AGENT_TRIGGERED",
            {
                "agent_id": agent_id,
                "agent_name": agents[agent_id].get("name"),
                "market_id": market.get("id"),
                "decision": result.get("decision"),
                "amount": result.get("amount"),
                "reasoning": result.get("reasoning"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to trigger agent {agent_id}: {e}")
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/<agent_id>/webhook-trigger", methods=["POST"])
def webhook_trigger(agent_id):
    if agent_id not in agents:
        return jsonify({"error": "Agent not found"}), 404

    agent = agents[agent_id]
    market = request.get_json(force=True) or {}

    if not market:
        return jsonify({"error": "Market data required"}), 400

    try:
        decision = run_agent(agent, market)

        broadcast_event(
            "AGENT_WEBHOOK_TRIGGER",
            {
                "agent_id": agent_id,
                "agent_name": agent.get("name"),
                "market_id": market.get("id"),
                "asset": market.get("ticker"),
                "decision": decision.get("decision"),
                "amount": decision.get("amount"),
                "reasoning": decision.get("reasoning"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

        return jsonify(
            {
                "agent_id": agent_id,
                **decision,
            }
        )
    except Exception as e:
        logger.error(f"Failed to trigger agent webhook {agent_id}: {e}")
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/broadcast/new-market", methods=["POST"])
def broadcast_new_market():
    market = request.get_json(force=True) or {}

    if not market.get("id"):
        return jsonify({"error": "Market data required"}), 400

    broadcast_event(
        "NEW_MARKET",
        {
            "market_id": market.get("id"),
            "asset": market.get("ticker"),
            "question": market.get("question"),
            "open_price": market.get("open_price"),
            "closes_at": market.get("closes_at"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    return jsonify({"status": "broadcast", "recipients": len(_active_connections)})


@agent_bp.route("/<agent_id>/stats", methods=["GET"])
def get_agent_stats(agent_id):
    if agent_id not in agents:
        return jsonify({"error": "Agent not found"}), 404

    from controllers.agent_controller import serialize_agent

    agent = serialize_agent(agent_id)

    return jsonify(
        {
            "agent_id": agent_id,
            "name": agent.get("name"),
            "win_rate": agent.get("win_rate", 0),
            "roi": agent.get("roi", 0),
            "total_bets": agent.get("total_bets", 0),
            "total_profit_algo": agent.get("total_profit_algo", 0),
            "total_volume_algo": agent.get("total_volume_algo", 0),
            "wins": agent.get("wins", 0),
            "losses": agent.get("losses", 0),
        }
    )
