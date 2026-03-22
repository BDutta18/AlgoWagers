from algopy import (
    ARC4Contract,
    GlobalState,
    UInt64,
    Account,
    Global,
    Txn,
    itxn,
    arc4,
)


class FeeVault(ARC4Contract):
    def __init__(self) -> None:
        self.admin = GlobalState(Account)
        self.total_collected = GlobalState(UInt64)
        self.treasury_split_bps = GlobalState(UInt64)
        self.treasury_address = GlobalState(Account)
        self.rewards_address = GlobalState(Account)

    @arc4.abimethod(create="require")
    def create(
        self,
        admin: Account,
        treasury_address: Account,
        rewards_address: Account,
        treasury_split_bps: UInt64,
    ) -> None:
        self.admin.value = admin
        self.treasury_address.value = treasury_address
        self.rewards_address.value = rewards_address
        self.treasury_split_bps.value = treasury_split_bps
        self.total_collected.value = UInt64(0)

    @arc4.abimethod
    def receive_fee(self, payment: arc4.UInt64) -> None:
        self.total_collected.value += payment.native

    @arc4.abimethod
    def distribute(self) -> None:
        assert Txn.sender == self.admin.value, "admin only"

        balance = Global.current_application_address.balance - Global.min_balance
        assert balance > UInt64(0), "nothing to distribute"

        treasury_amount = balance * self.treasury_split_bps.value // UInt64(10_000)
        rewards_amount = balance - treasury_amount

        if treasury_amount > UInt64(0):
            itxn.Payment(
                receiver=self.treasury_address.value,
                amount=treasury_amount,
            ).submit()

        if rewards_amount > UInt64(0):
            itxn.Payment(
                receiver=self.rewards_address.value,
                amount=rewards_amount,
            ).submit()

    @arc4.abimethod(readonly=True)
    def get_balance(self) -> UInt64:
        return Global.current_application_address.balance - Global.min_balance

    @arc4.abimethod(readonly=True)
    def get_total_collected(self) -> UInt64:
        return self.total_collected.value
