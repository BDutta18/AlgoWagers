import logging
import os
import time
from typing import Optional

from algosdk import account, mnemonic, encoding, logic
from algosdk.transaction import (
    ApplicationCallTxn,
    ApplicationCreateTxn,
    ApplicationDeleteTxn,
    ApplicationOptInTxn,
    ApplicationUpdateTxn,
    OnComplete,
    PaymentTxn,
    StateSchema,
)
from algosdk.v2client import algod as algosdk_client, indexer as idx_client

get_application_address = logic.get_application_address

from config import ALGOD_URL, INDEXER_URL

ALGO_MNEMONIC = os.getenv("ALGO_MNEMONIC", "")

logger = logging.getLogger(__name__)

_algod_client = None
_indexer_client = None


def get_algod_client():
    global _algod_client
    if _algod_client is None:
        _algod_client = algosdk_client.AlgodClient(
            "", ALGOD_URL, headers={"User-Agent": "AlgoWager/1.0"}
        )
    return _algod_client


def get_indexer_client():
    global _indexer_client
    if _indexer_client is None:
        _indexer_client = idx_client.IndexerClient(
            "", INDEXER_URL, headers={"User-Agent": "AlgoWager/1.0"}
        )
    return _indexer_client


def get_coordinator_wallet():
    if not ALGO_MNEMONIC:
        raise ValueError("ALGO_MNEMONIC is not set in environment")
    return mnemonic.to_private_key(ALGO_MNEMONIC)


def get_coordinator_address():
    private_key = get_coordinator_wallet()
    return account.address_from_private_key(private_key)


def get_account_from_mnemonic(mn):
    return mnemonic.to_private_key(mn), account.address_from_private_key(
        mnemonic.to_private_key(mn)
    )


def create_account():
    private_key, address = account.generate_account()
    return private_key, address


def get_balance(address: str) -> float:
    client = get_algod_client()
    info = client.account_info(address)
    return float(info.get("amount", 0)) / 1_000_000


def wait_for_txn(txn_id: str, timeout: int = 30) -> dict:
    client = get_algod_client()
    start = time.time()
    while True:
        try:
            txn_info = client.pending_transaction_info(txn_id)
            if txn_info.get("confirmed-round"):
                return txn_info
        except Exception:
            pass
        if time.time() - start > timeout:
            raise TimeoutError(f"Transaction {txn_id} not confirmed within {timeout}s")
        time.sleep(0.5)


def send_payment(
    from_private_key: str, to_address: str, amount: float, note: str = ""
) -> dict:
    client = get_algod_client()
    params = client.suggested_params()

    amount_microalgo = int(amount * 1_000_000)
    txn = PaymentTxn(
        sender=account.address_from_private_key(from_private_key),
        sp=params,
        receiver=to_address,
        amt=amount_microalgo,
        note=note.encode() if note else b"",
    )

    signed = txn.sign(from_private_key)
    txid = client.send_transaction(signed)

    result = wait_for_txn(txid)
    return {"txid": txid, "confirmed_round": result.get("confirmed-round")}


def opt_in_to_asset(private_key: str, asset_id: int) -> dict:
    client = get_algod_client()
    params = client.suggested_params()
    address = account.address_from_private_key(private_key)

    txn = AssetTransferTxn(
        sender=address, sp=params, receiver=address, amt=0, index=asset_id
    )

    signed = txn.sign(private_key)
    txid = client.send_transaction(signed)
    return wait_for_txn(txn_id)


def read_global_state(app_id: int, key: str) -> Optional[bytes]:
    client = get_algod_client()
    try:
        info = client.application_info(app_id)
        global_state = info.get("params", {}).get("global-state", [])
        for gs in global_state:
            if gs.get("key") == encoding.decode_address(key)[:32].hex():
                return gs.get("value", {}).get("tb", b"").encode()
        return None
    except Exception as e:
        logger.warning(f"Failed to read global state for app {app_id}: {e}")
        return None


