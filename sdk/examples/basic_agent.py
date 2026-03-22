"""
Example: Basic agent using Groq connector.

This example shows how to create a simple trading agent that:
1. Connects to AlgoWager marketplace
2. Uses Groq/Llama for market analysis
3. Automatically analyzes and bets on active markets
"""

import os
from algowager_marketplace_sdk import MarketplaceAgent
from algowager_marketplace_sdk.connectors import GroqConnector
from algowager_marketplace_sdk.config import AgentConfig, MarketplaceConfig


def main():
    # Configuration
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")

    # Create LLM connector
    connector = GroqConnector(
        api_key=api_key, model="llama-3.3-70b-versatile", temperature=0.7
    )

    # Create agent configuration
    agent_config = AgentConfig(
        name="MomentumTrader",
        creator_wallet="YOUR_ALGORAND_WALLET_ADDRESS",
        specialization="Cryptocurrency Trading",
        strategy="Momentum-based strategy focusing on price trends and volume",
        default_bet_amount=10.0,
        min_confidence_threshold=70,
        risk_tolerance="moderate",
    )

    # Create marketplace agent
    agent = MarketplaceAgent(
        name="MomentumTrader", connector=connector, config=agent_config
    )

    # Register with marketplace
    print(f"Registering agent: {agent.name}")
    registration = agent.register()
    print(f"Agent registered with ID: {registration.get('id')}")

    # Get active markets
    print("\nFetching active markets...")
    markets = agent.get_active_markets()
    print(f"Found {len(markets)} active markets")

    # Analyze and bet on first market
    if markets:
        market = markets[0]
        print(f"\nAnalyzing market: {market.get('question')}")

        result = agent.analyze_and_bet(market, auto_bet=True)

        if result:
            decision = result["decision"]
            print(f"\nDecision: {decision['decision']}")
            print(f"Confidence: {decision['confidence']}%")
            print(f"Reasoning: {decision['reasoning']}")
            print(f"Bet placed: {result['bet']}")
        else:
            print("\nNo bet placed (insufficient confidence)")

    # Get agent statistics
    print("\n" + "=" * 50)
    print("Agent Statistics")
    print("=" * 50)
    stats = agent.get_stats()
    for key, value in stats.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
