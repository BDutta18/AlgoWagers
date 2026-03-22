import threading
import time

import requests

from config import (
    ALPHA_KEY,
    ALPHA_VANTAGE_MIN_INTERVAL_SECONDS,
    COINGECKO_URL,
    PRICE_CACHE_SECONDS,
    REQUEST_TIMEOUT_SECONDS,
)

_price_cache = {}
_last_stock_call = 0.0
_stock_lock = threading.Lock()


def _cached_get(cache_key):
    entry = _price_cache.get(cache_key)
    if not entry:
        return None
    age = time.time() - entry["fetched_at"]
    if age > PRICE_CACHE_SECONDS:
        return None
    return entry["value"]


def _cached_set(cache_key, value):
    _price_cache[cache_key] = {"value": value, "fetched_at": time.time()}
    return value


def get_crypto_price(asset_id):
    cache_key = f"crypto:{asset_id}"
    cached = _cached_get(cache_key)
    if cached is not None:
        return cached

    response = requests.get(
        f"{COINGECKO_URL}/simple/price",
        params={"ids": asset_id, "vs_currencies": "usd"},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    payload = response.json()
    if asset_id not in payload or "usd" not in payload[asset_id]:
        raise ValueError(f"CoinGecko did not return a USD price for {asset_id}")

    return _cached_set(cache_key, float(payload[asset_id]["usd"]))


def get_stock_price(symbol):
    if not ALPHA_KEY:
        raise ValueError("ALPHA_VANTAGE_KEY is required for stock markets")

    cache_key = f"stock:{symbol}"
    cached = _cached_get(cache_key)
    if cached is not None:
        return cached

    global _last_stock_call
    with _stock_lock:
        now = time.time()
        delay = ALPHA_VANTAGE_MIN_INTERVAL_SECONDS - (now - _last_stock_call)
        if delay > 0:
            time.sleep(delay)

        response = requests.get(
            "https://www.alphavantage.co/query",
            params={
                "function": "GLOBAL_QUOTE",
                "symbol": symbol,
                "apikey": ALPHA_KEY,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        _last_stock_call = time.time()

    response.raise_for_status()
    payload = response.json()
    quote = payload.get("Global Quote", {})
    raw_price = quote.get("05. price")
    if not raw_price:
        note = payload.get("Note") or payload.get("Information") or payload
        raise ValueError(f"Alpha Vantage price unavailable for {symbol}: {note}")

    return _cached_set(cache_key, float(raw_price))


def get_live_price(asset_config):
    source = asset_config["price_source"]
    if source["kind"] == "crypto":
        return get_crypto_price(source["id"])
    if source["kind"] == "stock":
        return get_stock_price(source["symbol"])
    raise ValueError(f"Unsupported price source: {source['kind']}")