def get_app_by_name(app_name: str) -> Optional[int]:
    indexer = get_indexer_client()
    try:
        results = indexer.search_applications(application_id=0, limit=100)
        for app in results.get("applications", []):
            params = app.get("params", {})
            global_state = params.get("global-state", [])
            for gs in global_state:
                if gs.get("key", "").lower() == "algowager_name":
                    return app.get("id")
    except Exception as e:
        logger.warning(f"Failed to search for app {app_name}: {e}")
    return None


def deploy_contract(
    private_key: str,
    approval_program: bytes,
    clear_program: bytes,
    global_schema: StateSchema,
    local_schema: StateSchema,
    app_args: list = None,
    accounts: list = None,
) -> dict:
    client = get_algod_client()
    params = client.suggested_params()
    sender = account.address_from_private_key(private_key)

    app_args = app_args or []

    txn = ApplicationCreateTxn(
        sender=sender,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        args=app_args,
        accounts=accounts,
    )

    signed = txn.sign(private_key)
    txid = client.send_transaction(signed)
    result = wait_for_txn(txid)

    app_id = result.get("application-index")
    app_address = get_application_address(app_id)

    return {
        "app_id": app_id,
        "app_address": app_address,
        "txid": txid,
        "confirmed_round": result.get("confirmed-round"),
    }


def call_app(
    private_key: str,
    app_id: int,
    app_args: list,
    accounts: list = None,
    local_schema: StateSchema = None,
    opt_in: bool = False,
) -> dict:
    client = get_algod_client()
    params = client.suggested_params()
    sender = account.address_from_private_key(private_key)

    if opt_in:
        txn = ApplicationOptInTxn(
            sender=sender,
            sp=params,
            index=app_id,
        )
    else:
        txn = ApplicationCallTxn(
            sender=sender,
            sp=params,
            index=app_id,
            on_complete=OnComplete.NoOpOC,
            args=app_args,
            accounts=accounts,
            local_schema=local_schema or StateSchema(0, 0),
        )

    signed = txn.sign(private_key)
    txid = client.send_transaction(signed)
    return wait_for_txn(txid)


def update_app(
    private_key: str,
    app_id: int,
    approval_program: bytes,
    clear_program: bytes,
) -> dict:
    client = get_algod_client()
    params = client.suggested_params()
    sender = account.address_from_private_key(private_key)

    txn = ApplicationUpdateTxn(
        sender=sender,
        sp=params,
        index=app_id,
        approval_program=approval_program,
        clear_program=clear_program,
    )

    signed = txn.sign(private_key)
    txid = client.send_transaction(signed)
    return wait_for_txn(txid)


def delete_app(private_key: str, app_id: int) -> dict:
    client = get_algod_client()
    params = client.suggested_params()
    sender = account.address_from_private_key(private_key)

    txn = ApplicationDeleteTxn(
        sender=sender,
        sp=params,
        index=app_id,
    )

    signed = txn.sign(private_key)
    txid = client.send_transaction(signed)
    return wait_for_txn(txid)


def get_application_info(app_id: int) -> dict:
    client = get_algod_client()
    return client.application_info(app_id)


def get_application_state(app_id: int) -> dict:
    indexer = get_indexer_client()
    try:
        result = indexer.application_info(app_id)
        return result.get("params", {}).get("global-state", [])
    except Exception as e:
        logger.warning(f"Failed to get application state for {app_id}: {e}")
        return {}


def read_box(app_id: int, box_name: bytes) -> Optional[bytes]:
    client = get_algod_client()
    try:
        result = client.get_application_box_by_name(app_id, box_name)
        return result.get("value", b"")
    except Exception as e:
        logger.warning(f"Failed to read box {box_name} from app {app_id}: {e}")
        return None


def get_account_info(address: str) -> dict:
    client = get_algod_client()
    return client.account_info(address)


def get_transaction_info(txid: str) -> dict:
    client = get_algod_client()
    return client.pending_transaction_info(txid)


def format_address(addr: str) -> str:
    return encoding.encode_address(encoding.decode_address(addr))
