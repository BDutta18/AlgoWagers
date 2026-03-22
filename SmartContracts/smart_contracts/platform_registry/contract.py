# contracts/platform_registry/contract.py
from algopy import (
    ARC4Contract,
    Account,
    GlobalState,
    Box,
    BoxRef,
    Txn,
    UInt64,
    arc4,
    Bytes,
)


class PlatformRegistry(ARC4Contract):
    def __init__(self) -> None:
        self.admin = GlobalState(Account)
        self.protocol_fee_bps = GlobalState(UInt64)
        self.paused = GlobalState(arc4.Bool)

    @arc4.abimethod(create="require")
    def create(
        self,
        admin: Account,
        protocol_fee_bps: UInt64,
    ) -> None:
        self.admin.value = admin
        self.protocol_fee_bps.value = protocol_fee_bps
        self.paused.value = arc4.Bool(False)

    @arc4.abimethod
    def register_contract(
        self,
        role: arc4.String,  # "fee_vault" | "oracle" | "agent_registry" | "market_factory"
        app_id: UInt64,
    ) -> None:
        assert Txn.sender == self.admin.value, "admin only"
        box = Box(UInt64, key=role.bytes)
        box.value = app_id

    @arc4.abimethod(readonly=True)
    def get_app_id(self, role: arc4.String) -> UInt64:
        box = Box(UInt64, key=role.bytes)
        value, exists = box.maybe()
        assert exists, "role not registered"
        return value

    @arc4.abimethod
    def set_fee_bps(self, new_bps: UInt64) -> None:
        assert Txn.sender == self.admin.value
        assert new_bps <= UInt64(1000), "max 10%"
        self.protocol_fee_bps.value = new_bps

    @arc4.abimethod
    def set_paused(self, paused: arc4.Bool) -> None:
        assert Txn.sender == self.admin.value
        self.paused.value = paused
