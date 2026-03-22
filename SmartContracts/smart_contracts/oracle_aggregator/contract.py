# contracts/oracle_aggregator/contract.py
from algopy import (
    ARC4Contract,
    GlobalState,
    Box,
    Bytes,
    UInt64,
    String,
    Application,
    Global,
    Txn,
    arc4,
)

STALENESS_WINDOW = 300  # 5 minutes — plain int, at module level


class PriceFeed(arc4.Struct):  # module level — nested classes not supported
    price_usd_x1000: arc4.UInt64
    timestamp: arc4.UInt64
    source_count: arc4.UInt64
    symbol: arc4.String


class OracleAggregator(ARC4Contract):
    def __init__(self) -> None:
        self.registry_app_id = GlobalState(UInt64)

    @arc4.abimethod(create="require")
    def create(self, registry_app_id: UInt64) -> None:
        self.registry_app_id.value = registry_app_id

    @arc4.abimethod
    def push_price(
        self,
        symbol: String,
        price_usd_x1000: UInt64,
        source_count: UInt64,
    ) -> None:
        assert source_count >= UInt64(2), "need >= 2 sources"

        box_key = Bytes(b"price:") + symbol.bytes
        box = Box(PriceFeed, key=box_key)
        box.value = PriceFeed(
            price_usd_x1000=arc4.UInt64(price_usd_x1000),
            timestamp=arc4.UInt64(Global.latest_timestamp),
            source_count=arc4.UInt64(source_count),
            symbol=arc4.String(symbol),
        )

    @arc4.abimethod(readonly=True)
    def get_price(self, symbol: String) -> arc4.UInt64:
        box_key = Bytes(b"price:") + symbol.bytes
        box = Box(PriceFeed, key=box_key)
        assert box.maybe()[1], "no price for symbol"
        feed = box.maybe()[0].copy()
        age = Global.latest_timestamp - feed.timestamp.native
        assert age <= UInt64(STALENESS_WINDOW), "price stale"
        return feed.price_usd_x1000

    @arc4.abimethod(readonly=True)
    def get_price_with_timestamp(self, symbol: String) -> arc4.Tuple[arc4.UInt64, arc4.UInt64]:
        box_key = Bytes(b"price:") + symbol.bytes
        box = Box(PriceFeed, key=box_key)
        assert box.maybe()[1], "no price for symbol"
        feed = box.maybe()[0].copy()
        return arc4.Tuple((feed.price_usd_x1000, feed.timestamp))
