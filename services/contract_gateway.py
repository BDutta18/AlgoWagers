import logging
from utils.contract_client import (
    deploy_betting_pool,
    place_bet,
    settle_market,
    resolve_market,
    submit_settlement,
)

logger = logging.getLogger(__name__)


def deploy_market_contract(market):
    try:
        return deploy_betting_pool(market)
    except Exception as e:
        logger.warning(f"Failed to deploy market contract: {e}")
        return {"status": "contract_unavailable", "error": str(e)}


def lock_bet(market, bet):
    try:
        return place_bet(market, bet)
    except Exception as e:
        logger.warning(f"Failed to lock bet on contract: {e}")
        return {"status": "contract_unavailable", "error": str(e)}


def settle_market_gateway(market, outcome):
    try:
        return settle_market(market, outcome)
    except Exception as e:
        logger.warning(f"Failed to settle market on contract: {e}")
        return {"status": "contract_unavailable", "error": str(e)}
