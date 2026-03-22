#!/usr/bin/env python3
"""Deploy contracts to Algorand testnet using pre-compiled TEAL"""

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

# Testnet configuration - using multiple endpoints for fallback
ALGOD_ENDPOINTS = [
    "https://testnet-api.algonode.cloud",
    "https://testnet-api.4160.nodely.dev",
]
ALGOD_TOKEN = ""


def get_algod_client():
    for endpoint in ALGOD_ENDPOINTS:
        try:
            client = algod.AlgodClient(ALGOD_TOKEN, endpoint)
            # Test connection
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


def load_compiled_teal(artifact_dir: Path, contract_name: str):
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


def call_app(client: algod.AlgodClient, sender: str, private_key: str, app_id: int, app_args: list, boxes: list = None):
    """Call an application method"""

    def _call():
        nonlocal client
        try:
            params = client.suggested_params()
        except Exception:
            client = get_algod_client()
            params = client.suggested_params()

        txn = transaction.ApplicationCallTxn(
            sender=sender,
            sp=params,
            index=app_id,
            on_complete=transaction.OnComplete.NoOpOC,
            app_args=app_args,
            boxes=boxes if boxes else [],
        )
        signed_txn = txn.sign(private_key)
        tx_id = client.send_transaction(signed_txn)
        transaction.wait_for_confirmation(client, tx_id, 4)
        return tx_id, client

    tx_id, client = retry_operation(_call)
    return tx_id, client


def encode_abi_string(s: str) -> bytes:
    """Encode string for ABI (includes 2-byte length prefix)"""
    encoded = s.encode("utf-8")
    return len(encoded).to_bytes(2, "big") + encoded


def arc4_box_key(s: str) -> bytes:
    """Get the box key for an arc4.String (same as encode_abi_string)"""
    return encode_abi_string(s)


def encode_abi_uint64(n: int) -> bytes:
    """Encode uint64 for ABI"""
    return n.to_bytes(8, "big")


