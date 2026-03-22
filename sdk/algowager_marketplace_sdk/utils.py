"""
Utility functions for AlgoWager SDK.
"""

import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone


logger = logging.getLogger(__name__)


def setup_logging(level: str = "INFO", format_string: Optional[str] = None):
    """
    Setup logging configuration for agent.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format_string: Custom format string (optional)
    """
    if format_string is None:
        format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    logging.basicConfig(level=getattr(logging, level.upper()), format=format_string)


def validate_decision(decision: Dict[str, Any]) -> bool:
    """
    Validate decision output from LLM.

    Args:
        decision: Decision dictionary

    Returns:
        True if valid, False otherwise
    """
    required_keys = [
        "decision",
        "confidence",
        "signals_used",
        "signals_against",
        "reasoning",
    ]

    # Check all required keys are present
    if not all(key in decision for key in required_keys):
        missing = [key for key in required_keys if key not in decision]
        logger.error(f"Decision missing required keys: {missing}")
        return False

    # Validate decision value
    if decision["decision"] not in ["YES", "NO", "NO_BET"]:
        logger.error(f"Invalid decision value: {decision['decision']}")
        return False

    # Validate confidence
    if (
        not isinstance(decision["confidence"], int)
        or not 0 <= decision["confidence"] <= 100
    ):
        logger.error(f"Invalid confidence value: {decision['confidence']}")
        return False

    # Validate lists
    if not isinstance(decision["signals_used"], list) or not isinstance(
        decision["signals_against"], list
    ):
        logger.error("signals_used and signals_against must be lists")
        return False

    # Validate reasoning
    if not isinstance(decision["reasoning"], str) or len(decision["reasoning"]) == 0:
        logger.error("reasoning must be a non-empty string")
        return False

    if len(decision["reasoning"]) > 280:
        logger.warning(
            f"Reasoning exceeds 280 chars ({len(decision['reasoning'])} chars)"
        )

    return True


def format_market_data(market: Dict[str, Any]) -> str:
    """
    Format market data for human-readable output.

    Args:
        market: Market data dictionary

    Returns:
        Formatted string
    """
    return f"""
Market: {market.get("question", "Unknown")}
ID: {market.get("id", "Unknown")}
Type: {market.get("type", "Unknown")}
Status: {market.get("status", "Unknown")}
Asset: {market.get("asset", "N/A")}
Current Price: ${market.get("current_price", "N/A")}
YES Pool: ${market.get("yes_pool", 0):.2f}
NO Pool: ${market.get("no_pool", 0):.2f}
Volume: ${market.get("volume", 0):.2f}
Expires: {market.get("expires_at", "Unknown")}
""".strip()


def format_agent_stats(stats: Dict[str, Any]) -> str:
    """
    Format agent statistics for human-readable output.

    Args:
        stats: Agent statistics dictionary

    Returns:
        Formatted string
    """
    return f"""
Total Bets: {stats.get("total_bets", 0)}
Wins: {stats.get("wins", 0)}
Losses: {stats.get("losses", 0)}
Win Rate: {stats.get("win_rate", 0):.2f}%
Total Wagered: ${stats.get("total_wagered", 0):.2f}
Total Returns: ${stats.get("total_returns", 0):.2f}
ROI: {stats.get("roi", 0):.2f}%
Current Balance: ${stats.get("balance", 0):.2f}
""".strip()


def calculate_kelly_bet(
    win_probability: float, odds: float, bankroll: float, fraction: float = 0.25
) -> float:
    """
    Calculate optimal bet size using Kelly Criterion.

    Args:
        win_probability: Estimated probability of winning (0-1)
        odds: Decimal odds (e.g., 2.0 for even money)
        bankroll: Current bankroll
        fraction: Kelly fraction for conservative betting (default: 0.25 for quarter Kelly)

    Returns:
        Recommended bet size
    """
    if win_probability <= 0 or win_probability >= 1:
        return 0.0

    if odds <= 1:
        return 0.0

    # Kelly formula: f = (bp - q) / b
    # where b = odds - 1, p = win probability, q = 1 - p
    b = odds - 1
    p = win_probability
    q = 1 - p

    kelly_fraction = (b * p - q) / b

    # Apply fractional Kelly for risk management
    kelly_fraction *= fraction

    # Ensure non-negative
    kelly_fraction = max(0, kelly_fraction)

    # Calculate bet size
    bet_size = bankroll * kelly_fraction

    return round(bet_size, 2)


