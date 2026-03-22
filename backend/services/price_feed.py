import logging
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

logger = logging.getLogger(__name__)

_price_cache = {}
_last_stock_call = 0.0
_stock_lock = threading.Lock()

FALLBACK_PRICES = {
    "bitcoin": 67000.0,
    "ethereum": 3500.0,
    "algorand": 0.85,
    "aapl": 175.0,
    "tsla": 250.0,
}


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

    try:
        response = requests.get(
            f"{COINGECKO_URL}/simple/price",
            params={"ids": asset_id, "vs_currencies": "usd"},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        if response.status_code == 429:
            logger.warning(f"CoinGecko rate limited for {asset_id}, using fallback")
            fallback = FALLBACK_PRICES.get(asset_id, 100.0)
            return _cached_set(cache_key, fallback)

        response.raise_for_status()

        payload = response.json()
        if asset_id not in payload or "usd" not in payload[asset_id]:
            raise ValueError(f"CoinGecko did not return a USD price for {asset_id}")

        return _cached_set(cache_key, float(payload[asset_id]["usd"]))

    except requests.exceptions.RequestException as e:
        logger.warning(f"CoinGecko API error for {asset_id}: {e}, using fallback")
        fallback = FALLBACK_PRICES.get(asset_id, 100.0)
        return _cached_set(cache_key, fallback)


def get_stock_price(symbol):
    if not ALPHA_KEY:
        logger.warning(f"No Alpha Vantage key, using fallback for {symbol}")
        fallback = FALLBACK_PRICES.get(symbol.lower(), 100.0)
        cache_key = f"stock:{symbol}"
        return _cached_set(cache_key, fallback)

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

        try:
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

            if response.status_code == 429:
                logger.warning(
                    f"Alpha Vantage rate limited for {symbol}, using fallback"
                )
                fallback = FALLBACK_PRICES.get(symbol.lower(), 100.0)
                return _cached_set(cache_key, fallback)

            response.raise_for_status()
            payload = response.json()
            quote = payload.get("Global Quote", {})
            raw_price = quote.get("05. price")
            if not raw_price:
                note = payload.get("Note") or payload.get("Information") or payload
                logger.warning(
                    f"Alpha Vantage unavailable for {symbol}: {note}, using fallback"
                )
                fallback = FALLBACK_PRICES.get(symbol.lower(), 100.0)
                return _cached_set(cache_key, fallback)

            return _cached_set(cache_key, float(raw_price))

        except requests.exceptions.RequestException as e:
            logger.warning(f"Alpha Vantage API error for {symbol}: {e}, using fallback")
            fallback = FALLBACK_PRICES.get(symbol.lower(), 100.0)
            return _cached_set(cache_key, fallback)


def get_live_price(asset_config):
    source = asset_config["price_source"]
    if source["kind"] == "crypto":
        return get_crypto_price(source["id"])
    if source["kind"] == "stock":
        return get_stock_price(source["symbol"])
    raise ValueError(f"Unsupported price source: {source['kind']}")
