from algopy import (
    ARC4Contract,
    GlobalState,
    UInt64,
    String,
    Global,
    Txn,
    Bytes,
    arc4,
    Box,
    op,
    gtxn,
)


class AgentProfile(arc4.Struct):
    owner: arc4.Address
    name: arc4.String
    specialization: arc4.String
    total_bets: arc4.UInt64
    winning_bets: arc4.UInt64
    total_profit_microalgo: arc4.UInt64
    last_reasoning_cid: arc4.String
    registered_at: arc4.UInt64
    nonce: arc4.UInt64


class AgentRegistry(ARC4Contract):
    def __init__(self) -> None:
        self.registry_app_id = GlobalState(UInt64)
        self.agent_count = GlobalState(UInt64)

    @arc4.abimethod(create="require")
    def create(self, registry_app_id: UInt64) -> None:
        self.registry_app_id.value = registry_app_id
        self.agent_count.value = UInt64(0)

    @arc4.abimethod
    def register_agent(
        self,
        name: String,
        specialization: String,
        registration_fee: gtxn.PaymentTransaction,
    ) -> UInt64:
        assert registration_fee.amount >= UInt64(1_000_000), "1 ALGO fee required"
        assert registration_fee.receiver == Global.current_application_address

        agent_id = self.agent_count.value
        box_key = Bytes(b"agent:") + op.itob(agent_id)
        box_ref = Box(AgentProfile, key=box_key)
        box_ref.value = AgentProfile(
            owner=arc4.Address(Txn.sender),
            name=arc4.String(name),
            specialization=arc4.String(specialization),
            total_bets=arc4.UInt64(0),
            winning_bets=arc4.UInt64(0),
            total_profit_microalgo=arc4.UInt64(0),
            last_reasoning_cid=arc4.String(""),
            registered_at=arc4.UInt64(Global.latest_timestamp),
            nonce=arc4.UInt64(0),
        )

        addr_key = Bytes(b"addr:") + Txn.sender.bytes
        addr_box = Box(arc4.UInt64, key=addr_key)
        addr_box.value = arc4.UInt64(agent_id)

        self.agent_count.value = agent_id + UInt64(1)
        return agent_id

    @arc4.abimethod
    def record_bet_placed(
        self,
        agent_id: UInt64,
        market_app_id: UInt64,
        direction: String,
        amount_microalgo: UInt64,
        reasoning_cid: String,
    ) -> None:
        box_key = Bytes(b"agent:") + op.itob(agent_id)
        box_ref = Box(AgentProfile, key=box_key)
        assert box_ref, "agent not found"
        profile = box_ref.value.copy()
        assert Txn.sender == profile.owner.native, "not your agent"
        new_profile = profile._replace(
            last_reasoning_cid=arc4.String(reasoning_cid),
            nonce=arc4.UInt64(profile.nonce.native + 1),
        )
        box_ref.value = new_profile.copy()

    @arc4.abimethod
    def record_bet_result(
        self,
        agent_id: UInt64,
        won: bool,
        profit_microalgo: UInt64,
        reasoning_cid: String,
    ) -> None:
        box_key = Bytes(b"agent:") + op.itob(agent_id)
        box_ref = Box(AgentProfile, key=box_key)
        assert box_ref, "agent not found"
        profile = box_ref.value.copy()
        current_total = profile.total_bets.native
        current_winning = profile.winning_bets.native
        current_profit = profile.total_profit_microalgo.native
        new_profile = profile._replace(
            total_bets=arc4.UInt64(current_total + 1),
            last_reasoning_cid=arc4.String(reasoning_cid),
            nonce=arc4.UInt64(profile.nonce.native + 1),
            winning_bets=arc4.UInt64(current_winning + 1) if won else profile.winning_bets,
            total_profit_microalgo=arc4.UInt64(current_profit + profit_microalgo)
            if won
            else profile.total_profit_microalgo,
        )
        box_ref.value = new_profile.copy()

    @arc4.abimethod(readonly=True)
    def get_agent_id_by_address(self, owner: arc4.Address) -> arc4.UInt64:
        addr_key = Bytes(b"addr:") + owner.bytes
        addr_box = Box(arc4.UInt64, key=addr_key)
        assert addr_box, "address not registered"
        return addr_box.value

    @arc4.abimethod(readonly=True)
    def get_win_rate_bps(self, agent_id: UInt64) -> arc4.UInt64:
        box_key = Bytes(b"agent:") + op.itob(agent_id)
        box_ref = Box(AgentProfile, key=box_key)
        assert box_ref, "agent not found"
        p = box_ref.value.copy()
        if p.total_bets.native == 0:
            return arc4.UInt64(0)
        return arc4.UInt64(p.winning_bets.native * 10_000 // p.total_bets.native)

    @arc4.abimethod(readonly=True)
    def get_agent(self, agent_id: UInt64) -> AgentProfile:
        box_key = Bytes(b"agent:") + op.itob(agent_id)
        box_ref = Box(AgentProfile, key=box_key)
        assert box_ref, "agent not found"
        return box_ref.value.copy()

    @arc4.abimethod(readonly=True)
    def get_agent_count(self) -> arc4.UInt64:
        return arc4.UInt64(self.agent_count.value)
