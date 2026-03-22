# contracts/market_factory/contract.py
from algopy import (
    ARC4Contract,
    GlobalState,
    Box,
    Bytes,
    UInt64,
    Application,
    Global,
    arc4,
    op,
)


# Must be at module level — nested classes are not supported in algopy
class MarketMeta(arc4.Struct):
    app_id: arc4.UInt64
    asset_symbol: arc4.String
    question: arc4.String
    resolution_price: arc4.UInt64
    expiry_ts: arc4.UInt64
    market_type: arc4.String
    settled: arc4.Bool


class MarketFactory(ARC4Contract):

    def __init__(self) -> None:
        self.registry_app_id = GlobalState(UInt64)
        self.market_count = GlobalState(UInt64)

    @arc4.abimethod(create="require")
    def create(self, registry_app_id: UInt64) -> None:
        self.registry_app_id.value = registry_app_id
        self.market_count.value = UInt64(0)

    @arc4.abimethod
    def create_market(
        self,
        asset_symbol: arc4.String,
        question: arc4.String,
        resolution_price: UInt64,
        expiry_ts: UInt64,
        market_type: arc4.String,
        seed_algo: UInt64,
    ) -> UInt64:
        is_paused, _txn = arc4.abi_call[arc4.Bool](
            "get_paused()bool",
            app_id=Application(self.registry_app_id.value),
        )
        assert not is_paused.native, "platform paused"

        deploy_txn = arc4.abi_call(
            "create(string,uint64,uint64,uint64)void",
            asset_symbol,
            resolution_price,
            expiry_ts,
            self.registry_app_id.value,
            fee=Global.min_balance + seed_algo,
            app_id=Application(0),
        )
        market_app_id = deploy_txn.created_app.id

        mid = self.market_count.value
        box_key = Bytes(b"market:") + op.itob(mid)
        box = Box(MarketMeta, key=box_key)
        box.value = MarketMeta(
            app_id=arc4.UInt64(market_app_id),
            asset_symbol=asset_symbol,
            question=question,
            resolution_price=arc4.UInt64(resolution_price),
            expiry_ts=arc4.UInt64(expiry_ts),
            market_type=market_type,
            settled=arc4.Bool(False),
        )
        self.market_count.value = mid + UInt64(1)
        return market_app_id

    @arc4.abimethod(readonly=True)
    def get_market(self, market_id: UInt64) -> MarketMeta:
        box_key = Bytes(b"market:") + op.itob(market_id)
        box = Box(MarketMeta, key=box_key)
        assert box.maybe()[1], "market not found"
        return box.maybe()[0].copy()

    @arc4.abimethod(readonly=True)
    def get_market_count(self) -> UInt64:
        return self.market_count.value
