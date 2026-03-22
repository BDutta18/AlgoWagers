"""
Core agent classes for AlgoWager marketplace.
"""

import json
import hashlib
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Callable
from abc import ABC, abstractmethod

from .api_client import AlgoWagerAPI
from .config import AgentConfig, MarketplaceConfig
from .connectors import BaseConnector, create_connector


logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract base class for AlgoWager agents.

    Provides core functionality for market analysis and decision making.
    Subclasses should implement custom analysis logic if needed.
    """

    def __init__(
        self,
        name: str,
        connector: BaseConnector,
        config: Optional[AgentConfig] = None,
        marketplace_config: Optional[MarketplaceConfig] = None,
    ):
        """
        Initialize base agent.

        Args:
            name: Agent name
            connector: LLM connector instance
            config: Agent configuration (optional)
            marketplace_config: Marketplace configuration (optional)
        """
        self.name = name
        self.connector = connector
        self.config = config or AgentConfig(name=name)
        self.marketplace_config = marketplace_config or MarketplaceConfig()

        # Agent state
        self.agent_id: Optional[str] = None
        self.registered = False
        self.is_running = False

        # Statistics
        self.total_decisions = 0
        self.total_bets = 0
        self.wins = 0
        self.losses = 0

        # Setup logging
        if self.config.enable_logging:
            logging.basicConfig(
                level=getattr(logging, self.config.log_level),
                format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            )

    def analyze_market(self, data_bundle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze market data and make a decision.

        Args:
            data_bundle: Market data including prices, indicators, news, etc.

        Returns:
            Decision dict with keys: decision, confidence, signals_used, signals_against, reasoning
        """
        logger.info(
            f"[{self.name}] Analyzing market: {data_bundle.get('market_id', 'unknown')}"
        )

        try:
            # Use LLM connector to generate analysis
            result = self.connector.generate(data_bundle, self.config.strategy)

            # Enforce minimum confidence threshold
            if result.get("confidence", 0) < self.config.min_confidence_threshold:
                logger.info(
                    f"[{self.name}] Confidence {result.get('confidence')}% below threshold {self.config.min_confidence_threshold}%"
                )
                result["decision"] = "NO_BET"

            self.total_decisions += 1

            # Log decision
            logger.info(
                f"[{self.name}] Decision: {result.get('decision')} "
                f"(confidence: {result.get('confidence')}%)"
            )

            return result

        except Exception as e:
            logger.error(f"[{self.name}] Error analyzing market: {e}")
            return {
                "decision": "NO_BET",
                "confidence": 0,
                "signals_used": [],
                "signals_against": [],
                "reasoning": f"Analysis error: {str(e)}",
            }

    def calculate_bet_amount(
        self, confidence: int, balance: Optional[float] = None
    ) -> float:
        """
        Calculate bet amount based on confidence and risk tolerance.

        Args:
            confidence: Confidence level (0-100)
            balance: Current balance (optional)

        Returns:
            Bet amount
        """
        base_amount = self.config.default_bet_amount

        # Scale by confidence (50% at min confidence, 200% at 100% confidence)
        confidence_multiplier = 0.5 + (confidence / 100) * 1.5

        # Apply risk tolerance
        risk_multipliers = {"conservative": 0.5, "moderate": 1.0, "aggressive": 2.0}
        risk_multiplier = risk_multipliers.get(self.config.risk_tolerance, 1.0)

        amount = base_amount * confidence_multiplier * risk_multiplier

        # Apply max bet limit if set
        if self.config.max_bet_amount:
            amount = min(amount, self.config.max_bet_amount)

        # Ensure we don't bet more than balance (if known)
        if balance:
            amount = min(amount, balance * 0.1)  # Max 10% of balance per bet

        return round(amount, 2)

    def hash_reasoning(self, reasoning: str) -> str:
        """
        Create SHA-256 hash of reasoning for on-chain verification.

        Args:
            reasoning: Decision reasoning text

        Returns:
            Hex digest of hash
        """
        return hashlib.sha256(reasoning.encode()).hexdigest()

    @abstractmethod
    def on_market_created(self, market_data: Dict[str, Any]):
        """
        Callback when a new market is created.

        Args:
            market_data: Market information
        """
        pass

    @abstractmethod
    def on_market_resolved(self, market_data: Dict[str, Any]):
        """
        Callback when a market is resolved.

        Args:
            market_data: Market resolution information
        """
        pass


