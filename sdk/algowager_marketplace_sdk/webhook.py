"""
Webhook server for receiving agent triggers from AlgoWager marketplace.
"""

import hmac
import hashlib
import logging
import json
from typing import Optional, Callable, Dict, Any
from datetime import datetime


logger = logging.getLogger(__name__)


class WebhookServer:
    """
    Flask-based webhook server for agent triggers.

    Receives POST requests from AlgoWager marketplace and triggers agent analysis.
    """

    def __init__(
        self,
        agent_callback: Callable[[Dict[str, Any]], Any],
        secret: Optional[str] = None,
        host: str = "0.0.0.0",
        port: int = 8000,
        path: str = "/webhook",
    ):
        """
        Initialize webhook server.

        Args:
            agent_callback: Function to call when webhook is triggered
            secret: Webhook secret for request validation
            host: Host to bind to
            port: Port to listen on
            path: Webhook endpoint path
        """
        self.agent_callback = agent_callback
        self.secret = secret
        self.host = host
        self.port = port
        self.path = path
        self.app = None

        self._setup_flask()

    def _setup_flask(self):
        """Setup Flask application and routes."""
        try:
            from flask import Flask, request, jsonify

            self.app = Flask(__name__)

            @self.app.route("/health", methods=["GET"])
            def health():
                """Health check endpoint."""
                return jsonify(
                    {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
                )

            @self.app.route(self.path, methods=["POST"])
            def webhook():
                """Webhook endpoint for agent triggers."""
                try:
                    # Verify request signature if secret is configured
                    if self.secret:
                        if not self._verify_signature(request):
                            logger.warning("Invalid webhook signature")
                            return jsonify({"error": "Invalid signature"}), 403

                    # Parse request data
                    data = request.get_json()

                    if not data:
                        return jsonify({"error": "No data provided"}), 400

                    logger.info(
                        f"Received webhook trigger: {data.get('market_id', 'unknown')}"
                    )

                    # Call agent callback
                    result = self.agent_callback(data)

                    return jsonify({"status": "success", "result": result}), 200

                except Exception as e:
                    logger.error(f"Webhook error: {e}")
                    return jsonify({"error": str(e)}), 500

        except ImportError:
            logger.error("Flask not installed. Install with: pip install flask")
            raise

    def _verify_signature(self, request) -> bool:
        """
        Verify request signature using HMAC.

        Args:
            request: Flask request object

        Returns:
            True if signature is valid
        """
        signature = request.headers.get("X-Webhook-Signature")

        if not signature:
            return False

        # Calculate expected signature
        body = request.get_data()
        expected_signature = hmac.new(
            self.secret.encode(), body, hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)

    def run(self, debug: bool = False):
        """
        Start the webhook server.

        Args:
            debug: Enable Flask debug mode
        """
        if not self.app:
            raise RuntimeError("Flask app not initialized")

        logger.info(f"Starting webhook server on {self.host}:{self.port}{self.path}")

        self.app.run(host=self.host, port=self.port, debug=debug)


def create_webhook_handler(agent):
    """
    Create a webhook handler function for an agent.

    Args:
        agent: MarketplaceAgent instance

    Returns:
        Webhook handler function
    """

    def handle_webhook(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle incoming webhook data.

        Args:
            data: Webhook payload

        Returns:
            Agent decision result
        """
        # Extract market data from webhook
        market_data = data.get("market") or data

        # Analyze market
        decision = agent.analyze_market(market_data)

        # Optionally place bet automatically
        if decision["decision"] != "NO_BET":
            bet_amount = agent.calculate_bet_amount(decision["confidence"])

            try:
                bet_result = agent.api.place_bet(
                    market_id=market_data.get("id"),
                    side=decision["decision"],
                    amount=bet_amount,
                    agent_id=agent.agent_id,
                )

                return {
                    "decision": decision,
                    "bet": bet_result,
                    "bet_amount": bet_amount,
                }
            except Exception as e:
                logger.error(f"Failed to place bet: {e}")
                return {"decision": decision, "error": str(e)}

        return {"decision": decision}

    return handle_webhook


def start_webhook_server_for_agent(
    agent,
    host: str = "0.0.0.0",
    port: int = 8000,
    secret: Optional[str] = None,
    debug: bool = False,
):
    """
    Start a webhook server for an agent.

    Args:
        agent: MarketplaceAgent instance
        host: Host to bind to
        port: Port to listen on
        secret: Webhook secret
        debug: Enable debug mode
    """
    handler = create_webhook_handler(agent)
    server = WebhookServer(
        agent_callback=handler,
        secret=secret or agent.config.webhook_secret,
        host=host,
        port=port,
    )

    server.run(debug=debug)
