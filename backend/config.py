import os
from copy import deepcopy

from dotenv import load_dotenv

load_dotenv()

COINGECKO_URL = os.getenv("COINGECKO_BASE_URL", "https://api.coingecko.com/api/v3")
ALPHA_KEY = os.getenv("ALPHA_VANTAGE_KEY", "")
GROQ_KEY = os.getenv("GROQ_API_KEY", "")
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "")
ALGO_COORDINATOR_KEY = os.getenv("ALGO_COORDINATOR_KEY", "")
ALGORAND_NETWORK = os.getenv("ALGORAND_NETWORK", "testnet")
ALGOD_URL = os.getenv("ALGOD_URL", "https://testnet-api.algonode.cloud")
INDEXER_URL = os.getenv("INDEXER_URL", "https://testnet-idx.algonode.cloud")

REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "12"))
PRICE_CACHE_SECONDS = int(os.getenv("PRICE_CACHE_SECONDS", "60"))
ALPHA_VANTAGE_MIN_INTERVAL_SECONDS = int(
    os.getenv("ALPHA_VANTAGE_MIN_INTERVAL_SECONDS", "12")
)
PLATFORM_FEE_BPS = int(os.getenv("PLATFORM_FEE_BPS", "200"))
MARKET_CLOSE_HOUR_UTC = int(os.getenv("MARKET_CLOSE_HOUR_UTC", "12"))
AUTO_CREATE_MARKETS = os.getenv("AUTO_CREATE_MARKETS", "true").lower() == "true"
SCHEDULER_ENABLED = os.getenv("SCHEDULER_ENABLED", "true").lower() == "true"

SUPPORTED_ASSETS = [
    {
        "asset_id": "bitcoin",
        "name": "Bitcoin",
        "ticker": "BTC",
        "market_type": "crypto",
        "price_source": {"kind": "crypto", "id": "bitcoin"},
        "logo": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    },
    {
        "asset_id": "ethereum",
        "name": "Ethereum",
        "ticker": "ETH",
        "market_type": "crypto",
        "price_source": {"kind": "crypto", "id": "ethereum"},
        "logo": "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    },
    {
        "asset_id": "algorand",
        "name": "Algorand",
        "ticker": "ALGO",
        "market_type": "crypto",
        "price_source": {"kind": "crypto", "id": "algorand"},
        "logo": "https://assets.coingecko.com/coins/images/4380/large/download.png",
    },
    {
        "asset_id": "aapl",
        "name": "Apple",
        "ticker": "AAPL",
        "market_type": "stock",
        "price_source": {"kind": "stock", "symbol": "AAPL"},
        "logo": "https://logo.clearbit.com/apple.com",
    },
    {
        "asset_id": "tsla",
        "name": "Tesla",
        "ticker": "TSLA",
        "market_type": "stock",
        "price_source": {"kind": "stock", "symbol": "TSLA"},
        "logo": "https://logo.clearbit.com/tesla.com",
    },
]


def get_supported_assets():
    return deepcopy(SUPPORTED_ASSETS)
