import random
from datetime import datetime, timedelta

def _generate_initial_feed():
    initial = []
    for i in range(8):
        tx_id = f"TX_{random.getrandbits(32):08X}"
        initial.append({
            "id": tx_id,
            "taskName": random.choice(["BET_EXEC", "ESCROW_LOCK", "ORACLE_RES"]),
            "status": random.choice(["SETTLED", "MINED", "CONFIRMED"]),
            "amount": random.randint(50, 800),
            "timestamp": (datetime.utcnow() - timedelta(minutes=random.randint(2, 60))).isoformat()
        })
    return sorted(initial, key=lambda x: x["timestamp"], reverse=True)

feed = _generate_initial_feed()
