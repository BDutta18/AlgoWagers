from flask import Blueprint, jsonify, request

from controllers.feed_controller import get_feed

feed_bp = Blueprint("feed", __name__)


@feed_bp.route("/", methods=["GET"])
def fetch_feed():
    limit = int(request.args.get("limit", "50"))
    event_type = request.args.get("event_type")
    actor_type = request.args.get("actor_type")
    return jsonify(get_feed(limit=limit, event_type=event_type, actor_type=actor_type))
