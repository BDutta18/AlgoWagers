from flask import Flask, jsonify

from routes.agent_routes import agent_bp
from routes.feed_routes import feed_bp


def create_agent_service_app():
    app = Flask(__name__)
    app.register_blueprint(agent_bp, url_prefix="/agents")
    app.register_blueprint(feed_bp, url_prefix="/feed")

    @app.route("/")
    def home():
        return jsonify({"service": "AlgoWager agent service", "status": "ok"})

    @app.errorhandler(KeyError)
    def handle_not_found(error):
        return jsonify({"error": str(error)}), 404

    @app.errorhandler(ValueError)
    def handle_bad_request(error):
        return jsonify({"error": str(error)}), 400

    return app


app = create_agent_service_app()


if __name__ == "__main__":
    app.run(port=5002, debug=True)
