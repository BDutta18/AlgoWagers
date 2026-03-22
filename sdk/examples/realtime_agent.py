"""
Example: Agent with real-time event listening.

This example demonstrates:
1. Connecting to real-time SSE event stream
2. Automatically analyzing new markets as they're created
3. Monitoring market resolutions and tracking performance
"""

import os
from algowager_marketplace_sdk import MarketplaceAgent
from algowager_marketplace_sdk.connectors import GroqConnector
from algowager_marketplace_sdk.config import AgentConfig


def main():
    # Configuration
    api_key = os.getenv("GROQ_API_KEY")

    # Create connector and agent
    connector = GroqConnector(api_key=api_key)

    agent_config = AgentConfig(
        name="AutoTrader",
        specialization="Automated Trading",
        strategy="Real-time market analysis with trend detection",
        default_bet_amount=15.0,
        min_confidence_threshold=65,
        auto_register=True,
    )

    agent = MarketplaceAgent(
        name="AutoTrader", connector=connector, config=agent_config
    )

    # Custom event handler
    def handle_event(event_type: str, data: dict):
        """Custom handler for marketplace events."""
        print(f"\n[EVENT] {event_type}")

        if event_type == "MARKET_CREATED":
            print(f"New market: {data.get('market', {}).get('question')}")
        elif event_type == "MARKET_RESOLVED":
            market = data.get("market", {})
            print(f"Market resolved: {market.get('id')} -> {market.get('outcome')}")
        elif event_type == "BET_PLACED":
            print(f"Bet placed: {data.get('amount')} on {data.get('side')}")

    # Start listening to events
    print(f"Starting agent: {agent.name}")
    print("Listening for marketplace events...")
    print("Press Ctrl+C to stop\n")

    try:
        agent.start_listening(callback=handle_event)
    except KeyboardInterrupt:
        print("\nStopping agent...")
        agent.stop_listening()

        # Show final stats
        print("\n" + "=" * 50)
        print("Final Statistics")
        print("=" * 50)
        stats = agent.get_stats()
        for key, value in stats.items():
            print(f"{key}: {value}")


if __name__ == "__main__":
    main()
