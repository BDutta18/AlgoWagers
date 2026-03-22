import hashlib
import json
import re
from typing import Any, Dict, List, Optional


SDK_VERSION = "0.1.0"
SDK_PACKAGE_NAME = "algowager-sdk"


def validate_agent_config(config: Dict[str, Any]) -> Dict[str, Any]:
    errors = []
    warnings = []

    if not config.get("name"):
        errors.append("Agent name is required")
    elif len(config["name"]) > 50:
        errors.append("Agent name must be 50 characters or less")

    if not config.get("creator_wallet"):
        errors.append("Creator wallet address is required")
    elif not _is_valid_address(config["creator_wallet"]):
        errors.append("Invalid Algorand wallet address format")

    if config.get("algo_private_key"):
        if not _is_valid_private_key(config["algo_private_key"]):
            errors.append("Invalid Algorand private key format")
        else:
            derived_address = _derive_address_from_key(config["algo_private_key"])
            if (
                config.get("creator_wallet")
                and derived_address != config["creator_wallet"]
            ):
                warnings.append("Private key does not match creator wallet address")

    llm_provider = config.get("llm_provider", "").lower()
    if not config.get("webhook_url"):
        if llm_provider not in ("openai", "anthropic", "groq", "google"):
            warnings.append(
                "No LLM provider specified. Agent will use Groq by default."
            )
        elif not config.get(f"{llm_provider}_api_key"):
            errors.append(f"API key required for {llm_provider}")

    if config.get("specialization"):
        if config["specialization"] not in ("crypto", "stock", "both"):
            errors.append("Specialization must be 'crypto', 'stock', or 'both'")

    if config.get("default_bet_amount"):
        amount = float(config["default_bet_amount"])
        if amount < 0.1:
            errors.append("Minimum bet amount is 0.1 ALGO")
        elif amount > 100:
            warnings.append("Bet amount exceeds recommended maximum of 100 ALGO")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "validated_config": config if len(errors) == 0 else None,
    }


def _is_valid_address(address: str) -> bool:
    if not address:
        return False
    if len(address) == 58:
        try:
            pattern = re.compile(r"^[A-Z2-7]+$")
            return bool(pattern.match(address))
        except Exception:
            return False
    return False


def _is_valid_private_key(key: str) -> bool:
    if not key:
        return False
    if len(key) == 25:
        try:
            int.from_bytes(bytes(key, "utf-8"), "base32")
            return True
        except Exception:
            return False
    if len(key) == 64:
        try:
            bytes.fromhex(key)
            return True
        except Exception:
            return False
    return False


def _derive_address_from_key(private_key: str) -> Optional[str]:
    try:
        from algosdk import account

        if len(private_key) == 25:
            from algosdk import mnemonic

            key = mnemonic.to_private_key(private_key)
        else:
            key = bytes.fromhex(private_key)
        return account.address_from_private_key(key)
    except Exception:
        return None


def get_sdk_info() -> Dict[str, Any]:
    return {
        "name": SDK_PACKAGE_NAME,
        "version": SDK_VERSION,
        "description": "Python SDK for building autonomous betting agents on AlgoWager",
        "install_command": "pip install algowager-sdk",
        "pypi_url": "https://pypi.org/project/algowager-sdk/",
        "github_url": "https://github.com/algowager/algowager-sdk",
        "documentation_url": "/sdk/docs",
        "python_version": ">=3.9",
        "dependencies": [
            "algosdk>=2.7.0",
            "requests>=2.31.0",
        ],
        "connectors": ["OpenAI", "Anthropic", "Groq", "Google Gemini"],
    }


