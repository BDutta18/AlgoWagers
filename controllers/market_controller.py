from datetime import datetime, time, timedelta, timezone
from uuid import uuid4

from config import MARKET_CLOSE_HOUR_UTC, PLATFORM_FEE_BPS, get_supported_assets
from controllers.agent_controller import (
    record_agent_bet,
    record_agent_settlement,
    trigger_active_agents_for_market,
)
from controllers.feed_controller import add_event
from models.market_store import markets
from services.contract_gateway import deploy_market_contract, lock_bet, settle_market
from services.price_feed import get_live_price


def _utc_now():
    return datetime.now(timezone.utc)


def _parse_iso(value):
    if value.endswith("Z"):
        value = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _resolve_time_from_request(close_time=None):
    if close_time:
        return _parse_iso(close_time)

    now = _utc_now()
    today_close = datetime.combine(
        now.date(),
        time(hour=MARKET_CLOSE_HOUR_UTC, minute=0, tzinfo=timezone.utc),
    )
    if now >= today_close:
        return today_close + timedelta(days=1)
    return today_close


def _find_asset(query):
    supported_assets = get_supported_assets()
    normalized = (query or "").strip().lower()
    for asset in supported_assets:
        if normalized in (
            asset["asset_id"],
            asset["ticker"].lower(),
            asset["name"].lower(),
        ):
            return asset
    raise KeyError(f"Unsupported asset '{query}'")


def _calculate_probabilities(market):
    total = market["yes_pool"] + market["no_pool"]
    if total <= 0:
        return 50.0, 50.0
    return (
        round((market["yes_pool"] / total) * 100, 2),
        round((market["no_pool"] / total) * 100, 2),
    )


def _build_asset_config_from_market(market):
    if market["market_type"] == "crypto":
        source = {"kind": "crypto", "id": market["asset_id"]}
    else:
        source = {"kind": "stock", "symbol": market["ticker"]}
    return {"price_source": source}


def _build_market(asset, close_time):
    open_price = get_live_price(asset)
    market = {
        "id": str(uuid4()),
        "asset_id": asset["asset_id"],
        "asset_name": asset["name"],
        "ticker": asset["ticker"],
        "market_type": asset["market_type"],
        "logo": asset["logo"],
        "question": f"Will {asset['ticker']} be higher tomorrow at 12:00 UTC?",
        "open_price": open_price,
        "current_price": open_price,
        "resolve_price": None,
        "yes_pool": 0.0,
        "no_pool": 0.0,
        "total_volume": 0.0,
        "created_at": _utc_now().isoformat(),
        "closes_at": close_time.isoformat(),
        "resolved_at": None,
        "status": "open",
        "outcome": None,
        "contract_refs": {},
        "bets": [],
        "settlement_summary": None,
    }
    market["contract_refs"] = deploy_market_contract(market)
    return market


def _serialize_bet(bet):
    payload = dict(bet)
    payload["amount"] = round(float(payload["amount"]), 6)
    payload["payout"] = round(float(payload.get("payout", 0.0)), 6)
    return payload


def serialize_market(market):
    try:
        if market["status"] == "open":
            market["current_price"] = get_live_price(_build_asset_config_from_market(market))
    except Exception:
        pass

    yes_probability, no_probability = _calculate_probabilities(market)
    closes_at = _parse_iso(market["closes_at"])
    remaining_seconds = max(int((closes_at - _utc_now()).total_seconds()), 0)

    return {
        "id": market["id"],
        "asset_id": market["asset_id"],
        "asset_name": market["asset_name"],
        "ticker": market["ticker"],
        "market_type": market["market_type"],
        "logo": market["logo"],
        "question": market["question"],
        "open_price": round(float(market["open_price"]), 6),
        "current_price": round(float(market["current_price"]), 6),
        "resolve_price": round(float(market["resolve_price"]), 6)
        if market["resolve_price"] is not None
        else None,
        "yes_pool": round(float(market["yes_pool"]), 6),
        "no_pool": round(float(market["no_pool"]), 6),
        "yes_probability": yes_probability,
        "no_probability": no_probability,
        "total_volume": round(float(market["total_volume"]), 6),
        "closes_at": market["closes_at"],
        "time_remaining_seconds": remaining_seconds,
        "status": market["status"],
        "outcome": market["outcome"],
        "created_at": market["created_at"],
        "resolved_at": market["resolved_at"],
        "contract_refs": market["contract_refs"],
        "settlement_summary": market["settlement_summary"],
        "bets": [_serialize_bet(bet) for bet in market["bets"]],
    }


