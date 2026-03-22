import json
import logging
import time
from typing import Optional

from algosdk import encoding, abi
from algosdk.transaction import (
    ApplicationOptInTxn,
    ApplicationCallTxn,
    StateSchema,
    OnComplete,
    PaymentTxn,
)
from algosdk.account import address_from_private_key

from config import ALGORAND_NETWORK, PLATFORM_FEE_BPS
from utils.algorand_utils import (
    get_algod_client,
    get_indexer_client,
    get_coordinator_address,
    get_coordinator_wallet,
    wait_for_txn,
    get_application_address,
    get_application_info,
    get_application_state,
    send_payment,
)

logger = logging.getLogger(__name__)

PLATFORM_REGISTRY_APP_ID = 757520708
MARKET_FACTORY_APP_ID = 757520819
ORACLE_AGGREGATOR_APP_ID = 757520757
AGENT_REGISTRY_APP_ID = 757520780
FEE_VAULT_APP_ID = 757520732

PLATFORM_REGISTRY_NAME = "algowager_registry"
MARKET_FACTORY_NAME = "algowager_factory"
ORACLE_NAME = "algowager_oracle"
AGENT_REGISTRY_NAME = "algowager_agents"
FEE_VAULT_NAME = "algowager_fee_vault"

AGENT_REGISTRATION_STAKE = 1.0


