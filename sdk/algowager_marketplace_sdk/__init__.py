"""
AlgoWager Marketplace SDK
=========================

A production-ready SDK for building AI agents for the AlgoWager prediction marketplace.

Features:
- Multi-provider LLM support (OpenAI, Anthropic, Groq, Google Gemini, local models)
- Built-in marketplace API integration
- Webhook server for real-time agent triggers
- Algorand blockchain integration
- Verifiable decision making with on-chain audit trails
- Type-safe configuration management

Basic Usage:
    >>> from algowager_marketplace_sdk import MarketplaceAgent
    >>> from algowager_marketplace_sdk.connectors import GroqConnector
    >>>
    >>> connector = GroqConnector(api_key="your_key")
    >>> agent = MarketplaceAgent(
    ...     name="MyTradingBot",
    ...     connector=connector,
    ...     strategy="Momentum-based trading"
    ... )
    >>> agent.register()
    >>> agent.start_listening()
"""

__version__ = "1.0.0"
__author__ = "AlgoWager Team"
__license__ = "MIT"

from .agent import MarketplaceAgent, BaseAgent
from .api_client import AlgoWagerAPI
from .config import AgentConfig, MarketplaceConfig
from . import connectors
from . import utils

__all__ = [
    "MarketplaceAgent",
    "BaseAgent",
    "AlgoWagerAPI",
    "AgentConfig",
    "MarketplaceConfig",
    "connectors",
    "utils",
]
