"""
API client for interacting with AlgoWager marketplace backend.
"""

# type: ignore - API returns both lists and dicts dynamically

import requests
import json
import logging
from typing import Dict, Any, List, Optional, Literal, Union
from urllib.parse import urljoin


logger = logging.getLogger(__name__)


class AlgoWagerAPI:
    """
    Client for AlgoWager marketplace API.

    Provides methods to interact with markets, agents, and the activity feed.
    """

    def __init__(self, base_url: str = "http://127.0.0.1:5001", timeout: int = 30):
        """
        Initialize API client.

        Args:
            base_url: Base URL of the AlgoWager API
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(
            {"Content-Type": "application/json", "User-Agent": "AlgoWager-SDK/1.0.0"}
        )

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """Make HTTP request to API."""
        url = urljoin(self.base_url, endpoint)

        try:
            response = self.session.request(
                method=method, url=url, json=data, params=params, timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {method} {url} - {e}")
            raise

    # ========== MARKET ENDPOINTS ==========

    def get_markets(
        self, market_type: Optional[str] = None, status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch all markets with optional filters.

        Args:
            market_type: Filter by market type (e.g., "crypto", "stock")
            status: Filter by status (e.g., "active", "resolved")

        Returns:
            List of market objects
        """
        params = {}
        if market_type:
            params["type"] = market_type
        if status:
            params["status"] = status

        return self._request("GET", "/markets/", params=params)  # type: ignore

    def get_market(self, market_id: str) -> Dict[str, Any]:
        """
        Get specific market by ID.

        Args:
            market_id: Market identifier

        Returns:
            Market object
        """
        return self._request("GET", f"/markets/{market_id}")  # type: ignore

    def create_market(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new market.

        Args:
            market_data: Market configuration

        Returns:
            Created market object
        """
        return self._request("POST", "/markets/create", data=market_data)

    def place_bet(
        self,
        market_id: str,
        side: Literal["YES", "NO"],
        amount: float,
        agent_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Place a bet on a market.

        Args:
            market_id: Market identifier
            side: Bet direction ("YES" or "NO")
            amount: Bet amount
            agent_id: Agent placing the bet (optional)

        Returns:
            Bet confirmation
        """
        data = {"side": side, "amount": amount}
        if agent_id:
            data["agent_id"] = agent_id

        return self._request("POST", f"/markets/{market_id}/bet", data=data)

    def resolve_market(
        self, market_id: str, outcome: Optional[Literal["YES", "NO"]] = None
    ) -> Dict[str, Any]:
        """
        Resolve a market.

        Args:
            market_id: Market identifier
            outcome: Manual outcome override (optional)

        Returns:
            Resolution result
        """
        data = {}
        if outcome:
            data["outcome"] = outcome

        return self._request("POST", f"/markets/{market_id}/resolve", data=data)

    # ========== AGENT ENDPOINTS ==========

    def get_agents(
        self, specialization: Optional[str] = None, status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch all agents with optional filters.

        Args:
            specialization: Filter by specialization
            status: Filter by status

        Returns:
            List of agent objects
        """
        params = {}
        if specialization:
            params["specialization"] = specialization
        if status:
            params["status"] = status

        return self._request("GET", "/agents/", params=params)

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Get specific agent by ID.

        Args:
            agent_id: Agent identifier

        Returns:
            Agent object
        """
        return self._request("GET", f"/agents/{agent_id}")

    def register_agent(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a new agent in the marketplace.

        Args:
            agent_data: Agent configuration including:
                - name: Agent name
                - creator_wallet: Wallet address
                - specialization: Trading specialization
                - strategy: Trading strategy description
                - webhook_url: Webhook endpoint (optional)
                - api_key: API key for authentication (optional)
                - model: LLM model name (optional)
                - default_bet_amount: Default bet size (optional)

        Returns:
            Registered agent object with assigned ID
        """
        return self._request("POST", "/agents/register", data=agent_data)

    def get_agent_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get agent leaderboard.

        Args:
            limit: Number of top agents to return

        Returns:
            List of top performing agents
        """
        params = {"limit": limit}
        return self._request("GET", "/agents/leaderboard", params=params)

    def get_agent_history(self, agent_id: str) -> List[Dict[str, Any]]:
        """
        Get agent's betting history.

        Args:
            agent_id: Agent identifier

        Returns:
            List of agent's bets
        """
        return self._request("GET", f"/agents/{agent_id}/history")

    def get_agent_stats(self, agent_id: str) -> Dict[str, Any]:
        """
        Get agent statistics.

        Args:
            agent_id: Agent identifier

        Returns:
            Agent statistics (win rate, ROI, etc.)
        """
        return self._request("GET", f"/agents/{agent_id}/stats")

    def trigger_agent(
        self, agent_id: str, market_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Manually trigger an agent to make a decision.

        Args:
            agent_id: Agent identifier
            market_data: Market data to analyze (optional)

        Returns:
            Agent decision result
        """
        data = market_data or {}
        return self._request("POST", f"/agents/{agent_id}/trigger", data=data)

    # ========== FEED ENDPOINTS ==========

    def get_feed(
        self,
        limit: Optional[int] = None,
        event_type: Optional[str] = None,
        actor_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get activity feed.

        Args:
            limit: Maximum number of events
            event_type: Filter by event type
            actor_type: Filter by actor type

        Returns:
            List of activity events
        """
        params = {}
        if limit:
            params["limit"] = limit
        if event_type:
            params["event_type"] = event_type
        if actor_type:
            params["actor_type"] = actor_type

        return self._request("GET", "/feed/", params=params)

    # ========== SDK ENDPOINTS ==========

    def get_sdk_info(self) -> Dict[str, Any]:
        """Get SDK metadata and version information."""
        return self._request("GET", "/sdk/info")

    def validate_agent_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate agent configuration.

        Args:
            config: Agent configuration to validate

        Returns:
            Validation result
        """
        return self._request("POST", "/sdk/validate", data=config)

    def get_sse_url(self) -> str:
        """Get Server-Sent Events URL for real-time updates."""
        return urljoin(self.base_url, "/agents/ws/events")

    def close(self):
        """Close the API client session."""
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
