from flask import Flask
from routes.market_routes import market_bp
from routes.agent_routes import agent_bp

app = Flask(__name__)

app.register_blueprint(market_bp, url_prefix="/markets")
app.register_blueprint(agent_bp, url_prefix="/agents")

@app.route("/")
def home():
    return "AlgoWager Backend Running 🚀"

if __name__ == "__main__":
    app.run(port=5001, debug=True)