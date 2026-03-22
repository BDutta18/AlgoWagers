"""
Configuration management for AlgoWager Marketplace agents.
"""

import os
import json
from typing import Optional, Dict, Any, Literal
from dataclasses import dataclass, field, asdict
from pathlib import Path


@dataclass
class MarketplaceConfig:
    """Configuration for AlgoWager marketplace connection."""

    # API endpoints
    api_base_url: str = "http://127.0.0.1:5001"
    sse_endpoint: str = "/agents/ws/events"

    # Algorand network settings
    algorand_network: Literal["mainnet", "testnet", "betanet"] = "testnet"
    algod_url: str = "https://testnet-api.algonode.cloud"
    indexer_url: str = "https://testnet-idx.algonode.cloud"

    # Agent webhook settings
    webhook_host: str = "0.0.0.0"
    webhook_port: int = 8000
    webhook_path: str = "/webhook"

    @classmethod
    def from_env(cls) -> "MarketplaceConfig":
        """Load configuration from environment variables."""
        network = os.getenv("ALGORAND_NETWORK", "testnet")
        # Validate network value
        if network not in ("mainnet", "testnet", "betanet"):
            network = "testnet"

        return cls(
            api_base_url=os.getenv("ALGOWAGER_API_URL", "http://127.0.0.1:5001"),
            algorand_network=network,  # type: ignore
            algod_url=os.getenv("ALGOD_URL", "https://testnet-api.algonode.cloud"),
            indexer_url=os.getenv("INDEXER_URL", "https://testnet-idx.algonode.cloud"),
            webhook_host=os.getenv("WEBHOOK_HOST", "0.0.0.0"),
            webhook_port=int(os.getenv("WEBHOOK_PORT", "8000")),
        )

    @classmethod
    def from_file(cls, path: str) -> "MarketplaceConfig":
        """Load configuration from JSON file."""
        with open(path, "r") as f:
            data = json.load(f)
        return cls(**data.get("marketplace", {}))

    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary."""
        return asdict(self)


@dataclass
class AgentConfig:
    """Configuration for an AlgoWager agent."""

    # Agent identity
    name: str
    creator_wallet: Optional[str] = None
    specialization: str = "General Trading"
    strategy: str = "Balanced risk/reward analysis"

    # LLM settings
    model_provider: Literal["openai", "anthropic", "groq", "gemini", "local"] = "groq"
    model_name: str = "llama-3.3-70b-versatile"
    api_key: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1000

    # Trading parameters
    default_bet_amount: float = 10.0
    min_confidence_threshold: int = 65
    max_bet_amount: Optional[float] = None
    risk_tolerance: Literal["conservative", "moderate", "aggressive"] = "moderate"

    # Algorand wallet (optional - for on-chain operations)
    algo_private_key: Optional[str] = None

    # Webhook configuration
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None

    # Advanced settings
    enable_logging: bool = True
    log_level: str = "INFO"
    auto_register: bool = True

    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.min_confidence_threshold < 0 or self.min_confidence_threshold > 100:
            raise ValueError("min_confidence_threshold must be between 0 and 100")

        if self.temperature < 0 or self.temperature > 2:
            raise ValueError("temperature must be between 0 and 2")

        if self.default_bet_amount <= 0:
            raise ValueError("default_bet_amount must be positive")

    @classmethod
    def from_env(cls, name: str) -> "AgentConfig":
        """Load agent configuration from environment variables."""
        # Validate model provider
        provider = os.getenv("MODEL_PROVIDER", "groq")
        if provider not in ("openai", "anthropic", "groq", "gemini", "local"):
            provider = "groq"

        # Validate risk tolerance
        risk = os.getenv("RISK_TOLERANCE", "moderate")
        if risk not in ("conservative", "moderate", "aggressive"):
            risk = "moderate"

        return cls(
            name=name,
            creator_wallet=os.getenv("AGENT_WALLET_ADDRESS"),
            specialization=os.getenv("AGENT_SPECIALIZATION", "General Trading"),
            strategy=os.getenv("AGENT_STRATEGY", "Balanced risk/reward analysis"),
            model_provider=provider,  # type: ignore
            model_name=os.getenv("MODEL_NAME", "llama-3.3-70b-versatile"),
            api_key=os.getenv("LLM_API_KEY"),
            default_bet_amount=float(os.getenv("DEFAULT_BET_AMOUNT", "10.0")),
            min_confidence_threshold=int(os.getenv("MIN_CONFIDENCE", "65")),
            risk_tolerance=risk,  # type: ignore
            algo_private_key=os.getenv("ALGO_PRIVATE_KEY"),
            webhook_url=os.getenv("AGENT_WEBHOOK_URL"),
            webhook_secret=os.getenv("WEBHOOK_SECRET"),
        )

    @classmethod
    def from_file(cls, path: str) -> "AgentConfig":
        """Load configuration from JSON file."""
        with open(path, "r") as f:
            data = json.load(f)
        return cls(**data.get("agent", {}))

    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary (excluding sensitive data)."""
        data = asdict(self)
        # Remove sensitive fields
        data.pop("api_key", None)
        data.pop("algo_private_key", None)
        data.pop("webhook_secret", None)
        return data

    def save(self, path: str):
        """Save configuration to JSON file."""
        output_path = Path(path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w") as f:
            json.dump({"agent": asdict(self), "marketplace": {}}, f, indent=2)


def load_config(
    config_path: Optional[str] = None,
) -> tuple[AgentConfig, MarketplaceConfig]:
    """
    Load both agent and marketplace configurations.

    Priority:
    1. Config file (if provided)
    2. Environment variables
    3. Defaults

    Args:
        config_path: Path to JSON config file (optional)

    Returns:
        Tuple of (AgentConfig, MarketplaceConfig)
    """
    if config_path and os.path.exists(config_path):
        with open(config_path, "r") as f:
            data = json.load(f)

        agent_config = AgentConfig(**data.get("agent", {}))
        marketplace_config = MarketplaceConfig(**data.get("marketplace", {}))
    else:
        # Load from environment or use defaults
        agent_name = os.getenv("AGENT_NAME", "DefaultAgent")
        agent_config = AgentConfig.from_env(agent_name)
        marketplace_config = MarketplaceConfig.from_env()

    return agent_config, marketplace_config
