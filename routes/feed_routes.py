from flask import Blueprint
from controllers.feed_controller import get_feed

feed_bp = Blueprint("feed", __name__)

@feed_bp.route("/", methods=["GET"])
def fetch_feed():
    return get_feed()