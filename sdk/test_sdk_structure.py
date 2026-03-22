"""
Test SDK structure and API client without needing LLM API keys.
"""

import sys
import os

# Get the SDK directory (parent of this script)
SDK_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SDK_DIR)

from algowager_marketplace_sdk.api_client import AlgoWagerAPI
from algowager_marketplace_sdk.config import AgentConfig, MarketplaceConfig


def test_api_client():
    """Test API client can connect to backend."""
    print("Testing API Client...")
    print("-" * 50)

    # Create API client
    api = AlgoWagerAPI(base_url="http://127.0.0.1:5001")

    # Test fetching markets
    try:
        markets = api.get_markets()
        print(f"✓ Successfully fetched {len(markets)} markets")

        if markets:
            market = markets[0]
            print(f"  Sample market: {market.get('question')}")
            print(f"  Status: {market.get('status')}")
            print(f"  Type: {market.get('market_type')}")
    except Exception as e:
        print(f"✗ Failed to fetch markets: {e}")
        return False

    # Test fetching agents
    try:
        agents = api.get_agents()
        print(f"✓ Successfully fetched {len(agents)} agents")
    except Exception as e:
        print(f"✗ Failed to fetch agents: {e}")
        return False

    # Test registering an agent
    try:
        agent_data = {
            "name": "TestBot",
            "creator_wallet": "TEST_WALLET_ADDRESS",
            "specialization": "Testing",
            "strategy": "Test strategy",
            "model_name": "test-model",
            "model_provider": "test",
        }
        result = api.register_agent(agent_data)
        print(f"✓ Successfully registered agent: {result.get('id')}")
    except Exception as e:
        print(f"✗ Failed to register agent: {e}")
        return False

    return True


def test_config():
    """Test configuration classes."""
    print("\nTesting Configuration Classes...")
    print("-" * 50)

    # Test AgentConfig
    try:
        config = AgentConfig(
            name="TestAgent",
            creator_wallet="TEST_WALLET",
            specialization="Test",
            strategy="Test strategy",
            default_bet_amount=10.0,
            min_confidence_threshold=70,
            risk_tolerance="moderate",
        )
        print(f"✓ AgentConfig created: {config.name}")
        print(f"  Risk tolerance: {config.risk_tolerance}")
        print(f"  Min confidence: {config.min_confidence_threshold}")
    except Exception as e:
        print(f"✗ Failed to create AgentConfig: {e}")
        return False

    # Test MarketplaceConfig
    try:
        mp_config = MarketplaceConfig(api_base_url="http://127.0.0.1:5001")
        print(f"✓ MarketplaceConfig created")
        print(f"  API URL: {mp_config.api_base_url}")
    except Exception as e:
        print(f"✗ Failed to create MarketplaceConfig: {e}")
        return False

    return True


def test_imports():
    """Test that all SDK modules can be imported."""
    print("\nTesting SDK Imports...")
    print("-" * 50)

    try:
        from algowager_marketplace_sdk import MarketplaceAgent, BaseAgent

        print("✓ Agent classes imported")
    except Exception as e:
        print(f"✗ Failed to import agents: {e}")
        return False

    try:
        from algowager_marketplace_sdk.connectors import (
            GroqConnector,
            OpenAIConnector,
            AnthropicConnector,
            GeminiConnector,
            LocalModelConnector,
        )

        print("✓ All connector classes imported")
    except Exception as e:
        print(f"✗ Failed to import connectors: {e}")
        return False

    try:
        from algowager_marketplace_sdk import utils

        print("✓ Utils module imported")
    except Exception as e:
        print(f"✗ Failed to import utils: {e}")
        return False

    try:
        from algowager_marketplace_sdk.webhook import start_webhook_server_for_agent

        print("✓ Webhook module imported")
    except Exception as e:
        print(f"✗ Failed to import webhook: {e}")
        return False

    return True


def main():
    """Run all tests."""
    print("=" * 50)
    print("AlgoWager SDK Structure Test")
    print("=" * 50)
    print()

    results = []

    # Test imports
    results.append(("Imports", test_imports()))

    # Test configuration
    results.append(("Configuration", test_config()))

    # Test API client
    results.append(("API Client", test_api_client()))

    # Summary
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)

    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name}: {status}")

    all_passed = all(passed for _, passed in results)
    print("\n" + ("=" * 50))
    if all_passed:
        print("✓ ALL TESTS PASSED")
    else:
        print("✗ SOME TESTS FAILED")
    print("=" * 50)

    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
