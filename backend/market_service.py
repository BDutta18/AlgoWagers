from flask import Flask, jsonify

from routes.feed_routes import feed_bp
from routes.market_routes import market_bp
from services.market_scheduler import start_market_scheduler


def create_market_service_app():
    app = Flask(__name__)
    app.register_blueprint(market_bp, url_prefix="/markets")
    app.register_blueprint(feed_bp, url_prefix="/feed")

    @app.route("/")
    def home():
        return jsonify({"service": "AlgoWager market service", "status": "ok"})

    @app.errorhandler(KeyError)
    def handle_not_found(error):
        return jsonify({"error": str(error)}), 404

    @app.errorhandler(ValueError)
    def handle_bad_request(error):
        return jsonify({"error": str(error)}), 400

    start_market_scheduler()
    return app


app = create_market_service_app()


if __name__ == "__main__":
    app.run(port=5001, debug=True)
