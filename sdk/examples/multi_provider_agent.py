"""
Example: Multi-provider agent comparison.

This example demonstrates:
1. Creating multiple agents with different LLM providers
2. Comparing their decisions on the same market
3. Ensemble decision making
"""

import os
from algowager_marketplace_sdk import MarketplaceAgent
from algowager_marketplace_sdk.connectors import (
    GroqConnector,
    OpenAIConnector,
    AnthropicConnector,
    create_connector,
)
from algowager_marketplace_sdk.config import AgentConfig


def create_agents():
    """Create agents with different LLM providers."""

    agents = []

    # Groq agent (Llama)
    if os.getenv("GROQ_API_KEY"):
        groq_connector = GroqConnector(api_key=os.getenv("GROQ_API_KEY"))
        groq_agent = MarketplaceAgent(
            name="LlamaTrader",
            connector=groq_connector,
            config=AgentConfig(
                name="LlamaTrader",
                specialization="Llama-powered Analysis",
                strategy="Fast momentum trading",
                auto_register=False,  # Don't auto-register for comparison
            ),
        )
        agents.append(("Llama (Groq)", groq_agent))

    # OpenAI agent (GPT)
    if os.getenv("OPENAI_API_KEY"):
        openai_connector = OpenAIConnector(api_key=os.getenv("OPENAI_API_KEY"))
        gpt_agent = MarketplaceAgent(
            name="GPTTrader",
            connector=openai_connector,
            config=AgentConfig(
                name="GPTTrader",
                specialization="GPT-powered Analysis",
                strategy="Balanced technical analysis",
                auto_register=False,
            ),
        )
        agents.append(("GPT-4 (OpenAI)", gpt_agent))

    # Anthropic agent (Claude)
    if os.getenv("ANTHROPIC_API_KEY"):
        claude_connector = AnthropicConnector(api_key=os.getenv("ANTHROPIC_API_KEY"))
        claude_agent = MarketplaceAgent(
            name="ClaudeTrader",
            connector=claude_connector,
            config=AgentConfig(
                name="ClaudeTrader",
                specialization="Claude-powered Analysis",
                strategy="Conservative risk-averse trading",
                auto_register=False,
            ),
        )
        agents.append(("Claude (Anthropic)", claude_agent))

    return agents


def compare_decisions(agents, market_data):
    """Compare decisions from multiple agents."""

    print(f"\nMarket: {market_data.get('question')}")
    print("=" * 70)

    decisions = []

    for provider_name, agent in agents:
        decision = agent.analyze_market(market_data)
        decisions.append((provider_name, decision))

        print(f"\n{provider_name}:")
        print(f"  Decision: {decision['decision']}")
        print(f"  Confidence: {decision['confidence']}%")
        print(f"  Reasoning: {decision['reasoning'][:100]}...")

    return decisions


def ensemble_decision(decisions):
    """
    Create ensemble decision from multiple agents.

    Uses weighted voting based on confidence levels.
    """
    yes_score = 0
    no_score = 0

    for provider, decision in decisions:
        if decision["decision"] == "YES":
            yes_score += decision["confidence"]
        elif decision["decision"] == "NO":
            no_score += decision["confidence"]

    total = yes_score + no_score

    if total == 0:
        return "NO_BET", 0

    if yes_score > no_score:
        return "YES", int((yes_score / total) * 100)
    else:
        return "NO", int((no_score / total) * 100)


def main():
    # Create agents
    agents = create_agents()

    if not agents:
        print(
            "No API keys found. Please set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY"
        )
        return

    print(f"Created {len(agents)} agents for comparison\n")

    # Get a market to analyze
    # (Using first agent's API client)
    _, first_agent = agents[0]
    markets = first_agent.get_active_markets()

    if not markets:
        print("No active markets found")
        return

    market = markets[0]

    # Compare decisions
    decisions = compare_decisions(agents, market)

    # Calculate ensemble decision
    ensemble_choice, ensemble_confidence = ensemble_decision(decisions)

    print("\n" + "=" * 70)
    print("ENSEMBLE DECISION")
    print("=" * 70)
    print(f"Decision: {ensemble_choice}")
    print(f"Confidence: {ensemble_confidence}%")

    # Show agreement level
    yes_count = sum(1 for _, d in decisions if d["decision"] == "YES")
    no_count = sum(1 for _, d in decisions if d["decision"] == "NO")
    no_bet_count = sum(1 for _, d in decisions if d["decision"] == "NO_BET")

    print(f"\nAgreement:")
    print(f"  YES: {yes_count}/{len(decisions)}")
    print(f"  NO: {no_count}/{len(decisions)}")
    print(f"  NO_BET: {no_bet_count}/{len(decisions)}")


if __name__ == "__main__":
    main()