def create_market(data):
    asset = _find_asset(data.get("asset"))
    close_time = _resolve_time_from_request(data.get("close_time"))
    market = _build_market(asset, close_time)
    markets[market["id"]] = market

    add_event(
        {
            "type": "MARKET_CREATED",
            "actor_type": "system",
            "market_id": market["id"],
            "asset": market["ticker"],
            "question": market["question"],
            "open_price": round(float(market["open_price"]), 6),
        }
    )

    auto_decisions = trigger_active_agents_for_market(serialize_market(market))
    for decision in auto_decisions:
        place_bet(
            market["id"],
            {
                "side": decision["decision"],
                "amount": decision["amount"],
                "bettor_type": "agent",
                "bettor_id": decision["agent_id"],
                "reasoning": decision["reasoning"],
            },
        )

    return serialize_market(market)


def ensure_daily_markets():
    created = []
    close_time = _resolve_time_from_request(None)
    existing = {
        (market["asset_id"], market["closes_at"])
        for market in markets.values()
        if market["status"] == "open"
    }

    for asset in get_supported_assets():
        key = (asset["asset_id"], close_time.isoformat())
        if key in existing:
            continue
        created.append(
            create_market({"asset": asset["asset_id"], "close_time": close_time.isoformat()})
        )

    return created


def get_all_markets(filters=None):
    filters = filters or {}
    market_type = filters.get("type")
    status = filters.get("status")

    result = []
    for market in markets.values():
        if market_type and market["market_type"] != market_type:
            continue
        if status and market["status"] != status:
            continue
        result.append(serialize_market(market))

    return sorted(result, key=lambda market: market["closes_at"])


def get_market(market_id):
    if market_id not in markets:
        raise KeyError(f"Market {market_id} not found")
    return serialize_market(markets[market_id])


def _validate_bet(side, amount):
    normalized_side = str(side).upper()
    if normalized_side not in ("YES", "NO"):
        raise ValueError("side must be YES or NO")

    normalized_amount = float(amount)
    if normalized_amount <= 0:
        raise ValueError("amount must be greater than zero")

    return normalized_side, normalized_amount


def _expected_payout(market, side, amount):
    same_pool = market["yes_pool"] if side == "YES" else market["no_pool"]
    opposite_pool = market["no_pool"] if side == "YES" else market["yes_pool"]
    winners_pool_after = same_pool + amount

    if winners_pool_after <= 0:
        return round(amount, 6)

    gross_payout = amount + (amount / winners_pool_after) * opposite_pool
    profit = max(gross_payout - amount, 0.0)
    fee = profit * (PLATFORM_FEE_BPS / 10000)
    return round(amount + profit - fee, 6)


