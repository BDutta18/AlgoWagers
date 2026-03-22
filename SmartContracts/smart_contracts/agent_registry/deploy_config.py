import logging

import algokit_utils
from algokit_utils import AlgorandClient

logger = logging.getLogger(__name__)


def deploy() -> None:
    algorand = AlgorandClient.from_environment()
    deployer = algorand.account.from_environment("DEPLOYER")

    from smart_contracts.artifacts.agent_registry.agent_registry_client import (
        AgentRegistryFactory,
        CreateArgs,
    )

    factory = algorand.client.get_typed_app_factory(AgentRegistryFactory, default_sender=deployer.address)

    app_client, result = factory.send.create.create(
        args=CreateArgs(
            registry_app_id=0,
        ),
    )

    if result.confirmation:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=algokit_utils.AlgoAmount(algo=1),
                sender=deployer.address,
                receiver=result.app_address,
            )
        )

    logger.info(f"AgentRegistry deployed: app_id={result.app_id}, address={result.app_address}")