def encode_abi_address(addr: str) -> bytes:
    """Encode address for ABI"""
    return encoding.decode_address(addr)


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

    if balance < 3_000_000:
        logger.error(
            "Insufficient balance. Please fund your account with at least 3 ALGO from https://bank.testnet.algorand.network/"
        )
        return

    artifacts_path = Path(__file__).parent / "artifacts"

    # Deploy PlatformRegistry
    logger.info("Deploying PlatformRegistry...")
    approval, clear = load_compiled_teal(artifacts_path / "platform_registry", "PlatformRegistry")
    g_ints, g_bytes, l_ints, l_bytes = get_schema_from_arc56(artifacts_path / "platform_registry")

    registry_app_args = [
        get_method_selector("create(address,uint64)void"),
        encode_abi_address(sender),  # admin
        encode_abi_uint64(100),  # protocol_fee_bps
    ]

    registry_app_id, registry_address, client = deploy_contract(
        client,
        sender,
        private_key,
        approval,
        clear,
        g_ints,
        g_bytes,
        l_ints,
        l_bytes,
        app_args=registry_app_args,
    )
    logger.info(f"PlatformRegistry deployed: app_id={registry_app_id}, address={registry_address}")

    # Fund PlatformRegistry
    client = fund_contract(client, sender, private_key, registry_address, 200_000)

    # Deploy FeeVault
    logger.info("Deploying FeeVault...")
    approval, clear = load_compiled_teal(artifacts_path / "free_vault", "FeeVault")
    g_ints, g_bytes, l_ints, l_bytes = get_schema_from_arc56(artifacts_path / "free_vault")

    fee_vault_app_args = [
        get_method_selector("create(address,address,address,uint64)void"),
        encode_abi_address(sender),  # admin
        encode_abi_address(sender),  # treasury_address
        encode_abi_address(sender),  # rewards_address
        encode_abi_uint64(5000),  # treasury_split_bps
    ]

    fee_vault_app_id, fee_vault_address, client = deploy_contract(
        client,
        sender,
        private_key,
        approval,
        clear,
        g_ints,
        g_bytes,
        l_ints,
        l_bytes,
        app_args=fee_vault_app_args,
    )
    logger.info(f"FeeVault deployed: app_id={fee_vault_app_id}, address={fee_vault_address}")
    client = fund_contract(client, sender, private_key, fee_vault_address, 200_000)

    # Register fee_vault in registry
    logger.info("Registering fee_vault in PlatformRegistry...")
    _, client = call_app(
        client,
        sender,
        private_key,
        registry_app_id,
        app_args=[
            get_method_selector("register_contract(string,uint64)void"),
            encode_abi_string("fee_vault"),
            encode_abi_uint64(fee_vault_app_id),
        ],
        boxes=[(registry_app_id, arc4_box_key("fee_vault"))],
    )

    # Deploy OracleAggregator
    logger.info("Deploying OracleAggregator...")
    approval, clear = load_compiled_teal(artifacts_path / "oracle_aggregator", "OracleAggregator")
    g_ints, g_bytes, l_ints, l_bytes = get_schema_from_arc56(artifacts_path / "oracle_aggregator")

    oracle_app_args = [
        get_method_selector("create(uint64)void"),
        encode_abi_uint64(registry_app_id),
    ]

    oracle_app_id, oracle_address, client = deploy_contract(
        client,
        sender,
        private_key,
        approval,
        clear,
        g_ints,
        g_bytes,
        l_ints,
        l_bytes,
        app_args=oracle_app_args,
    )
    logger.info(f"OracleAggregator deployed: app_id={oracle_app_id}, address={oracle_address}")
    client = fund_contract(client, sender, private_key, oracle_address, 200_000)

    # Register oracle in registry
    logger.info("Registering oracle in PlatformRegistry...")
    _, client = call_app(
        client,
        sender,
        private_key,
        registry_app_id,
        app_args=[
            get_method_selector("register_contract(string,uint64)void"),
            encode_abi_string("oracle"),
            encode_abi_uint64(oracle_app_id),
        ],
        boxes=[(registry_app_id, arc4_box_key("oracle"))],
    )

    # Deploy AgentRegistry
    logger.info("Deploying AgentRegistry...")
    approval, clear = load_compiled_teal(artifacts_path / "agent_registry", "AgentRegistry")
    g_ints, g_bytes, l_ints, l_bytes = get_schema_from_arc56(artifacts_path / "agent_registry")

    agent_app_args = [
        get_method_selector("create(uint64)void"),
        encode_abi_uint64(registry_app_id),
    ]

    agent_app_id, agent_address, client = deploy_contract(
        client,
        sender,
        private_key,
        approval,
        clear,
        g_ints,
        g_bytes,
        l_ints,
        l_bytes,
        app_args=agent_app_args,
    )
    logger.info(f"AgentRegistry deployed: app_id={agent_app_id}, address={agent_address}")
    client = fund_contract(client, sender, private_key, agent_address, 200_000)

    # Register agent_registry in registry
    logger.info("Registering agent_registry in PlatformRegistry...")
    _, client = call_app(
        client,
        sender,
        private_key,
        registry_app_id,
        app_args=[
            get_method_selector("register_contract(string,uint64)void"),
            encode_abi_string("agent_registry"),
            encode_abi_uint64(agent_app_id),
        ],
        boxes=[(registry_app_id, arc4_box_key("agent_registry"))],
    )

    # Deploy MarketFactory
    logger.info("Deploying MarketFactory...")
    approval, clear = load_compiled_teal(artifacts_path / "market_factory", "MarketFactory")
    g_ints, g_bytes, l_ints, l_bytes = get_schema_from_arc56(artifacts_path / "market_factory")

    market_factory_app_args = [
        get_method_selector("create(uint64)void"),
        encode_abi_uint64(registry_app_id),
    ]

    market_factory_app_id, market_factory_address, client = deploy_contract(
        client,
        sender,
        private_key,
        approval,
        clear,
        g_ints,
        g_bytes,
        l_ints,
        l_bytes,
        app_args=market_factory_app_args,
    )
    logger.info(f"MarketFactory deployed: app_id={market_factory_app_id}, address={market_factory_address}")
    client = fund_contract(client, sender, private_key, market_factory_address, 200_000)

    # Register market_factory in registry
    logger.info("Registering market_factory in PlatformRegistry...")
    _, client = call_app(
        client,
        sender,
        private_key,
        registry_app_id,
        app_args=[
            get_method_selector("register_contract(string,uint64)void"),
            encode_abi_string("market_factory"),
            encode_abi_uint64(market_factory_app_id),
        ],
        boxes=[(registry_app_id, arc4_box_key("market_factory"))],
    )

    logger.info("\n" + "=" * 60)
    logger.info("ALL CONTRACTS DEPLOYED SUCCESSFULLY!")
    logger.info("=" * 60)
    logger.info(f"PlatformRegistry: app_id={registry_app_id}, address={registry_address}")
    logger.info(f"FeeVault:         app_id={fee_vault_app_id}, address={fee_vault_address}")
    logger.info(f"OracleAggregator: app_id={oracle_app_id}, address={oracle_address}")
    logger.info(f"AgentRegistry:    app_id={agent_app_id}, address={agent_address}")
    logger.info(f"MarketFactory:    app_id={market_factory_app_id}, address={market_factory_address}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
