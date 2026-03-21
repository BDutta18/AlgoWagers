from datetime import datetime, timedelta
import time
import threading
import random
from services.agent_runner import run_agent
from services.price_feed import get_crypto_price, get_stock_price
from models.market_store import markets
from controllers.feed_controller import add_event

AGENTS = [
    {"id": "1", "name": "LSTMBot", "strategy": "trend_following"},
    {"id": "2", "name": "ReversalBot", "strategy": "mean_reversion"},
    {"id": "3", "name": "VolumeBot", "strategy": "volume_based"},
    {"id": "4", "name": "NewsBot", "strategy": "sentiment"},
    {"id": "5", "name": "WhaleBot", "strategy": "risk_averse"}
]

# Dynamically fetch starting prices to generate live questions
try:
    btc_p = get_crypto_price("bitcoin")
except: btc_p = 64200.50

try:
    eth_p = get_crypto_price("ethereum")
except: eth_p = 3400.00

try:
    aapl_p = get_stock_price("AAPL")
except: aapl_p = 185.20

try:
    nvda_p = get_stock_price("NVDA")
except: nvda_p = 840.00

# Provide initial pre-populated markets to ensure UI is engaging at startup
if not markets:
    markets["101"] = {
        "id": "101", "asset": "bitcoin", "ticker": "BTC", "type": "crypto",
        "question": f"Will BTC close HIGHER than ${btc_p:,.2f} by tomorrow 12:00 UTC?",
        "start_price": btc_p, "yes_pool": 25000, "no_pool": 12000,
        "created_at": datetime.utcnow().isoformat(), "ends_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "resolved": False, "outcome": None, "agent_bets": []
    }
    markets["102"] = {
        "id": "102", "asset": "ethereum", "ticker": "ETH", "type": "crypto",
        "question": f"Will ETH exceed ${eth_p * 1.05:,.2f} (+5%) by Friday market close?",
        "start_price": eth_p, "yes_pool": 18000, "no_pool": 9000,
        "created_at": datetime.utcnow().isoformat(), "ends_at": (datetime.utcnow() + timedelta(hours=48)).isoformat(),
        "resolved": False, "outcome": None, "agent_bets": []
    }
    markets["103"] = {
        "id": "103", "asset": "AAPL", "ticker": "AAPL", "type": "stock",
        "question": f"Will Apple open higher than current ${aapl_p:,.2f} tomorrow?",
        "start_price": aapl_p, "yes_pool": 8000, "no_pool": 15000,
        "created_at": datetime.utcnow().isoformat(), "ends_at": (datetime.utcnow() + timedelta(hours=6)).isoformat(),
        "resolved": False, "outcome": None, "agent_bets": []
    }
    markets["104"] = {
        "id": "104", "asset": "NVDA", "ticker": "NVDA", "type": "stock",
        "question": f"Will NVIDIA (NVDA) gain more than 2% from ${nvda_p:,.2f} today?",
        "start_price": nvda_p, "yes_pool": 32000, "no_pool": 10000,
        "created_at": datetime.utcnow().isoformat(), "ends_at": (datetime.utcnow() + timedelta(hours=8)).isoformat(),
        "resolved": False, "outcome": None, "agent_bets": []
    }
    markets["105"] = {
        "id": "105", "asset": "Lakers vs Warriors", "ticker": "NBA", "type": "sports",
        "question": "Will the Lakers defeat the Warriors tonight? (LeBron James leads in pts/game)",
        "start_price": 0, "yes_pool": 45000, "no_pool": 41000,
        "created_at": datetime.utcnow().isoformat(), "ends_at": (datetime.utcnow() + timedelta(hours=5)).isoformat(),
        "resolved": False, "outcome": None, "agent_bets": []
    }
    markets["106"] = {
        "id": "106", "asset": "India vs Australia", "ticker": "CRICKET", "type": "sports",
        "question": "Will India score 300+ runs in the 1st innings? (Rohit Sharma - key player, 65% win rate)",
        "start_price": 0, "yes_pool": 78000, "no_pool": 54000,
        "created_at": datetime.utcnow().isoformat(), "ends_at": (datetime.utcnow() + timedelta(hours=12)).isoformat(),
        "resolved": False, "outcome": None, "agent_bets": []
    }


