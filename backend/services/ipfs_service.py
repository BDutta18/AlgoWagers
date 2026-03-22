import json
import logging
import requests
from config import PINATA_JWT, IPFS_GATEWAY

logger = logging.getLogger(__name__)

PINATA_API_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
PINATA_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"


def pin_json_to_ipfs(data: dict, name: str = "algowager-data") -> dict:
    if not PINATA_JWT:
        logger.warning("PINATA_JWT not configured, skipping IPFS pin")
        return {"status": "skipped", "cid": None, "url": None}

    payload = {
        "pinataContent": data,
        "pinataMetadata": {"name": name},
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {PINATA_JWT}",
    }

    try:
        response = requests.post(PINATA_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        cid = result.get("IpfsHash")
        return {
            "status": "pinned",
            "cid": cid,
            "url": f"{IPFS_GATEWAY}{cid}",
        }
    except Exception as e:
        logger.error(f"Failed to pin JSON to IPFS: {e}")
        return {"status": "error", "error": str(e), "cid": None, "url": None}


def pin_file_to_ipfs(file_content: bytes, file_name: str) -> dict:
    if not PINATA_JWT:
        logger.warning("PINATA_JWT not configured, skipping IPFS pin")
        return {"status": "skipped", "cid": None, "url": None}

    files = {
        "file": (file_name, file_content),
    }
    headers = {
        "Authorization": f"Bearer {PINATA_JWT}",
    }

    try:
        response = requests.post(PINATA_FILE_URL, files=files, headers=headers)
        response.raise_for_status()
        result = response.json()
        cid = result.get("IpfsHash")
        return {
            "status": "pinned",
            "cid": cid,
            "url": f"{IPFS_GATEWAY}{cid}",
        }
    except Exception as e:
        logger.error(f"Failed to pin file to IPFS: {e}")
        return {"status": "error", "error": str(e), "cid": None, "url": None}


def pin_market_metadata(market: dict) -> dict:
    metadata = {
        "market_id": market.get("id"),
        "asset_name": market.get("asset_name"),
        "ticker": market.get("ticker"),
        "market_type": market.get("market_type"),
        "question": market.get("question"),
        "open_price": market.get("open_price"),
        "yes_pool": market.get("yes_pool"),
        "no_pool": market.get("no_pool"),
        "total_volume": market.get("total_volume"),
        "status": market.get("status"),
        "outcome": market.get("outcome"),
        "created_at": market.get("created_at"),
        "resolved_at": market.get("resolved_at"),
        "bets_count": len(market.get("bets", [])),
    }
    return pin_json_to_ipfs(metadata, f"market-{market.get('id')}")


def pin_bet_receipt(bet: dict, market: dict) -> dict:
    receipt = {
        "bet_id": bet.get("id"),
        "market_id": market.get("id"),
        "market_question": market.get("question"),
        "bettor_id": bet.get("bettor_id"),
        "side": bet.get("side"),
        "amount": bet.get("amount"),
        "expected_payout": bet.get("expected_payout"),
        "status": bet.get("status"),
        "payout": bet.get("payout"),
        "created_at": bet.get("created_at"),
        "network": "algorand-testnet",
    }
    return pin_json_to_ipfs(receipt, f"bet-{bet.get('id')}")


def pin_settlement_proof(market: dict, settlement: dict) -> dict:
    proof = {
        "market_id": market.get("id"),
        "market_question": market.get("question"),
        "outcome": market.get("outcome"),
        "resolve_price": market.get("resolve_price"),
        "winning_pool": settlement.get("winning_pool"),
        "losing_pool": settlement.get("losing_pool"),
        "resolved_at": market.get("resolved_at"),
        "total_bets": len(market.get("bets", [])),
        "winning_bettors": sum(
            1 for b in market.get("bets", []) if b.get("side") == market.get("outcome")
        ),
        "network": "algorand-testnet",
    }
    return pin_json_to_ipfs(proof, f"settlement-{market.get('id')}")
