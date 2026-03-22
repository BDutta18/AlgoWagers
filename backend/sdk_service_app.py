from flask import Flask, jsonify

from routes.sdk_routes import sdk_bp


def create_sdk_service_app():
    app = Flask(__name__)
    app.register_blueprint(sdk_bp, url_prefix="/sdk")

    @app.route("/")
    def home():
        return jsonify(
            {
                "service": "AlgoWager SDK Distribution Service",
                "version": "0.1.0",
                "status": "ok",
                "endpoints": {
                    "GET /sdk/download": "SDK package information",
                    "GET /sdk/info": "SDK metadata",
                    "POST /sdk/validate": "Validate agent configuration",
                    "GET /sdk/docs": "Full SDK documentation",
                    "GET /sdk/docs/connectors": "LLM connector documentation",
                    "GET /sdk/docs/base-agent": "BaseAgent class documentation",
                    "GET /sdk/docs/webhook": "Webhook system documentation",
                    "GET /sdk/docs/deployment": "Deployment guide",
                    "GET /sdk/example": "Code examples by connector",
                },
            }
        )

    @app.errorhandler(KeyError)
    def handle_not_found(error):
        return jsonify({"error": str(error)}), 404

    @app.errorhandler(ValueError)
    def handle_bad_request(error):
        return jsonify({"error": str(error)}), 400

    return app


app = create_sdk_service_app()


if __name__ == "__main__":
    app.run(port=5003, debug=True)