class ContractClient:
    def __init__(self):
        self.algod = get_algod_client()
        self.indexer = get_indexer_client()
        self.coordinator_address = get_coordinator_address()
        self.coordinator_key = get_coordinator_wallet()
        self._platform_registry_app_id = None
        self._market_factory_app_id = None
        self._oracle_app_id = None
        self._agent_registry_app_id = None
        self._fee_vault_app_id = None

    def _encode_args(self, *args) -> list:
        result = []
        for arg in args:
            if isinstance(arg, str):
                result.append(arg.encode())
            elif isinstance(arg, int):
                result.append(arg.to_bytes(8, "big"))
            elif isinstance(arg, bytes):
                result.append(arg)
            elif isinstance(arg, dict):
                result.append(json.dumps(arg).encode())
            else:
                result.append(str(arg).encode())
        return result

    def _app_call(
        self,
        app_id: int,
        method: str,
        args: list = None,
        opt_in: bool = False,
        payment: dict = None,
    ) -> dict:
        params = self.algod.suggested_params()
        sender = self.coordinator_address

        app_args = self._encode_args(method)
        if args:
            app_args.extend(args)

        if opt_in:
            txn = ApplicationOptInTxn(
                sender=sender,
                sp=params,
                index=app_id,
                args=app_args if app_args else None,
            )
        else:
            local_schema = StateSchema(0, 0)
            if payment:
                txn = PaymentTxn(
                    sender=sender,
                    sp=params,
                    receiver=get_application_address(app_id),
                    amt=int(payment["amount"] * 1_000_000),
                    note=method.encode(),
                )
            else:
                txn = ApplicationCallTxn(
                    sender=sender,
                    sp=params,
                    index=app_id,
                    on_complete=OnComplete.NoOpOC,
                    args=app_args,
                    local_schema=local_schema,
                )

        signed = txn.sign(self.coordinator_key)
        txid = self.algod.send_transaction(signed)
        return wait_for_txn(txid)

    def _get_app_id_by_name(self, name: str) -> Optional[int]:
        try:
            results = self.indexer.search_applications(application_id=0, limit=100)
            for app in results.get("applications", []):
                app_id = app.get("id")
                if app_id:
                    info = self.algod.application_info(app_id)
                    global_state = info.get("params", {}).get("global-state", [])
                    for gs in global_state:
                        key_bytes = bytes.fromhex(gs.get("key", ""))
                        if len(key_bytes) == 32:
                            key = key_bytes.decode("utf-8").rstrip("\x00")
                            if key == "algowager_name":
                                value = gs.get("value", {})
                                stored_name = (
                                    bytes.fromhex(value.get("tb", ""))
                                    .decode("utf-8")
                                    .rstrip("\x00")
                                )
                                if stored_name == name:
                                    return app_id
        except Exception as e:
            logger.warning(f"Failed to find app by name {name}: {e}")
        return None

    def get_platform_registry_app_id(self) -> int:
        if self._platform_registry_app_id:
            return self._platform_registry_app_id
        app_id = self._get_app_id_by_name(PLATFORM_REGISTRY_NAME)
        if app_id:
            self._platform_registry_app_id = app_id
            return app_id
        return PLATFORM_REGISTRY_APP_ID

    def get_market_factory_app_id(self) -> int:
        if self._market_factory_app_id:
            return self._market_factory_app_id
        app_id = self._get_app_id_by_name(MARKET_FACTORY_NAME)
        if app_id:
            self._market_factory_app_id = app_id
            return app_id
        return MARKET_FACTORY_APP_ID

    def get_oracle_app_id(self) -> int:
        if self._oracle_app_id:
            return self._oracle_app_id
        app_id = self._get_app_id_by_name(ORACLE_NAME)
        if app_id:
            self._oracle_app_id = app_id
            return app_id
        return ORACLE_AGGREGATOR_APP_ID

    def get_agent_registry_app_id(self) -> int:
        if self._agent_registry_app_id:
            return self._agent_registry_app_id
        app_id = self._get_app_id_by_name(AGENT_REGISTRY_NAME)
        if app_id:
            self._agent_registry_app_id = app_id
            return app_id
        return AGENT_REGISTRY_APP_ID

    def get_fee_vault_app_id(self) -> int:
        if self._fee_vault_app_id:
            return self._fee_vault_app_id
        app_id = self._get_app_id_by_name(FEE_VAULT_NAME)
        if app_id:
            self._fee_vault_app_id = app_id
            return app_id
        return FEE_VAULT_APP_ID

    def create_market_pool(self, market: dict) -> dict:
        app_id = self.get_market_factory_app_id()

        app_args = self._encode_args(
            "create",
            market["id"],
            market["ticker"],
            market["asset_id"],
            str(market["open_price"]),
            market["closes_at"],
        )

        params = self.algod.suggested_params()
        txn = ApplicationCallTxn(
            sender=self.coordinator_address,
            sp=params,
            index=app_id,
            on_complete=OnComplete.NoOpOC,
            args=app_args,
            local_schema=StateSchema(0, 0),
        )

        signed = txn.sign(self.coordinator_key)
        txid = self.algod.send_transaction(signed)
        result = wait_for_txn(txid)

        new_app_id = result.get("application-index")
        if new_app_id:
            return {
                "status": "deployed",
                "app_id": new_app_id,
                "app_address": get_application_address(new_app_id),
                "txid": txid,
            }

        return {"status": "deployed", "txid": txid}

    def deploy_betting_pool(self, market: dict) -> dict:
        return self.create_market_pool(market)

    def register_market(self, market: dict) -> dict:
        app_id = self.get_market_factory_app_id()
        return self._app_call(
            app_id,
            "register_market",
            [
                market["id"].encode(),
                market["ticker"].encode(),
            ],
        )

    def place_bet(self, market: dict, bet: dict) -> dict:
        market_pool_app_id = market["contract_refs"].get("app_id", 0)

        if not market_pool_app_id:
            logger.warning(f"No market pool app ID found, simulating bet placement")
            return {
                "status": "simulated",
                "message": "Contract not deployed, bet recorded locally",
                "bet_id": bet["id"],
            }

        side = bet["side"].upper()
        amount_micro = int(bet["amount"] * 1_000_000)

        app_args = self._encode_args("place_bet", side, str(amount_micro), bet["id"])

        params = self.algod.suggested_params()

        app_call_txn = ApplicationCallTxn(
            sender=self.coordinator_address,
            sp=params,
            index=market_pool_app_id,
            on_complete=OnComplete.NoOpOC,
            args=app_args,
            local_schema=StateSchema(1, 0),
        )

        payment_txn = PaymentTxn(
            sender=self.coordinator_address,
            sp=params,
            receiver=get_application_address(market_pool_app_id),
            amt=amount_micro,
            note=f"bet:{bet['id']}".encode(),
        )

        signed_app = app_call_txn.sign(self.coordinator_key)
        signed_payment = payment_txn.sign(self.coordinator_key)

        try:
            txid = self.algod.send_transactions([signed_app, signed_payment])
            result = wait_for_txn(txid)
            return {
                "status": "confirmed",
                "txid": txid,
                "confirmed_round": result.get("confirmed-round"),
            }
        except Exception as e:
            logger.error(f"Failed to place bet on-chain: {e}")
            return {
                "status": "simulated",
                "error": str(e),
                "bet_id": bet["id"],
            }

    def lock_bet(self, market: dict, bet: dict) -> dict:
        return self.place_bet(market, bet)

    def get_probability(self, market_pool_app_id: int) -> dict:
        try:
            state = get_application_state(market_pool_app_id)
            yes_pool = 0
            no_pool = 0

            for gs in state:
                key_bytes = bytes.fromhex(gs.get("key", ""))
                if len(key_bytes) == 32:
                    key = key_bytes.decode("utf-8").rstrip("\x00")
                    value = gs.get("value", {})
                    if value.get("tt") == 2:
                        val = int.from_bytes(bytes.fromhex(value.get("tb", "0")), "big")
                    else:
                        val = int.fromhex(value.get("ui", "0"))

                    if key == "yes_pool":
                        yes_pool = val
                    elif key == "no_pool":
                        no_pool = val

            total = yes_pool + no_pool
            if total > 0:
                yes_pct = (yes_pool / total) * 100
                no_pct = (no_pool / total) * 100
            else:
                yes_pct = 50.0
                no_pct = 50.0

            return {
                "yes_pool": yes_pool / 1_000_000,
                "no_pool": no_pool / 1_000_000,
                "yes_probability": round(yes_pct, 2),
                "no_probability": round(no_pct, 2),
            }
        except Exception as e:
            logger.warning(f"Failed to get probability from contract: {e}")
            return {
                "yes_probability": 50.0,
                "no_probability": 50.0,
            }

    def push_price(self, asset: str, price: float, timestamp: int = None) -> dict:
        app_id = self.get_oracle_app_id()
        timestamp = timestamp or int(time.time())

        return self._app_call(
            app_id,
            "push_price",
            [
                asset.encode(),
                str(int(price * 1_000_000)).encode(),
                str(timestamp).encode(),
            ],
        )

    def get_price(self, asset: str) -> dict:
        app_id = self.get_oracle_app_id()

        try:
            result = self._app_call(app_id, "get_price", [asset.encode()])
            return {
                "asset": asset,
                "price": result.get("logs", [b""])[-1] if result.get("logs") else 0,
                "status": "retrieved",
            }
        except Exception as e:
            logger.warning(f"Failed to get price from oracle: {e}")
            return {
                "asset": asset,
                "price": 0,
                "status": "error",
                "error": str(e),
            }

    def settle_market(self, market: dict, outcome: str) -> dict:
        market_pool_app_id = market["contract_refs"].get("app_id", 0)

        if not market_pool_app_id:
            logger.warning(f"No market pool app ID found, simulating settlement")
            return {
                "status": "simulated",
                "outcome": outcome,
                "message": "Contract not deployed, settlement recorded locally",
            }

        try:
            return self._app_call(
                market_pool_app_id,
                "settle",
                [
                    outcome.upper().encode(),
                ],
            )
        except Exception as e:
            logger.error(f"Failed to settle market on-chain: {e}")
            return {
                "status": "simulated",
                "error": str(e),
            }

    def resolve_market(self, market: dict, outcome: str) -> dict:
        return self.settle_market(market, outcome)

    def claim_winnings(
        self, market_pool_app_id: int, bettor_address: str, bet_id: str
    ) -> dict:
        try:
            return self._app_call(
                market_pool_app_id,
                "claim_winnings",
                [
                    bettor_address.encode(),
                    bet_id.encode(),
                ],
            )
        except Exception as e:
            logger.warning(f"Failed to claim winnings: {e}")
            return {"status": "error", "error": str(e)}

    def register_agent_onchain(self, agent_data: dict) -> dict:
        app_id = self.get_agent_registry_app_id()

        app_args = self._encode_args(
            "register_agent",
            agent_data["id"],
            agent_data["name"],
            agent_data["creator_wallet"],
            agent_data.get("specialization", "both"),
        )

        try:
            result = self._app_call(
                app_id,
                "register_agent",
                app_args,
                payment={"amount": AGENT_REGISTRATION_STAKE},
            )
            return {
                "status": "registered",
                "txid": result.get("txid"),
            }
        except Exception as e:
            logger.warning(f"Failed to register agent on-chain: {e}")
            return {
                "status": "simulated",
                "error": str(e),
            }

    def record_agent_bet_onchain(
        self, agent_id: str, market_id: str, bet_id: str, amount: float, side: str
    ) -> dict:
        app_id = self.get_agent_registry_app_id()

        return self._app_call(
            app_id,
            "record_bet_placed",
            [
                agent_id.encode(),
                market_id.encode(),
                bet_id.encode(),
                str(int(amount * 1_000_000)).encode(),
                side.upper().encode(),
            ],
        )

    def record_agent_result_onchain(
        self, agent_id: str, bet_id: str, won: bool, profit: float
    ) -> dict:
        app_id = self.get_agent_registry_app_id()

        return self._app_call(
            app_id,
            "record_bet_result",
            [
                agent_id.encode(),
                bet_id.encode(),
                b"1" if won else b"0",
                str(int(profit * 1_000_000)).encode(),
            ],
        )

    def get_agent_onchain(self, agent_id: str) -> dict:
        app_id = self.get_agent_registry_app_id()

        try:
            result = self._app_call(app_id, "get_agent", [agent_id.encode()])
            return {
                "status": "retrieved",
                "agent_id": agent_id,
            }
        except Exception as e:
            logger.warning(f"Failed to get agent from chain: {e}")
            return {"status": "error", "error": str(e)}

    def get_agent_stats_onchain(self, agent_id: str) -> dict:
        try:
            app_id = self.get_agent_registry_app_id()
            state = get_application_state(app_id)

            for gs in state:
                key_bytes = bytes.fromhex(gs.get("key", ""))
                if len(key_bytes) == 32:
                    key = key_bytes.decode("utf-8").rstrip("\x00")
                    if agent_id in key:
                        value = gs.get("value", {})
                        return {
                            "agent_id": agent_id,
                            "stats": value,
                        }
        except Exception as e:
            logger.warning(f"Failed to get agent stats: {e}")
        return {"agent_id": agent_id, "stats": None}

    def receive_fee(self, amount: float, market_id: str) -> dict:
        app_id = self.get_fee_vault_app_id()

        params = self.algod.suggested_params()
        payment = PaymentTxn(
            sender=self.coordinator_address,
            sp=params,
            receiver=get_application_address(app_id),
            amt=int(amount * 1_000_000),
            note=f"fee:{market_id}".encode(),
        )

        signed = payment.sign(self.coordinator_key)
        txid = self.algod.send_transaction(signed)
        return wait_for_txn(txid)

    def distribute_fees(self) -> dict:
        app_id = self.get_fee_vault_app_id()
        return self._app_call(app_id, "distribute", [])

    def get_fee_vault_balance(self) -> float:
        try:
            app_id = self.get_fee_vault_app_id()
            info = self.algod.account_info(get_application_address(app_id))
            return float(info.get("amount", 0)) / 1_000_000
        except Exception:
            return 0.0


