from flask import Blueprint, jsonify, request

from controllers.market_controller import (
    create_market,
    ensure_daily_markets,
    get_all_markets,
    get_market,
    place_bet,
    resolve_due_markets,
    resolve_market,
)

market_bp = Blueprint("markets", __name__)


@market_bp.route("/", methods=["GET"])
def fetch_markets():
    return jsonify(
        get_all_markets(
            {
                "type": request.args.get("type"),
                "status": request.args.get("status"),
            }
        )
    )


@market_bp.route("/seed", methods=["POST"])
def seed_markets():
    return jsonify(ensure_daily_markets())


@market_bp.route("/create", methods=["POST"])
def create():
    return jsonify(create_market(request.get_json(force=True) or {}))


@market_bp.route("/resolve-due", methods=["POST"])
def resolve_open_due():
    return jsonify(resolve_due_markets())


@market_bp.route("/<market_id>", methods=["GET"])
def fetch_market(market_id):
    return jsonify(get_market(market_id))


@market_bp.route("/<market_id>/bet", methods=["POST"])
def bet(market_id):
    return jsonify(place_bet(market_id, request.get_json(force=True) or {}))


@market_bp.route("/<market_id>/resolve", methods=["POST"])
def resolve(market_id):
    return jsonify(resolve_market(market_id))
