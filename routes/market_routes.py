from flask import Blueprint, request
from controllers.market_controller import (
    create_market,
    get_all_markets,
    place_bet,
    resolve_market
)

market_bp = Blueprint("markets", __name__)

@market_bp.route("/", methods=["GET"])
def get_markets():
    return get_all_markets()

@market_bp.route("/create", methods=["POST"])
def create():
    data = request.json
    return create_market(data)

@market_bp.route("/<m_id>/bet", methods=["POST"])
def bet(m_id):
    return place_bet(m_id, request.json)

@market_bp.route("/<m_id>/resolve", methods=["POST"])
def resolve(m_id):
    return resolve_market(m_id)