_client = None


def get_contract_client() -> ContractClient:
    global _client
    if _client is None:
        _client = ContractClient()
    return _client


def create_betting_pool(market: dict) -> dict:
    client = get_contract_client()
    return client.deploy_betting_pool(market)


def deploy_betting_pool(market: dict) -> dict:
    return create_betting_pool(market)


def create_market_pool(market: dict) -> dict:
    return create_betting_pool(market)


def place_bet(market: dict, bet: dict) -> dict:
    client = get_contract_client()
    return client.place_bet(market, bet)


def lock_bet(market: dict, bet: dict) -> dict:
    return place_bet(market, bet)


def submit_bet(market: dict, bet: dict) -> dict:
    return place_bet(market, bet)


def settle_market(market: dict, outcome: str) -> dict:
    client = get_contract_client()
    return client.settle_market(market, outcome)


def resolve_market(market: dict, outcome: str) -> dict:
    return settle_market(market, outcome)


def submit_settlement(market: dict, outcome: str) -> dict:
    return settle_market(market, outcome)


def register_agent(agent_data: dict) -> dict:
    client = get_contract_client()
    return client.register_agent_onchain(agent_data)


def record_agent_bet(
    agent_id: str, market_id: str, bet_id: str, amount: float, side: str
) -> dict:
    client = get_contract_client()
    return client.record_agent_bet_onchain(agent_id, market_id, bet_id, amount, side)


def record_agent_result(agent_id: str, bet_id: str, won: bool, profit: float) -> dict:
    client = get_contract_client()
    return client.record_agent_result_onchain(agent_id, bet_id, won, profit)


def get_probability(market_pool_app_id: int) -> dict:
    client = get_contract_client()
    return client.get_probability(market_pool_app_id)


def push_price(asset: str, price: float, timestamp: int = None) -> dict:
    client = get_contract_client()
    return client.push_price(asset, price, timestamp)


def get_price(asset: str) -> dict:
    client = get_contract_client()
    return client.get_price(asset)
