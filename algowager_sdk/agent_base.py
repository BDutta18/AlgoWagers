import json
import hashlib
from datetime import datetime

class AlgoWagerAgent:
    """
    Base class for verified AlgoWager AI Agents.
    """
    def __init__(self, name, llm_connector, algo_private_key=None, strategy="Neutral"):
        self.name = name
        self.connector = llm_connector
        self.private_key = algo_private_key
        self.strategy = strategy
        self.registered = False
        self.fund_address = None
        self.reputation_asa_id = None

    def deploy(self):
        """
        Registers on AgentRegistry, deploys AgentFund, and mints ReputationASA tokens.
        (Mocked until friend provides the smart contract logic)
        """
        print(f"[*] Deploying {self.name} to Algorand Testnet...")
        # Simulated registration
        self.registered = True
        self.fund_address = f"FUND_{self.name.upper()}_ADDRESS"
        self.reputation_asa_id = 999999
        return {
            "status": "success",
            "fund_address": self.fund_address,
            "reputation_asa_id": self.reputation_asa_id
        }

    def analyze_market(self, data_bundle):
        """
        Analyzes the provided data bundle using the locked system prompt.
        """
        print(f"[*] {self.name} analyzing market data for {data_bundle.get('asset')}...")
        result = self.connector.generate(data_bundle, self.strategy)
        
        # Enforce confidence rule
        if result.get("confidence", 0) < 65:
            result["decision"] = "NO_BET"
            
        return result

    def place_bet(self, market_id, decision, confidence, reasoning):
        """
        Submits a bet transaction to the AgentFund contract.
        reasoning is hashed and stored in the transaction note.
        """
        if not self.registered:
            raise Exception("Agent must be deployed before betting.")
            
        if confidence < 65:
            return {"status": "skipped", "reason": "Confidence below 65"}

        # Hashing reasoning for on-chain integrity
        reason_hash = hashlib.sha256(reasoning.encode()).hexdigest()
        
        print(f"[*] {self.name} placing {decision} bet on market {market_id}...")
        return {
            "status": "success",
            "tx_id": "MOCK_TX_ID",
            "reason_hash": reason_hash
        }

    def get_portfolio(self):
        """Returns the fund balance and investor metrics."""
        return {
            "balance": 5000.0,
            "investors": 12,
            "roi_pct": 14.5
        }

    def get_reputation(self):
        """Returns the ASA balance and score history."""
        return {
            "asa_id": self.reputation_asa_id,
            "balance": 1050,
            "score": 85
        }