def place_bet(market_id, data):
    if market_id not in markets:
        raise KeyError(f"Market {market_id} not found")

    market = markets[market_id]
    if market["status"] != "open":
        raise ValueError("market is not open")

    side, amount = _validate_bet(data.get("side"), data.get("amount"))
    bettor_type = data.get("bettor_type", "human")
    bettor_id = data.get("bettor_id") or data.get("wallet_address") or str(uuid4())
    created_at = _utc_now().isoformat()

    bet = {
        "id": str(uuid4()),
        "bettor_type": bettor_type,
        "bettor_id": bettor_id,
        "side": side,
        "amount": amount,
        "wallet_address": data.get("wallet_address"),
        "reasoning": data.get("reasoning"),
        "created_at": created_at,
        "status": "locked",
        "payout": 0.0,
    }
    bet["expected_payout"] = _expected_payout(market, side, amount)
    bet["contract_result"] = lock_bet(market, bet)

    market["bets"].append(bet)
    market["total_volume"] += amount
    if side == "YES":
        market["yes_pool"] += amount
    else:
        market["no_pool"] += amount

    if bettor_type == "agent":
        record_agent_bet(bettor_id, market, bet)

    add_event(
        {
            "type": "BET_PLACED",
            "actor_type": bettor_type,
            "market_id": market_id,
            "agent_id": bettor_id if bettor_type == "agent" else None,
            "wallet_address": data.get("wallet_address"),
            "asset": market["ticker"],
            "decision": side,
            "amount": round(amount, 6),
            "reasoning": bet.get("reasoning"),
            "expected_payout": bet["expected_payout"],
        }
    )

    return {
        "message": "bet placed",
        "market": serialize_market(market),
        "bet": _serialize_bet(bet),
    }


def _calculate_payouts(market, outcome):
    winning_pool = market["yes_pool"] if outcome == "YES" else market["no_pool"]
    losing_pool = market["no_pool"] if outcome == "YES" else market["yes_pool"]
    fee_rate = PLATFORM_FEE_BPS / 10000
    settlement = []

    for bet in market["bets"]:
        if bet["side"] != outcome:
            bet["status"] = "lost"
            bet["payout"] = 0.0
            settlement.append(bet)
            continue

        share = bet["amount"] / winning_pool if winning_pool else 0.0
        gross_profit = losing_pool * share
        fee = gross_profit * fee_rate
        payout = bet["amount"] + gross_profit - fee

        bet["status"] = "won"
        bet["payout"] = round(payout, 6)
        settlement.append(bet)

    return settlement


def resolve_market(market_id):
    if market_id not in markets:
        raise KeyError(f"Market {market_id} not found")

    market = markets[market_id]
    if market["status"] == "resolved":
        return serialize_market(market)

    asset_config = _find_asset(market["asset_id"])
    resolve_price = get_live_price(asset_config)
    outcome = "YES" if resolve_price > market["open_price"] else "NO"

    market["resolve_price"] = resolve_price
    market["current_price"] = resolve_price
    market["outcome"] = outcome
    market["status"] = "resolved"
    market["resolved_at"] = _utc_now().isoformat()

    settlement = _calculate_payouts(market, outcome)
    contract_result = settle_market(market, outcome)

    for bet in settlement:
        if bet["bettor_type"] == "agent":
            record_agent_settlement(
                bet["bettor_id"],
                market,
                bet,
                bet["payout"],
                outcome,
            )

    market["settlement_summary"] = {
        "winning_side": outcome,
        "winning_pool": round(
            float(market["yes_pool"] if outcome == "YES" else market["no_pool"]), 6
        ),
        "losing_pool": round(
            float(market["no_pool"] if outcome == "YES" else market["yes_pool"]), 6
        ),
        "contract_result": contract_result,
    }

    add_event(
        {
            "type": "MARKET_RESOLVED",
            "actor_type": "system",
            "market_id": market_id,
            "asset": market["ticker"],
            "outcome": outcome,
            "open_price": round(float(market["open_price"]), 6),
            "resolve_price": round(float(resolve_price), 6),
        }
    )

    return serialize_market(market)


def resolve_due_markets():
    resolved = []
    now = _utc_now()
    for market_id, market in list(markets.items()):
        if market["status"] != "open":
            continue
        if _parse_iso(market["closes_at"]) <= now:
            resolved.append(resolve_market(market_id))
    return resolved
