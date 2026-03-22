import os
from copy import deepcopy

from dotenv import load_dotenv

load_dotenv()

COINGECKO_URL = os.getenv("COINGECKO_BASE_URL", "https://api.coingecko.com/api/v3")
ALPHA_KEY = os.getenv("ALPHA_VANTAGE_KEY", "")
GROQ_KEY = os.getenv("GROQ_API_KEY", "")
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "")
PINATA_JWT = os.getenv("PINATA_JWT", "")
IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/"

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
    {
        "asset_id": "india_vs_australia_cricket",
        "name": "India vs Australia (Cricket)",
        "ticker": "INDvsAUS",
        "market_type": "sports",
        "sports_category": "cricket",
        "price_source": {"kind": "sports", "source": "manual"},
        "logo": "https://img.icons8.com/color/96/cricket.png",
    },
    {
        "asset_id": "england_vs_pakistan_cricket",
        "name": "England vs Pakistan (Cricket)",
        "ticker": "ENGvsPAK",
        "market_type": "sports",
        "sports_category": "cricket",
        "price_source": {"kind": "sports", "source": "manual"},
        "logo": "https://img.icons8.com/color/96/cricket.png",
    },
    {
        "asset_id": "mumbai_vs_chennai_super",
        "name": "Mumbai Indians vs Chennai Super Kings",
        "ticker": "MIvsCSK",
        "market_type": "sports",
        "sports_category": "cricket",
        "price_source": {"kind": "sports", "source": "manual"},
        "logo": "https://img.icons8.com/color/96/cricket.png",
    },
    {
        "asset_id": "rcb_vs_mi_ipl",
        "name": "RCB vs Mumbai Indians (IPL)",
        "ticker": "RCBvsMI",
        "market_type": "sports",
        "sports_category": "cricket",
        "price_source": {"kind": "sports", "source": "manual"},
        "logo": "https://img.icons8.com/color/96/cricket.png",
    },
    {
        "asset_id": "manchester_vs_liverpool",
        "name": "Manchester United vs Liverpool",
        "ticker": "MUNvsLIV",
        "market_type": "sports",
        "sports_category": "football",
        "price_source": {"kind": "sports", "source": "manual"},
        "logo": "https://img.icons8.com/color/96/football.png",
    },
    {
        "asset_id": "arsenal_vs_chelsea",
        "name": "Arsenal vs Chelsea",
        "ticker": "ARSvsCHE",
        "market_type": "sports",
        "sports_category": "football",
        "price_source": {"kind": "sports", "source": "manual"},
        "logo": "https://img.icons8.com/color/96/football.png",
    },
    {
        "asset_id": "barcelona_vs_real_madrid",
        "name": "Barcelona vs Real Madrid (El Clasico)",
        "ticker": "BARvsRMA",
        "market_type": "sports",
        "sports_category": "football",
        "price_source": {"kind": "sports", "source": "manual"},
        "logo": "https://img.icons8.com/color/96/football.png",
    },
    {
        "asset_id": "bayern_vs_dortmund",
        "name": "Bayern Munich vs Dortmund",
        "ticker": "BAYvsDOR",
        "market_type": "sports",
        "sports_category": "football",
        "price_source": {"kind": "sports", "source": "manual"},
        "logo": "https://img.icons8.com/color/96/football.png",
    },
]


def get_supported_assets():
    return deepcopy(SUPPORTED_ASSETS)
