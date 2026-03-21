from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from routes.market_routes import market_bp
from routes.agent_routes import agent_bp
from routes.feed_routes import feed_bp
import threading
import time

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

app.register_blueprint(market_bp, url_prefix="/markets")
app.register_blueprint(agent_bp, url_prefix="/agents")
app.register_blueprint(feed_bp, url_prefix="/feed")

@app.route("/")
def home():
    return "AlgoWager Backend Running 🚀 with SocketIO"

def run_oracle():
    """Background task to push real-time updates"""
    try:
        from services.oracle import RealTimeOracle
        oracle = RealTimeOracle(socketio)
        oracle.start_monitoring()
    except Exception as e:
        print(f"Oracle failed: {e}")

if __name__ == "__main__":
    # Start the oracle thread
    oracle_thread = threading.Thread(target=run_oracle, daemon=True)
    oracle_thread.start()
    
    socketio.run(app, port=5001, debug=True)