class MarketplaceAgent(BaseAgent):
    """
    Production-ready agent for AlgoWager marketplace.

    Handles registration, market monitoring, betting, and performance tracking.
    """

    def __init__(
        self,
        name: str,
        connector: BaseConnector,
        config: Optional[AgentConfig] = None,
        marketplace_config: Optional[MarketplaceConfig] = None,
        api_client: Optional[AlgoWagerAPI] = None,
    ):
        """
        Initialize marketplace agent.

        Args:
            name: Agent name
            connector: LLM connector instance
            config: Agent configuration
            marketplace_config: Marketplace configuration
            api_client: Custom API client (optional)
        """
        super().__init__(name, connector, config, marketplace_config)

        # Initialize API client
        self.api = api_client or AlgoWagerAPI(
            base_url=self.marketplace_config.api_base_url
        )

    def register(self) -> Dict[str, Any]:
        """
        Register agent with the marketplace.

        Returns:
            Registration response with agent_id
        """
        if self.registered:
            logger.info(f"[{self.name}] Already registered with ID: {self.agent_id}")
            return {"status": "already_registered", "agent_id": self.agent_id}

        logger.info(f"[{self.name}] Registering with marketplace...")

        try:
            # Prepare registration data
            registration_data = {
                "name": self.name,
                "creator_wallet": self.config.creator_wallet,
                "specialization": self.config.specialization,
                "strategy": self.config.strategy,
                "model": self.config.model_name,
                "default_bet_amount": self.config.default_bet_amount,
            }

            # Add webhook URL if configured
            if self.config.webhook_url:
                registration_data["webhook_url"] = self.config.webhook_url

            # Add API key if configured
            if self.config.webhook_secret:
                registration_data["api_key"] = self.config.webhook_secret

            # Register with API
            response = self.api.register_agent(registration_data)

            self.agent_id = response.get("id") or response.get("agent_id")
            self.registered = True

            logger.info(
                f"[{self.name}] Successfully registered with ID: {self.agent_id}"
            )

            return response

        except Exception as e:
            logger.error(f"[{self.name}] Registration failed: {e}")
            raise

    def get_active_markets(self) -> list[Dict[str, Any]]:
        """
        Fetch all active markets from the marketplace.

        Returns:
            List of active market objects
        """
        try:
            markets = self.api.get_markets(status="active")
            logger.info(f"[{self.name}] Found {len(markets)} active markets")
            return markets
        except Exception as e:
            logger.error(f"[{self.name}] Failed to fetch markets: {e}")
            return []

    def analyze_and_bet(
        self, market: Dict[str, Any], auto_bet: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze a market and optionally place a bet.

        Args:
            market: Market data
            auto_bet: Automatically place bet if confident (default: True)

        Returns:
            Bet result or None if no bet placed
        """
        market_id = market.get("id")

        logger.info(f"[{self.name}] Analyzing market: {market_id}")

        # Prepare data bundle for analysis
        data_bundle = {
            "market_id": market_id,
            "question": market.get("question"),
            "asset": market.get("asset"),
            "market_type": market.get("type"),
            "current_price": market.get("current_price"),
            "open_price": market.get("open_price"),
            "yes_pool": market.get("yes_pool"),
            "no_pool": market.get("no_pool"),
            "volume": market.get("volume"),
            "expires_at": market.get("expires_at"),
            **market.get("data", {}),  # Include any additional market data
        }

        # Analyze market
        decision = self.analyze_market(data_bundle)

        # Check if we should bet
        if decision["decision"] == "NO_BET" or not auto_bet:
            logger.info(f"[{self.name}] No bet placed on market {market_id}")
            return None

        # Calculate bet amount
        bet_amount = self.calculate_bet_amount(
            decision["confidence"],
            balance=None,  # Could fetch from wallet if needed
        )

        # Place bet
        try:
            bet_result = self.api.place_bet(
                market_id=market_id,
                side=decision["decision"],
                amount=bet_amount,
                agent_id=self.agent_id,
            )

            self.total_bets += 1

            # Store reasoning hash for verification
            reason_hash = self.hash_reasoning(decision["reasoning"])

            logger.info(
                f"[{self.name}] Placed {decision['decision']} bet of ${bet_amount} "
                f"on market {market_id} (hash: {reason_hash[:8]}...)"
            )

            return {"bet": bet_result, "decision": decision, "reason_hash": reason_hash}

        except Exception as e:
            logger.error(f"[{self.name}] Failed to place bet: {e}")
            return None

    def get_stats(self) -> Dict[str, Any]:
        """
        Get agent statistics from marketplace.

        Returns:
            Statistics dict with performance metrics
        """
        if not self.registered:
            return {
                "total_decisions": self.total_decisions,
                "total_bets": self.total_bets,
                "local_stats_only": True,
            }

        try:
            stats = self.api.get_agent_stats(self.agent_id)
            return stats
        except Exception as e:
            logger.error(f"[{self.name}] Failed to fetch stats: {e}")
            return {}

    def get_history(self) -> list[Dict[str, Any]]:
        """
        Get agent betting history from marketplace.

        Returns:
            List of historical bets
        """
        if not self.registered:
            logger.warning(f"[{self.name}] Agent not registered, no history available")
            return []

        try:
            history = self.api.get_agent_history(self.agent_id)
            return history
        except Exception as e:
            logger.error(f"[{self.name}] Failed to fetch history: {e}")
            return []

    def on_market_created(self, market_data: Dict[str, Any]):
        """
        Handle new market creation event.

        Args:
            market_data: New market information
        """
        logger.info(f"[{self.name}] New market created: {market_data.get('id')}")

        # Optionally analyze and bet on new market automatically
        if self.is_running:
            self.analyze_and_bet(market_data, auto_bet=True)

    def on_market_resolved(self, market_data: Dict[str, Any]):
        """
        Handle market resolution event.

        Args:
            market_data: Resolved market information
        """
        market_id = market_data.get("id")
        outcome = market_data.get("outcome")

        logger.info(f"[{self.name}] Market {market_id} resolved: {outcome}")

        # Update local stats if this was our bet
        # (In production, you'd track which markets you bet on)

    def start_listening(self, callback: Optional[Callable] = None):
        """
        Start listening for real-time market events via SSE.

        Args:
            callback: Optional callback function for custom event handling
        """
        import sseclient
        import requests

        if not self.registered and self.config.auto_register:
            self.register()

        self.is_running = True
        sse_url = self.api.get_sse_url()

        logger.info(f"[{self.name}] Starting SSE listener on {sse_url}")

        try:
            response = requests.get(sse_url, stream=True, timeout=None)
            client = sseclient.SSEClient(response)

            for event in client.events():
                if not self.is_running:
                    break

                try:
                    data = json.loads(event.data)
                    event_type = data.get("type") or data.get("event_type")

                    logger.debug(f"[{self.name}] Received event: {event_type}")

                    # Handle different event types
                    if event_type in ["MARKET_CREATED", "NEW_MARKET"]:
                        self.on_market_created(data.get("market", data))
                    elif event_type == "MARKET_RESOLVED":
                        self.on_market_resolved(data.get("market", data))

                    # Call custom callback if provided
                    if callback:
                        callback(event_type, data)

                except json.JSONDecodeError:
                    logger.warning(f"[{self.name}] Failed to parse event data")
                except Exception as e:
                    logger.error(f"[{self.name}] Error handling event: {e}")

        except KeyboardInterrupt:
            logger.info(f"[{self.name}] Stopping listener...")
            self.is_running = False
        except Exception as e:
            logger.error(f"[{self.name}] SSE connection error: {e}")
            self.is_running = False

    def stop_listening(self):
        """Stop listening for events."""
        self.is_running = False
        logger.info(f"[{self.name}] Stopped listening")

    def run_once(self):
        """
        Run one iteration: fetch active markets and analyze them.

        Useful for scheduled execution without SSE.
        """
        if not self.registered and self.config.auto_register:
            self.register()

        markets = self.get_active_markets()

        results = []
        for market in markets:
            result = self.analyze_and_bet(market, auto_bet=True)
            if result:
                results.append(result)

        return results

    def __enter__(self):
        if self.config.auto_register and not self.registered:
            self.register()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop_listening()
        self.api.close()
