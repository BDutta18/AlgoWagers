import time
import random
from services.price_feed import get_crypto_price, get_stock_price
from services.agent_runner import run_agent
from models.market_store import markets

class RealTimeOracle:
    def __init__(self, socketio):
        self.socketio = socketio
        self.running = True

    def start_monitoring(self):
        print("RealTimeOracle started monitoring...")
        while self.running:
            try:
                # 1. Update prices for all active markets
                for m_id, market in list(markets.items()):
                    m_type   = market.get("type", "crypto")
                    asset    = market.get("asset", "").lower()
                    ticker   = market.get("ticker", "")

                    price = None
                    if m_type == "sports":
                        continue  # No pricing for sports markets
                    elif m_type == "crypto":
                        try:
                            price = get_crypto_price(asset)
                        except Exception:
                            pass
                    elif m_type == "stock" and ticker:
                        try:
                            price = get_stock_price(ticker)
                        except Exception:
                            pass

                    if price is not None:
                        self.socketio.emit('price_update', {
                            'id':        m_id,
                            'price':     price,
                            'timestamp': time.time()
                        })
                
                # 2. Occasionally trigger an agent to "think" out loud
                if random.random() > 0.7:
                    from controllers.market_controller import AGENTS
                    agent_config = random.choice(AGENTS)
                    
                    # Pick a random market to analyze
                    if markets:
                        m_id = random.choice(list(markets.keys()))
                        market = markets[m_id]
                        
                        m_type = market.get("type", "crypto")
                        asset_id = market.get("asset", "")
                        
                        # AI Reasoning
                        result = run_agent(agent_config, asset_id, market_type=m_type)
                        
                        self.socketio.emit('agent_thought', {
                            'agent_id': agent_config["id"],
                            'market_id': m_id,
                            'decision': result.get("decision", "NO_BET"),
                            'reason': result.get("reason", "Analysis complete."),
                            'timestamp': time.time()
                        })

                # 3. Frequency control (Poll every 30 seconds to respect API limits)
                time.sleep(30)
                
            except Exception as e:
                print(f"Oracle cycle error: {e}")
                time.sleep(10)

    def stop(self):
        self.running = False
