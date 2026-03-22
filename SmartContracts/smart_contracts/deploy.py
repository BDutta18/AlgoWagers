import logging

import algokit_utils
from algokit_utils import AlgorandClient, AlgoAmount

logger = logging.getLogger(__name__)


def deploy() -> None:
    algorand = AlgorandClient.from_environment()
    deployer = algorand.account.from_environment("DEPLOYER")

    from smart_contracts.artifacts.platform_registry.platform_registry_client import (
        PlatformRegistryFactory,
        PlatformRegistryClient,
        CreateArgs as PlatformRegistryCreateArgs,
        RegisterContractArgs,
    )
    from smart_contracts.artifacts.free_vault.fee_vault_client import (
        FeeVaultFactory,
        CreateArgs as FeeVaultCreateArgs,
    )
    from smart_contracts.artifacts.oracle_aggregator.oracle_aggregator_client import (
        OracleAggregatorFactory,
        CreateArgs as OracleAggregatorCreateArgs,
    )
    from smart_contracts.artifacts.agent_registry.agent_registry_client import (
        AgentRegistryFactory,
        CreateArgs as AgentRegistryCreateArgs,
    )
    from smart_contracts.artifacts.market_factory.market_factory_client import (
        MarketFactoryFactory,
        CreateArgs as MarketFactoryCreateArgs,
    )

    registry_factory = algorand.client.get_typed_app_factory(PlatformRegistryFactory, default_sender=deployer.address)
    _, registry_result = registry_factory.send.create.create(
        args=PlatformRegistryCreateArgs(
            admin=deployer.address,
            protocol_fee_bps=100,
        ),
    )
    registry_app_id = registry_result.app_id
    logger.info(f"PlatformRegistry deployed: app_id={registry_app_id}, address={registry_result.app_address}")

    if registry_result.confirmation:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=AlgoAmount(algo=1),
                sender=deployer.address,
                receiver=registry_result.app_address,
            )
        )

    registry_client = algorand.client.get_typed_app_client_by_id(
        PlatformRegistryClient,
        app_id=registry_app_id,
        default_sender=deployer.address,
    )

    fee_vault_factory = algorand.client.get_typed_app_factory(FeeVaultFactory, default_sender=deployer.address)
    _, fee_vault_result = fee_vault_factory.send.create.create(
        args=FeeVaultCreateArgs(
            admin=deployer.address,
            treasury_address=deployer.address,
            rewards_address=deployer.address,
            treasury_split_bps=5000,
        ),
    )
    logger.info(f"FeeVault deployed: app_id={fee_vault_result.app_id}, address={fee_vault_result.app_address}")

    if fee_vault_result.confirmation:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=AlgoAmount(algo=1),
                sender=deployer.address,
                receiver=fee_vault_result.app_address,
            )
        )

    registry_client.send.register_contract(
        args=RegisterContractArgs(
            role="fee_vault",
            app_id=fee_vault_result.app_id,
        ),
    )

    oracle_factory = algorand.client.get_typed_app_factory(OracleAggregatorFactory, default_sender=deployer.address)
    _, oracle_result = oracle_factory.send.create.create(
        args=OracleAggregatorCreateArgs(
            registry_app_id=registry_app_id,
        ),
    )
    logger.info(f"OracleAggregator deployed: app_id={oracle_result.app_id}, address={oracle_result.app_address}")

    if oracle_result.confirmation:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=AlgoAmount(algo=1),
                sender=deployer.address,
                receiver=oracle_result.app_address,
            )
        )

    registry_client.send.register_contract(
        args=RegisterContractArgs(
            role="oracle",
            app_id=oracle_result.app_id,
        ),
    )

    agent_factory = algorand.client.get_typed_app_factory(AgentRegistryFactory, default_sender=deployer.address)
    _, agent_result = agent_factory.send.create.create(
        args=AgentRegistryCreateArgs(
            registry_app_id=registry_app_id,
        ),
    )
    logger.info(f"AgentRegistry deployed: app_id={agent_result.app_id}, address={agent_result.app_address}")

    if agent_result.confirmation:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=AlgoAmount(algo=1),
                sender=deployer.address,
                receiver=agent_result.app_address,
            )
        )

    registry_client.send.register_contract(
        args=RegisterContractArgs(
            role="agent_registry",
            app_id=agent_result.app_id,
        ),
    )

    market_factory_factory = algorand.client.get_typed_app_factory(
        MarketFactoryFactory, default_sender=deployer.address
    )
    _, market_factory_result = market_factory_factory.send.create.create(
        args=MarketFactoryCreateArgs(
            registry_app_id=registry_app_id,
        ),
    )
    logger.info(
        f"MarketFactory deployed: app_id={market_factory_result.app_id}, address={market_factory_result.app_address}"
    )

    if market_factory_result.confirmation:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=AlgoAmount(algo=1),
                sender=deployer.address,
                receiver=market_factory_result.app_address,
            )
        )

    registry_client.send.register_contract(
        args=RegisterContractArgs(
            role="market_factory",
            app_id=market_factory_result.app_id,
        ),
    )

    logger.info("All contracts deployed successfully!")
    logger.info(f"PlatformRegistry app_id: {registry_app_id}")
