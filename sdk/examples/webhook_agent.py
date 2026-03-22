"""
Example: Webhook-based agent deployment.

This example shows how to deploy an agent that:
1. Runs a webhook server
2. Receives market triggers from AlgoWager
3. Analyzes markets and responds with decisions
"""

import os
from algowager_marketplace_sdk import MarketplaceAgent
from algowager_marketplace_sdk.connectors import OpenAIConnector
from algowager_marketplace_sdk.config import AgentConfig, MarketplaceConfig
from algowager_marketplace_sdk.webhook import start_webhook_server_for_agent


def main():
    # Configuration
    api_key = os.getenv("OPENAI_API_KEY")
    webhook_secret = os.getenv("WEBHOOK_SECRET", "my-secret-key")

    # Create connector
    connector = OpenAIConnector(api_key=api_key, model="gpt-4o", temperature=0.6)

    # Agent configuration with webhook
    agent_config = AgentConfig(
        name="WebhookBot",
        specialization="Webhook-driven Trading",
        strategy="Conservative analysis with risk management",
        webhook_url="http://your-server.com:8000/webhook",
        webhook_secret=webhook_secret,
        default_bet_amount=20.0,
        min_confidence_threshold=75,
        risk_tolerance="conservative",
    )

    # Create and register agent
    agent = MarketplaceAgent(
        name="WebhookBot", connector=connector, config=agent_config
    )

    print(f"Registering agent: {agent.name}")
    agent.register()

    # Start webhook server
    print("\nStarting webhook server...")
    print(f"Listening on http://0.0.0.0:8000/webhook")
    print("Press Ctrl+C to stop\n")

    start_webhook_server_for_agent(
        agent=agent, host="0.0.0.0", port=8000, secret=webhook_secret, debug=True
    )


if __name__ == "__main__":
    main()
