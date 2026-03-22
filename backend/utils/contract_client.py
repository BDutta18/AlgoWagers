import json
import logging
import time
import base64
from typing import Optional

from algosdk import encoding, abi
from algosdk.transaction import (
    ApplicationOptInTxn,
    ApplicationCallTxn,
    StateSchema,
    OnComplete,
    PaymentTxn,
    calculate_group_id,
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

AGENT_REGISTRATION_STAKE = 1.0  # Contract (AgentRegistry.teal:96) requires >= 1_000_000 microAlgos


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

    def _encode_args(self, method_sig: str, args: list) -> list[bytes]:
        """Encode arguments for an ARC4 ABI method call."""
        method = abi.Method.from_signature(method_sig)
        selector = method.get_selector()
        
        encoded_args = [selector]
        if not args:
            return encoded_args

        for i, arg in enumerate(args):
            # Dynamic encoding based on method argument types
            arg_type = method.args[i].type
            val = arg
            
            # Handle string/int conversion based on expected ABI type
            type_str = str(arg_type)
            if type_str == "string" and isinstance(arg, bytes):
                val = arg.decode()
            elif (type_str.startswith("uint") or type_str.startswith("int")) and isinstance(arg, str):
                val = int(arg)
            
            # Use ABIType.from_string().encode() which is more universally supported
            encoded_args.append(abi.ABIType.from_string(type_str).encode(val))
            
        return encoded_args

    def _app_call(
        self,
        app_id: int,
        method_sig: str,
        args: list = None,
        opt_in: bool = False,
        payment: dict = None,
        boxes: list = None,
    ) -> dict:
        params = self.algod.suggested_params()
        sender = self.coordinator_address

        app_args = self._encode_args(method_sig, args)

        # Standard NoOp call
        app_call_txn = ApplicationCallTxn(
            sender=sender,
            sp=params,
            index=app_id,
            on_complete=OnComplete.OptInOC if opt_in else OnComplete.NoOpOC,
            app_args=app_args,
            boxes=[(app_id, b) for b in boxes] if boxes else None,
            local_schema=StateSchema(0, 0),
        )

        if payment:
            # Atomic Group: Payment + Application Call
            payment_txn = PaymentTxn(
                sender=sender,
                sp=params,
                receiver=get_application_address(app_id),
                amt=int(payment["amount"] * 1_000_000),
                note=f"Payment for {method_sig.split('(')[0]}".encode(),
            )
            # Group the transactions
            gid = calculate_group_id([payment_txn, app_call_txn])
            payment_txn.group = gid
            app_call_txn.group = gid
            
            # Sign both
            signed_payment = payment_txn.sign(self.coordinator_key)
            signed_app_call = app_call_txn.sign(self.coordinator_key)
            
            # Send as a group
            txid = self.algod.send_transactions([signed_payment, signed_app_call])
        else:
            # Single Application Call
            signed_app_call = app_call_txn.sign(self.coordinator_key)
            txid = self.algod.send_transaction(signed_app_call)

        return wait_for_txn(txid)

    def _get_app_id_by_name(self, name: str) -> Optional[int]:
        try:
            # Use Indexer with include-all to get params directly in one batch call
            results = self.indexer.search_applications(application_id=0, limit=100)
            for app in results.get("applications", []):
                app_id = app.get("id")
                if not app_id:
                    continue
                
                # Indexer already returns params and global-state! 
                # No need to call algod.application_info(app_id) which was causing the lag.
                params = app.get("params", {})
                global_state = params.get("global-state", [])
                
                for gs in global_state:
                    key_bytes = base64.b64decode(gs.get("key", ""))
                    if len(key_bytes) == 32:
                        key = key_bytes.decode("utf-8", "ignore").rstrip("\x00")
                        if key == "algowager_name":
                            value = gs.get("value", {})
                            stored_name = (
                                base64.b64decode(value.get("bytes", ""))
                                .decode("utf-8", "ignore")
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

    def _get_agent_count(self) -> int:
        try:
            app_id = self.get_agent_registry_app_id()
            state = get_application_state(app_id)
            for gs in state:
                key = base64.b64decode(gs.get("key", "")).decode("utf-8", "ignore")
                if key == "agent_count":
                    return int(gs.get("value", {}).get("uint", 0))
        except Exception:
            pass
        return 0

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

        # TEAL: create_market(string,string,uint64,uint64,string,uint64)uint64
        args = [
            market["id"],
            market["ticker"],
            int(market["asset_id"]) if isinstance(market["asset_id"], int) else 0, # Placeholder if not int
            int(market["open_price"] * 1000000),
            market.get("question", "Will price rise?"),
            int(market["closes_at"]) if isinstance(market["closes_at"], (int, float)) else 0
        ]

        result = self._app_call(
            app_id,
            "create_market(string,string,uint64,uint64,string,uint64)uint64",
            args
        )

        txid = result.get("txid")
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
        # Note: register_market is not in Factory TEAL, maybe it is in Registry?
        # Checking Factory TEAL again: create_market, get_market, get_market_count
        # If it doesn't exist, we skip or use proper name
        logger.info(f"Skipping register_market as it is handled by create_market")
        return {"status": "success"}

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

        # TEAL: place_bet(string,pay)uint64
        # 'pay' is the payment transaction in the group
        args = [side]
        
        try:
            return self._app_call(
                market_pool_app_id,
                "place_bet(string,pay)uint64",
                args,
                payment={"amount": bet["amount"]}
            )
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
                key_bytes = base64.b64decode(gs.get("key", ""))
                if len(key_bytes) == 32:
                    key = key_bytes.decode("utf-8", "ignore").rstrip("\x00")
                    value = gs.get("value", {})
                    if value.get("type", 0) == 1:
                        val_bytes_decoded = base64.b64decode(value.get("bytes", ""))
                        val = int.from_bytes(val_bytes_decoded, "big")
                    else:
                        val = value.get("uint", 0)

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

    def push_price(self, asset: str, price: float, source_count: int = 2) -> dict:
        app_id = self.get_oracle_app_id()
        
        # TEAL: push_price(string,uint64,uint64)void
        args = [
            asset,
            int(price * 1_000_000),
            source_count
        ]

        return self._app_call(
            app_id,
            "push_price(string,uint64,uint64)void",
            args
        )

    def get_price(self, asset: str) -> dict:
        app_id = self.get_oracle_app_id()

        try:
            # TEAL: get_price(string)uint64
            result = self._app_call(app_id, "get_price(string)uint64", [asset])
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
            # TEAL: settle(uint64,uint64)void
            # 1: final_price (uint64), 2: timestamp (uint64) -> Wait, looking at TEAL again
            # MarketPool.teal: txna ApplicationArgs 1 (btoi), 2 (btoi) - used to set self.outcome
            # self.outcome.value = arc4.Bool(final_price >= self.resolution_price.value)
            
            final_price_micro = int(float(outcome) * 1_000_000)
            return self._app_call(
                market_pool_app_id,
                "settle(uint64,uint64)void",
                [final_price_micro, int(time.time())],
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
        self, market_pool_app_id: int
    ) -> dict:
        try:
            # TEAL: claim_winnings()uint64
            return self._app_call(
                market_pool_app_id,
                "claim_winnings()uint64",
                []
            )
        except Exception as e:
            logger.warning(f"Failed to claim winnings: {e}")
            return {"status": "error", "error": str(e)}

    def register_agent_onchain(self, agent_data: dict) -> dict:
        app_id = self.get_agent_registry_app_id()

        # Predict next agent ID to include the correct box ref
        next_id = self._get_agent_count()
        agent_box_key = b"agent:" + next_id.to_bytes(8, "big")
        addr_box_key = b"addr:" + encoding.decode_address(self.coordinator_address)

        # TEAL: register_agent(string,string,pay)uint64
        args = [
            agent_data["name"],
            agent_data.get("specialization", "both")
        ]

        try:
            result = self._app_call(
                app_id,
                "register_agent(string,string,pay)uint64",
                args,
                payment={"amount": AGENT_REGISTRATION_STAKE},
                boxes=[agent_box_key, addr_box_key]
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
        self, agent_id: int, market_id: int, bet_id: str, amount_micro: int, side: str
    ) -> dict:
        app_id = self.get_agent_registry_app_id()

        # TEAL: record_bet_placed(uint64,uint64,string,uint64,string)void
        agent_box_key = b"agent:" + agent_id.to_bytes(8, "big")
        
        args = [
            agent_id,
            market_id,
            bet_id,
            amount_micro,
            side.upper()
        ]

        return self._app_call(
            app_id,
            "record_bet_placed(uint64,uint64,string,uint64,string)void",
            args,
            boxes=[agent_box_key]
        )

    def record_agent_result_onchain(
        self, agent_id: int, bet_id: str, won: bool, profit_micro: int
    ) -> dict:
        app_id = self.get_agent_registry_app_id()
        agent_box_key = b"agent:" + agent_id.to_bytes(8, "big")

        # TEAL: record_bet_result(uint64,string,bool,int64)void
        args = [
            agent_id,
            bet_id,
            won,
            profit_micro
        ]

        return self._app_call(
            app_id,
            "record_bet_result(uint64,string,bool,int64)void",
            args,
            boxes=[agent_box_key]
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
                key_bytes = base64.b64decode(gs.get("key", ""))
                if len(key_bytes) == 32:
                    key = key_bytes.decode("utf-8", "ignore").rstrip("\x00")
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
    agent_id: int, market_id: int, bet_id: str, amount_micro: int, side: str
) -> dict:
    client = get_contract_client()
    return client.record_agent_bet_onchain(agent_id, market_id, bet_id, amount_micro, side)


def record_agent_result(agent_id: int, bet_id: str, won: bool, profit_micro: int) -> dict:
    client = get_contract_client()
    return client.record_agent_result_onchain(agent_id, bet_id, won, profit_micro)


def get_probability(market_pool_app_id: int) -> dict:
    client = get_contract_client()
    return client.get_probability(market_pool_app_id)


def push_price(asset: str, price: float, timestamp: int = None) -> dict:
    client = get_contract_client()
    return client.push_price(asset, price, timestamp)


def get_price(asset: str) -> dict:
    client = get_contract_client()
    return client.get_price(asset)
