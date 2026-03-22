# contracts/market_pool/contract.py
from algopy import (
    ARC4Contract,
    GlobalState,
    LocalState,
    Bytes,
    UInt64,
    String,
    Application,
    Global,
    Txn,
    gtxn,
    itxn,
    arc4,
    op,
    subroutine,
)

LMSR_B = 1_000_000

class MarketPool(ARC4Contract):

    def __init__(self) -> None:
        self.asset_symbol = GlobalState(Bytes)
        self.resolution_price = GlobalState(UInt64)
        self.expiry_ts = GlobalState(UInt64)
        self.registry_app_id = GlobalState(UInt64)
        self.yes_pool = GlobalState(UInt64)
        self.no_pool = GlobalState(UInt64)
        self.total_bets = GlobalState(UInt64)
        self.resolved = GlobalState(arc4.Bool)
        self.outcome = GlobalState(arc4.Bool)
        # Local state per bettor
        self.yes_shares = LocalState(UInt64)
        self.no_shares = LocalState(UInt64)
        self.claimed = LocalState(arc4.Bool)

    @arc4.abimethod(create="require")
    def create(
        self,
        asset_symbol: String,
        resolution_price: UInt64,
        expiry_ts: UInt64,
        registry_app_id: UInt64,
    ) -> None:
        self.asset_symbol.value = asset_symbol.bytes
        self.resolution_price.value = resolution_price
        self.expiry_ts.value = expiry_ts
        self.registry_app_id.value = registry_app_id
        self.yes_pool.value = UInt64(500_000)
        self.no_pool.value = UInt64(500_000)
        self.total_bets.value = UInt64(0)
        self.resolved.value = arc4.Bool(False)

    @arc4.abimethod(allow_actions=["OptIn"])
    def opt_in(self) -> None:
        self.yes_shares[Txn.sender] = UInt64(0)
        self.no_shares[Txn.sender] = UInt64(0)
        self.claimed[Txn.sender] = arc4.Bool(False)

    @arc4.abimethod
    def place_bet(
        self,
        direction: String,
        payment_txn: gtxn.PaymentTransaction,
    ) -> UInt64:
        assert not self.resolved.value.native, "market resolved"
        assert Global.latest_timestamp < self.expiry_ts.value, "market expired"
        assert payment_txn.receiver == Global.current_application_address

        bet_amount = payment_txn.amount
        assert bet_amount >= UInt64(1_000_000), "min 1 ALGO"

        if direction.bytes == Bytes(b"yes"):
            shares = self._calc_shares(bet_amount, self.yes_pool.value, self.no_pool.value)
            self.yes_pool.value += bet_amount
            self.yes_shares[Txn.sender] = self.yes_shares[Txn.sender] + shares
        else:
            shares = self._calc_shares(bet_amount, self.no_pool.value, self.yes_pool.value)
            self.no_pool.value += bet_amount
            self.no_shares[Txn.sender] = self.no_shares[Txn.sender] + shares
        self.total_bets.value += UInt64(1)
        return shares

    @subroutine
    def _calc_shares(
        self,
        amount: UInt64,
        own_pool: UInt64,
        other_pool: UInt64,
    ) -> UInt64:
        total = own_pool + amount
        return amount * op.sqrt(other_pool * UInt64(1_000_000)) // op.sqrt(total * UInt64(1_000_000))

    @arc4.abimethod(readonly=True)
    def get_probability(self) -> UInt64:
        yes = self.yes_pool.value
        no = self.no_pool.value
        return (yes * UInt64(10_000)) // (yes + no)

    @arc4.abimethod
    def settle(
        self,
        final_price: UInt64,
        oracle_app_id: UInt64,
    ) -> None:
        # Verify oracle via registry
        expected_oracle, _txn = arc4.abi_call[arc4.UInt64](
            "get_app_id(string)uint64",
            arc4.String("oracle"),
            app_id=Application(self.registry_app_id.value),
        )
        assert oracle_app_id == expected_oracle.native, "wrong oracle"

        assert Global.latest_timestamp >= self.expiry_ts.value, "not expired"
        assert not self.resolved.value.native, "already resolved"

        self.resolved.value = arc4.Bool(True)
        self.outcome.value = arc4.Bool(final_price >= self.resolution_price.value)

    @arc4.abimethod
    def claim_winnings(self) -> UInt64:
        assert self.resolved.value.native, "not resolved"
        assert not self.claimed[Txn.sender].native, "already claimed"

        outcome = self.outcome.value.native
        won_shares = self.yes_shares[Txn.sender] if outcome else self.no_shares[Txn.sender]
        lost_shares = self.no_shares[Txn.sender] if outcome else self.yes_shares[Txn.sender]
        assert won_shares > UInt64(0) or lost_shares > UInt64(0), "no position"

        winning_pool = self.yes_pool.value if outcome else self.no_pool.value
        losing_pool = self.no_pool.value if outcome else self.yes_pool.value
        total_pool = winning_pool + losing_pool
        fee = total_pool * UInt64(200) // UInt64(10_000)
        distributable = total_pool - fee
        payout = won_shares * distributable // winning_pool if won_shares > UInt64(0) else UInt64(0)

        self.claimed[Txn.sender] = arc4.Bool(True)

        # Fetch fee vault app id from registry
        fee_vault_id, _txn1 = arc4.abi_call[arc4.UInt64](
            "get_app_id(string)uint64",
            arc4.String("fee_vault"),
            app_id=Application(self.registry_app_id.value),
        )

        if fee > UInt64(0):
            itxn.Payment(
                receiver=Application(fee_vault_id.native).address,
                amount=fee,
            ).submit()

        if payout > UInt64(0):
            itxn.Payment(
                receiver=Txn.sender,
                amount=payout,
            ).submit()

        return payout