def parse_market_odds(yes_pool: float, no_pool: float) -> Dict[str, float]:
    """
    Calculate implied odds from pool sizes.

    Args:
        yes_pool: Total amount in YES pool
        no_pool: Total amount in NO pool

    Returns:
        Dictionary with implied probabilities and odds
    """
    total_pool = yes_pool + no_pool

    if total_pool == 0:
        return {
            "yes_probability": 0.5,
            "no_probability": 0.5,
            "yes_odds": 2.0,
            "no_odds": 2.0,
        }

    yes_prob = yes_pool / total_pool
    no_prob = no_pool / total_pool

    # Calculate decimal odds (inverse probability)
    yes_odds = 1 / yes_prob if yes_prob > 0 else float("inf")
    no_odds = 1 / no_prob if no_prob > 0 else float("inf")

    return {
        "yes_probability": yes_prob,
        "no_probability": no_prob,
        "yes_odds": yes_odds,
        "no_odds": no_odds,
    }


def timestamp_to_datetime(timestamp: int) -> datetime:
    """
    Convert Unix timestamp to datetime object.

    Args:
        timestamp: Unix timestamp (seconds)

    Returns:
        Datetime object in UTC
    """
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


def datetime_to_timestamp(dt: datetime) -> int:
    """
    Convert datetime object to Unix timestamp.

    Args:
        dt: Datetime object

    Returns:
        Unix timestamp (seconds)
    """
    return int(dt.timestamp())


def safe_json_loads(data: str, default: Any = None) -> Any:
    """
    Safely parse JSON string with fallback.

    Args:
        data: JSON string to parse
        default: Default value if parsing fails

    Returns:
        Parsed data or default value
    """
    try:
        return json.loads(data)
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning(f"Failed to parse JSON: {e}")
        return default


def truncate_string(s: str, max_length: int = 280, suffix: str = "...") -> str:
    """
    Truncate string to maximum length.

    Args:
        s: String to truncate
        max_length: Maximum length
        suffix: Suffix to add when truncated

    Returns:
        Truncated string
    """
    if len(s) <= max_length:
        return s

    return s[: max_length - len(suffix)] + suffix


class PerformanceTracker:
    """Track agent performance metrics."""

    def __init__(self):
        self.bets = []
        self.decisions = []

    def record_decision(self, decision: Dict[str, Any], market_id: str):
        """Record a decision made by the agent."""
        self.decisions.append(
            {
                "timestamp": datetime.now(timezone.utc),
                "market_id": market_id,
                **decision,
            }
        )

    def record_bet(self, market_id: str, side: str, amount: float, confidence: int):
        """Record a bet placed by the agent."""
        self.bets.append(
            {
                "timestamp": datetime.now(timezone.utc),
                "market_id": market_id,
                "side": side,
                "amount": amount,
                "confidence": confidence,
                "result": None,  # To be updated when market resolves
            }
        )

    def record_result(self, market_id: str, won: bool, payout: float):
        """Record the result of a bet."""
        for bet in self.bets:
            if bet["market_id"] == market_id and bet["result"] is None:
                bet["result"] = "win" if won else "loss"
                bet["payout"] = payout
                break

    def get_stats(self) -> Dict[str, Any]:
        """Calculate performance statistics."""
        total_bets = len(self.bets)

        if total_bets == 0:
            return {
                "total_bets": 0,
                "total_decisions": len(self.decisions),
                "win_rate": 0,
                "total_wagered": 0,
                "total_returns": 0,
                "roi": 0,
            }

        wins = sum(1 for bet in self.bets if bet.get("result") == "win")
        losses = sum(1 for bet in self.bets if bet.get("result") == "loss")

        total_wagered = sum(bet["amount"] for bet in self.bets)
        total_returns = sum(bet.get("payout", 0) for bet in self.bets)

        win_rate = (wins / total_bets) * 100 if total_bets > 0 else 0
        roi = (
            ((total_returns - total_wagered) / total_wagered * 100)
            if total_wagered > 0
            else 0
        )

        return {
            "total_bets": total_bets,
            "total_decisions": len(self.decisions),
            "wins": wins,
            "losses": losses,
            "pending": total_bets - wins - losses,
            "win_rate": round(win_rate, 2),
            "total_wagered": round(total_wagered, 2),
            "total_returns": round(total_returns, 2),
            "roi": round(roi, 2),
        }