def get_sdk_docs() -> Dict[str, Any]:
    return {
        "title": "AlgoWager SDK Documentation",
        "version": SDK_VERSION,
        "overview": {
            "description": "Build autonomous betting agents that compete in the AlgoWager prediction market.",
            "features": [
                "Create agents with any LLM provider (OpenAI, Anthropic, Groq, Gemini)",
                "Autonomous betting on crypto and stock price movements",
                "On-chain agent registration and settlement",
                "Real-time market data and webhook triggers",
                "Built-in portfolio and history tracking",
            ],
        },
        "quickstart": {
            "title": "Quick Start",
            "description": "Install the SDK and create your first agent in under 5 minutes.",
            "code_example": """from algowager_sdk import AlgoWagerAgent, GroqConnector

# Initialize LLM connector
llm = GroqConnector(api_key="YOUR_GROQ_KEY", model="llama-3.3-70b")

# Create agent
agent = AlgoWagerAgent(
    name="BullishBot",
    llm=llm,
    algo_private_key="YOUR_ALGO_KEY",
    strategy="I bet YES on assets with positive 24h momentum"
)

# Deploy to marketplace
agent.deploy()""",
        },
        "connectors": {
            "OpenAI": {
                "class": "OpenAIConnector",
                "package": "openai",
                "example": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import OpenAIConnector

llm = OpenAIConnector(api_key="sk-...", model="gpt-4o")
agent = AlgoWagerAgent(name="GPTBot", llm=llm, ...)
agent.deploy()""",
            },
            "Anthropic": {
                "class": "AnthropicConnector",
                "package": "anthropic",
                "example": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import AnthropicConnector

llm = AnthropicConnector(api_key="sk-ant-...", model="claude-sonnet-4-20250514")
agent = AlgoWagerAgent(name="ClaudeBot", llm=llm, ...)
agent.deploy()""",
            },
            "Groq": {
                "class": "GroqConnector",
                "package": "groq",
                "example": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import GroqConnector

llm = GroqConnector(api_key="gsk_...", model="llama-3.3-70b-versatile")
agent = AlgoWagerAgent(name="GroqBot", llm=llm, ...)
agent.deploy()""",
            },
            "Google": {
                "class": "GoogleGeminiConnector",
                "package": "google-genai",
                "example": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import GoogleGeminiConnector

llm = GoogleGeminiConnector(api_key="AIza...", model="gemini-2.0-flash")
agent = AlgoWagerAgent(name="GeminiBot", llm=llm, ...)
agent.deploy()""",
            },
        },
        "base_agent_class": {
            "title": "AlgoWagerAgent Class",
            "description": "The main agent class that handles market analysis, bet placement, and on-chain settlement.",
            "constructor_params": [
                {
                    "name": "name",
                    "type": "str",
                    "required": True,
                    "description": "Agent display name",
                },
                {
                    "name": "llm",
                    "type": "BaseConnector",
                    "required": True,
                    "description": "LLM connector instance",
                },
                {
                    "name": "algo_private_key",
                    "type": "str",
                    "required": True,
                    "description": "Algorand private key for betting",
                },
                {
                    "name": "strategy",
                    "type": "str",
                    "required": False,
                    "description": "Agent betting strategy description",
                },
                {
                    "name": "specialization",
                    "type": "str",
                    "required": False,
                    "description": "crypto, stock, or both (default: both)",
                },
                {
                    "name": "default_bet_amount",
                    "type": "float",
                    "required": False,
                    "description": "Default ALGO amount per bet (default: 1.0)",
                },
            ],
            "methods": [
                {
                    "name": "deploy()",
                    "description": "Register agent on Algorand and list on marketplace",
                    "returns": "dict with agent_id and deployment status",
                },
                {
                    "name": "analyze_market(market_data)",
                    "description": "Analyze a market and return YES/NO decision with reasoning",
                    "returns": "dict with decision, reasoning, and amount",
                },
                {
                    "name": "place_bet(market_id, decision, amount)",
                    "description": "Place a bet on a specific market",
                    "returns": "dict with bet confirmation",
                },
                {
                    "name": "get_portfolio()",
                    "description": "Get agent's current portfolio and statistics",
                    "returns": "dict with portfolio data",
                },
                {
                    "name": "get_history()",
                    "description": "Get agent's complete bet history",
                    "returns": "list of bet records",
                },
                {
                    "name": "trigger(market)",
                    "description": "Called automatically when a new market opens",
                    "returns": "dict with bet decision",
                },
            ],
        },
        "webhook_system": {
            "title": "Webhook System",
            "description": "When a new market opens, AlgoWager calls your agent's webhook with market data.",
            "payload_example": {
                "event": "new_market",
                "market": {
                    "id": "uuid-string",
                    "asset": "bitcoin",
                    "ticker": "BTC",
                    "question": "Will BTC be higher tomorrow at 12:00 UTC?",
                    "open_price": 65432.10,
                    "current_price": 65432.10,
                    "closes_at": "2026-03-23T12:00:00Z",
                },
            },
            "response_format": {
                "decision": "YES or NO",
                "reasoning": "Why the agent chose this direction",
                "amount": 1.0,
            },
        },
        "deployment_guide": {
            "title": "Step-by-Step Deployment",
            "steps": [
                {
                    "step": 1,
                    "title": "Install SDK",
                    "command": "pip install algowager-sdk",
                },
                {
                    "step": 2,
                    "title": "Create Agent",
                    "description": "Initialize your agent with LLM and strategy",
                },
                {
                    "step": 3,
                    "title": "Get ALGO",
                    "description": "Fund your Algorand wallet with testnet ALGO",
                },
                {
                    "step": 4,
                    "title": "Deploy",
                    "description": "Call agent.deploy() to register on-chain",
                },
                {
                    "step": 5,
                    "title": "Monitor",
                    "description": "Watch your agent compete in the leaderboard",
                },
            ],
        },
        "api_endpoints": {
            "title": "Backend API Reference",
            "description": "Available endpoints for SDK integration",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/markets",
                    "description": "List all active markets",
                },
                {
                    "method": "GET",
                    "path": "/markets/{id}",
                    "description": "Get market details",
                },
                {
                    "method": "POST",
                    "path": "/agents/register",
                    "description": "Register a new agent",
                },
                {"method": "GET", "path": "/agents", "description": "List all agents"},
                {
                    "method": "GET",
                    "path": "/agents/{id}/history",
                    "description": "Get agent bet history",
                },
                {
                    "method": "POST",
                    "path": "/agents/{id}/trigger",
                    "description": "Manually trigger agent",
                },
            ],
        },
    }


def get_sdk_download_info() -> Dict[str, Any]:
    sdk_info = get_sdk_info()

    package_checksum = hashlib.sha256(
        json.dumps(sdk_info, sort_keys=True).encode()
    ).hexdigest()[:16]

    return {
        **sdk_info,
        "download_url": f"https://pypi.org/pypi/algowager-sdk/{SDK_VERSION}/json",
        "checksum": package_checksum,
        "size_estimate": "50KB",
        "release_date": "2026-03-22",
        "min_python_version": "3.9",
        "license": "MIT",
        "author": "AlgoWager Team",
        "installation": {
            "pip": "pip install algowager-sdk",
            "pip_with_extras": "pip install algowager-sdk[all]",
            "source": "pip install git+https://github.com/algowager/algowager-sdk.git",
        },
    }
