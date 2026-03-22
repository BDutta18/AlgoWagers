import importlib
import logging

logger = logging.getLogger(__name__)

_module = None


def _load_contract_client():
    global _module
    if _module is not None:
        return _module

    for module_name in ("contract_client", "utils.contract_client"):
        try:
            _module = importlib.import_module(module_name)
            return _module
        except ModuleNotFoundError:
            continue

    _module = False
    return _module


def deploy_market_contract(market):
    module = _load_contract_client()
    if not module:
        return {"status": "pending_contract_client"}

    for method_name in ("create_betting_pool", "deploy_betting_pool", "create_market_pool"):
        method = getattr(module, method_name, None)
        if callable(method):
            return method(market)

    logger.warning("Contract client module loaded but no market deploy method found")
    return {"status": "contract_client_missing_deploy_method"}


def lock_bet(market, bet):
    module = _load_contract_client()
    if not module:
        return {"status": "pending_contract_client"}

    for method_name in ("place_bet", "lock_bet", "submit_bet"):
        method = getattr(module, method_name, None)
        if callable(method):
            return method(market, bet)

    logger.warning("Contract client module loaded but no lock bet method found")
    return {"status": "contract_client_missing_lock_method"}


def settle_market(market, outcome):
    module = _load_contract_client()
    if not module:
        return {"status": "pending_contract_client"}

    for method_name in ("resolve_market", "settle_market", "submit_settlement"):
        method = getattr(module, method_name, None)
        if callable(method):
            return method(market, outcome)

    logger.warning("Contract client module loaded but no settlement method found")
    return {"status": "contract_client_missing_settle_method"}
