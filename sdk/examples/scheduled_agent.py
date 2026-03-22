"""
Example: Scheduled agent for periodic market analysis.

This example shows:
1. Running agent on a schedule (e.g., every hour)
2. Analyzing all active markets periodically
3. Logging decisions and performance
"""

import os
import time
from datetime import datetime
from algowager_marketplace_sdk import MarketplaceAgent
from algowager_marketplace_sdk.connectors import GroqConnector
from algowager_marketplace_sdk.config import AgentConfig
from algowager_marketplace_sdk.utils import format_agent_stats


def main():
    # Configuration
    interval_seconds = 3600  # Run every hour

    connector = GroqConnector(
        api_key=os.getenv("GROQ_API_KEY"), model="llama-3.3-70b-versatile"
    )

    agent_config = AgentConfig(
        name="ScheduledBot",
        specialization="Scheduled Trading",
        strategy="Hourly market analysis with trend detection",
        default_bet_amount=10.0,
        min_confidence_threshold=70,
        auto_register=True,
    )

    agent = MarketplaceAgent(
        name="ScheduledBot", connector=connector, config=agent_config
    )

    print(f"Starting scheduled agent: {agent.name}")
    print(f"Interval: {interval_seconds}s ({interval_seconds / 60} minutes)")
    print("Press Ctrl+C to stop\n")

    run_count = 0

    try:
        while True:
            run_count += 1
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            print("=" * 70)
            print(f"Run #{run_count} - {timestamp}")
            print("=" * 70)

            # Run one iteration
            results = agent.run_once()

            print(f"\nAnalyzed markets: {len(results)}")

            # Log each decision
            for i, result in enumerate(results, 1):
                decision = result["decision"]
                print(f"\n{i}. Market: {decision.get('market_id', 'unknown')}")
                print(
                    f"   Decision: {decision['decision']} ({decision['confidence']}%)"
                )

                if "bet" in result:
                    print(f"   Bet placed: ${result['bet'].get('amount', 'unknown')}")

            # Show current stats
            stats = agent.get_stats()
            print("\n" + format_agent_stats(stats))

            # Wait for next iteration
            print(f"\nNext run in {interval_seconds}s...")
            time.sleep(interval_seconds)

    except KeyboardInterrupt:
        print("\n\nStopping scheduled agent...")

        # Final statistics
        print("\n" + "=" * 70)
        print("FINAL STATISTICS")
        print("=" * 70)
        print(f"Total runs: {run_count}")
        stats = agent.get_stats()
        print(format_agent_stats(stats))


if __name__ == "__main__":
    main()
