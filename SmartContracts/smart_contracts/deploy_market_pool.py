#!/usr/bin/env python3
"""Deploy MarketPool contract to Algorand testnet"""

import base64
import json
import logging
import os
import time
from pathlib import Path

from algosdk import mnemonic, account, transaction, encoding
from algosdk.v2client import algod

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-10s: %(message)s")
logger = logging.getLogger(__name__)

# Testnet configuration
ALGOD_ENDPOINTS = [
    "https://testnet-api.algonode.cloud",
    "https://testnet-api.4160.nodely.dev",
]
ALGOD_TOKEN = ""


def get_algod_client():
    for endpoint in ALGOD_ENDPOINTS:
        try:
            client = algod.AlgodClient(ALGOD_TOKEN, endpoint)
            client.status()
            logger.info(f"Connected to {endpoint}")
            return client
        except Exception as e:
            logger.warning(f"Failed to connect to {endpoint}: {e}")
            continue
    raise ConnectionError("Could not connect to any Algorand testnet endpoint")


def retry_operation(func, max_retries=3, delay=5):
    """Retry an operation with exponential backoff"""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = delay * (2**attempt)
                logger.warning(f"Operation failed: {e}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise


def load_compiled_teal(artifact_dir: Path):
    """Load pre-compiled TEAL from arc56.json"""
    arc56_files = list(artifact_dir.glob("*.arc56.json"))
    if not arc56_files:
        raise FileNotFoundError(f"No arc56.json found in {artifact_dir}")

    with open(arc56_files[0]) as f:
        arc56 = json.load(f)

    approval_b64 = arc56["byteCode"]["approval"]
    clear_b64 = arc56["byteCode"]["clear"]

    return base64.b64decode(approval_b64), base64.b64decode(clear_b64)


def get_schema_from_arc56(artifact_dir: Path):
    """Get global/local schema from arc56.json"""
    arc56_files = list(artifact_dir.glob("*.arc56.json"))
    with open(arc56_files[0]) as f:
        arc56 = json.load(f)

    schema = arc56["state"]["schema"]
    return (
        schema["global"]["ints"],
        schema["global"]["bytes"],
        schema["local"]["ints"],
        schema["local"]["bytes"],
    )


def get_app_address(app_id: int) -> str:
    """Get application address from app_id"""
    return encoding.encode_address(encoding.checksum(b"appID" + app_id.to_bytes(8, "big")))


def encode_abi_string(s: str) -> bytes:
    """Encode string for ABI (includes 2-byte length prefix)"""
    encoded = s.encode("utf-8")
    return len(encoded).to_bytes(2, "big") + encoded


def encode_abi_uint64(n: int) -> bytes:
    """Encode uint64 for ABI"""
    return n.to_bytes(8, "big")


def deploy_contract(
    client: algod.AlgodClient,
    sender: str,
    private_key: str,
    approval_program: bytes,
    clear_program: bytes,
    global_ints: int,
    global_bytes: int,
    local_ints: int,
    local_bytes: int,
    app_args: list = None,
    extra_pages: int = 0,
):
    """Deploy a contract and return app_id"""

    def _deploy():
        nonlocal client
        try:
            params = client.suggested_params()
        except Exception:
            client = get_algod_client()
            params = client.suggested_params()

        global_schema = transaction.StateSchema(global_ints, global_bytes)
        local_schema = transaction.StateSchema(local_ints, local_bytes)

        txn = transaction.ApplicationCreateTxn(
            sender=sender,
            sp=params,
            on_complete=transaction.OnComplete.NoOpOC,
            approval_program=approval_program,
            clear_program=clear_program,
            global_schema=global_schema,
            local_schema=local_schema,
            app_args=app_args if app_args else [],
            extra_pages=extra_pages,
        )

        signed_txn = txn.sign(private_key)
        tx_id = client.send_transaction(signed_txn)
        logger.info(f"Sent transaction: {tx_id}")

        result = transaction.wait_for_confirmation(client, tx_id, 4)
        app_id = result["application-index"]
        app_address = get_app_address(app_id)

        return app_id, app_address, client

    app_id, app_address, client = retry_operation(_deploy)
    return app_id, app_address, client


def fund_contract(client: algod.AlgodClient, sender: str, private_key: str, receiver: str, amount: int):
    """Send ALGO to contract address"""

    def _fund():
        nonlocal client
        try:
            params = client.suggested_params()
        except Exception:
            client = get_algod_client()
            params = client.suggested_params()

        txn = transaction.PaymentTxn(sender, params, receiver, amount)
        signed_txn = txn.sign(private_key)
        tx_id = client.send_transaction(signed_txn)
        transaction.wait_for_confirmation(client, tx_id, 4)
        logger.info(f"Funded {receiver} with {amount} microAlgos")
        return client

    return retry_operation(_fund)


def main():
    import hashlib

    def get_method_selector(signature: str) -> bytes:
        return hashlib.new("sha512_256", signature.encode()).digest()[:4]

    # Get mnemonic from environment
    deployer_mnemonic = os.environ.get("DEPLOYER_MNEMONIC")
    if not deployer_mnemonic:
        raise ValueError("DEPLOYER_MNEMONIC environment variable not set")

    private_key = mnemonic.to_private_key(deployer_mnemonic)
    sender = account.address_from_private_key(private_key)
    logger.info(f"Deployer address: {sender}")

    client = get_algod_client()

    # Check balance
    account_info = client.account_info(sender)
    balance = account_info.get("amount", 0)
    logger.info(f"Account balance: {balance / 1_000_000} ALGO")

    if balance < 1_000_000:
        logger.error(
            "Insufficient balance. Please fund your account with at least 1 ALGO from https://bank.testnet.algorand.network/"
        )
        return

    artifacts_path = Path(__file__).parent / "artifacts"

    # Deploy MarketPool
    logger.info("Deploying MarketPool...")
    approval, clear = load_compiled_teal(artifacts_path / "market_pool")
    g_ints, g_bytes, l_ints, l_bytes = get_schema_from_arc56(artifacts_path / "market_pool")

    # Get the PlatformRegistry app_id from previous deployment
    # You can pass this as an environment variable or hardcode it
    registry_app_id = int(os.environ.get("REGISTRY_APP_ID", "757520708"))

    # Market pool creation arguments
    # asset_symbol, resolution_price, expiry_ts, registry_app_id
    import time as time_module

    expiry_ts = int(time_module.time()) + (30 * 24 * 60 * 60)  # 30 days from now

    market_pool_args = [
        get_method_selector("create(string,uint64,uint64,uint64)void"),
        encode_abi_string("BTC"),  # asset_symbol
        encode_abi_uint64(50000 * 1_000_000),  # resolution_price (50k USD in micro units)
        encode_abi_uint64(expiry_ts),  # expiry_ts
        encode_abi_uint64(registry_app_id),  # registry_app_id
    ]

    market_pool_app_id, market_pool_address, client = deploy_contract(
        client,
        sender,
        private_key,
        approval,
        clear,
        g_ints,
        g_bytes,
        l_ints,
        l_bytes,
        app_args=market_pool_args,
        extra_pages=1,  # MarketPool might need extra pages
    )
    logger.info(f"MarketPool deployed: app_id={market_pool_app_id}, address={market_pool_address}")

    # Fund MarketPool with 1 ALGO
    client = fund_contract(client, sender, private_key, market_pool_address, 1_000_000)

    logger.info("\n" + "=" * 60)
    logger.info("MARKETPOOL DEPLOYED SUCCESSFULLY!")
    logger.info("=" * 60)
    logger.info(f"MarketPool: app_id={market_pool_app_id}, address={market_pool_address}")
    logger.info(f"Asset Symbol: BTC")
    logger.info(f"Resolution Price: 50000 USD")
    logger.info(f"Expiry: {expiry_ts} (30 days from now)")
    logger.info(f"Registry App ID: {registry_app_id}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
