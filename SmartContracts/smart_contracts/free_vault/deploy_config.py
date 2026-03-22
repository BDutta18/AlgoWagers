import logging

import algokit_utils
from algokit_utils import AlgorandClient

logger = logging.getLogger(__name__)


def deploy() -> None:
    algorand = AlgorandClient.from_environment()
    deployer = algorand.account.from_environment("DEPLOYER")

    from smart_contracts.artifacts.free_vault.fee_vault_client import (
        FeeVaultFactory,
        CreateArgs,
    )

    factory = algorand.client.get_typed_app_factory(FeeVaultFactory, default_sender=deployer.address)

    app_client, result = factory.send.create.create(
        args=CreateArgs(
            admin=deployer.address,
            treasury_address=deployer.address,
            rewards_address=deployer.address,
            treasury_split_bps=5000,
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

    logger.info(f"FeeVault deployed: app_id={result.app_id}, address={result.app_address}")