def create_market(data):
    from app import socketio # lazy import
    
    asset = data.get("asset", "algorand")
    m_type = data.get("type", "crypto")

    # Get initial price based on type
    start_price = get_crypto_price(asset) if m_type == "crypto" else 100

    m_id = str(len(markets) + 1)

    market = {
        "id": m_id,
        "asset": asset,
        "type": m_type,
        "start_price": start_price,
        "yes_pool": 0,
        "no_pool": 0,
        "created_at": datetime.utcnow().isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
        "resolved": False,
        "outcome": None,
        "agent_bets": []
    }

    markets[m_id] = market

    def process_agent_bets():
        import concurrent.futures
        
        battle_results = []
        all_agent_names = [a["name"] for a in AGENTS]
        
        # Trigger the frontend Battle Arena animation immediately
        socketio.emit('agent_thought', {"all_agents": all_agent_names})

        def run_single_agent(agent):
            # Visual delay for real-time inference feel
            time.sleep(1.5)
            try:
                # 🚀 The model prediction phase
                decision_data = run_agent(agent, asset, market_type=m_type)
            except Exception as e:
                decision_data = {"decision": "NO_BET", "confidence": 0, "reason": str(e)}

            evt = {
                "market_id": m_id,
                "agent_id": agent["id"],
                "agent": agent["name"],
                "decision": decision_data.get("decision", "NO_BET"),
                "confidence": decision_data.get("confidence", 80),
                "reason": decision_data.get("reason", ""),
                "metrics": decision_data.get("data_snapshot", {}).get("ml_metrics", None)
            }
            socketio.emit('agent_thought', evt)

            amount = int(100 * (decision_data.get("confidence", 80) / 100))
            
            # Update Market object with intent
            bet_record = {
                **decision_data,
                "amount": amount,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if decision_data.get("decision") in ["YES", "NO"]:
                res = {
                    "agent": agent["name"], 
                    "decision": decision_data["decision"],
                    "confidence": decision_data.get("confidence", 0),
                    "amount": amount,
                    "record": bet_record
                }
                return bet_record, res
            return bet_record, None
            
        # Run all 5 models concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(run_single_agent, agent) for agent in AGENTS]
            for future in concurrent.futures.as_completed(futures):
                try:
                    bet_record, res = future.result()
                    markets[m_id]["agent_bets"].append(bet_record)
                    if res:
                        battle_results.append(res)
                except Exception as e:
                    print(f"Agent thread error: {e}")

        # ⚔️ AGENT BATTLE RESOLUTION ⚔️
        # The AI with the highest confidence "wins" the battle and executes the on-chain wager.
        if battle_results:
            winner = max(battle_results, key=lambda x: x["confidence"])
            
            # Now apply the winning bet to the pool
            if winner["decision"] == "YES":
                markets[m_id]["yes_pool"] += winner["amount"]
            else:
                markets[m_id]["no_pool"] += winner["amount"]
                
            print(f"[ON-CHAIN EVENT] {winner['agent']} WON BATTLE -> Executing {winner['decision']}")
            
            # Broadcast the battle winner
            socketio.emit('agent_battle_winner', {
                "market_id": m_id,
                "winner": winner["agent"],
                "confidence": winner["confidence"],
                "decision": winner["decision"],
                "amount": winner["amount"],
                "tx_status": "PENDING_BLOCK"
            })
            
            # Add to Audit Feed representing the platform action
            tx_id = f"TX_{random.getrandbits(32):08X}"
            add_event({
                "id": tx_id,
                "taskName": "BET_EXEC",
                "status": "SETTLED",
                "amount": winner["amount"],
                "agent": winner["agent"],
                "decision": winner["decision"]
            })

    # Start bets in background
    threading.Thread(target=process_agent_bets, daemon=True).start()
    
    return market

def get_all_markets():
    result = []
    for m in markets.values():
        total = m["yes_pool"] + m["no_pool"]
        yes_prob = m["yes_pool"] / total if total else 0.5
        no_prob = m["no_pool"] / total if total else 0.5

        current_price = m.get("start_price", 100)
        # 🟢 LIVE PRICING ROUTER
        if m.get("type", "crypto") == "crypto":
            try:
                current_price = get_crypto_price(m["asset"])
            except Exception:
                pass 
        elif m.get("type") == "stock":
            try:
                current_price = get_stock_price(m["asset"])
            except Exception:
                pass

        result.append({
            "id": m["id"],
            "asset": m["asset"],
            "ticker": m.get("ticker", m["asset"].upper()),
            "type": m.get("type", "crypto"),
            "question": m.get("question", f"Will {m['asset'].upper()} be higher by market close?"),
            "price": current_price,
            "yes_prob": round(yes_prob, 2),
            "no_prob": round(no_prob, 2),
            "ends_at": m["ends_at"],
            "resolved": m["resolved"],
            "yes_pool": m["yes_pool"],
            "no_pool": m["no_pool"]
        })
    return result

def place_bet(m_id, data):
    market = markets[m_id]
    side = data["side"]
    amount = data["amount"]
    
    # 🟢 Generate dynamic audit event for the UI trail
    tx_id = f"TX_{random.getrandbits(32):08X}"
    add_event({
        "id": tx_id,
        "taskName": "ESCROW_LOCK",
        "status": "MINED",
        "amount": amount,
        "asset": market["asset"]
    })

    if side == "YES":
        market["yes_pool"] += amount
    else:
        market["no_pool"] += amount
    return {"message": "bet placed"}

def resolve_market(m_id):
    market = markets[m_id]
    end_price = get_crypto_price(market["asset"])
    outcome = "YES" if end_price > market["start_price"] else "NO"
    market["resolved"] = True
    market["outcome"] = outcome
    return {"outcome": outcome}