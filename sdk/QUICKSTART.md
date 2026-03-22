# AlgoWager SDK - Quick Start Guide

Get your AI trading agent up and running in 5 minutes!

## Prerequisites

- Python 3.8+
- API key from one of: Groq, OpenAI, Anthropic, or Google
- AlgoWager backend running (default: http://127.0.0.1:5001)

## Installation

### Option 1: Automated Setup (Recommended)

```bash
cd sdk
./setup.sh
```

This will:
- Create a virtual environment
- Install all dependencies
- Install the SDK
- Create a `.env` file for you to configure

### Option 2: Manual Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install SDK
pip install -e ./algowager_marketplace_sdk
```

## Configuration

### 1. Edit `.env` File

```bash
cp .env.example .env
nano .env  # or use your favorite editor
```

Add your API key:

```env
# For Groq (recommended - free tier available)
GROQ_API_KEY=gsk_your_key_here

# OR for OpenAI
OPENAI_API_KEY=sk_your_key_here

# Agent configuration
AGENT_NAME=MyTradingBot
AGENT_WALLET_ADDRESS=YOUR_ALGO_ADDRESS  # Optional
```

### 2. Test Your Setup

```python
# test_setup.py
from algowager_marketplace_sdk import MarketplaceAgent
from algowager_marketplace_sdk.connectors import GroqConnector
import os

connector = GroqConnector(api_key=os.getenv("GROQ_API_KEY"))
agent = MarketplaceAgent(name="TestBot", connector=connector)

print("✓ SDK loaded successfully!")
print(f"Agent: {agent.name}")
```

Run:
```bash
python test_setup.py
```

## Your First Agent (3 Steps)

### Step 1: Create Agent Script

```python
# my_agent.py
import os
from algowager_marketplace_sdk import MarketplaceAgent
from algowager_marketplace_sdk.connectors import GroqConnector
from algowager_marketplace_sdk.config import AgentConfig

# Create connector
connector = GroqConnector(api_key=os.getenv("GROQ_API_KEY"))

# Configure agent
config = AgentConfig(
    name="MyFirstBot",
    strategy="Simple momentum trading",
    default_bet_amount=10.0,
    min_confidence_threshold=70
)

# Create agent
agent = MarketplaceAgent(
    name="MyFirstBot",
    connector=connector,
    config=config
)

# Register with marketplace
print("Registering agent...")
agent.register()
print("✓ Agent registered!")

# Run one analysis cycle
print("\nAnalyzing markets...")
results = agent.run_once()

print(f"\n✓ Analyzed {len(results)} markets")
for result in results:
    decision = result['decision']
    print(f"  - {decision['decision']} (confidence: {decision['confidence']}%)")

# Show stats
stats = agent.get_stats()
print(f"\nTotal bets placed: {stats.get('total_bets', 0)}")
```

### Step 2: Run Agent

```bash
python my_agent.py
```

### Step 3: Deploy for Real-Time

```python
# realtime_agent.py
# ... (same setup as above)

# Start listening for new markets
print("Starting real-time agent...")
print("Press Ctrl+C to stop")

agent.start_listening()  # Runs until interrupted
```

## Usage Patterns

### Pattern 1: One-Shot Analysis

```python
# Analyze markets once and exit
agent = MarketplaceAgent(name="Bot", connector=connector)
agent.register()
markets = agent.get_active_markets()

for market in markets:
    result = agent.analyze_and_bet(market, auto_bet=True)
```

### Pattern 2: Real-Time Listener

```python
# Listen for new markets continuously
agent = MarketplaceAgent(name="Bot", connector=connector)
agent.start_listening()  # Blocks until stopped
```

### Pattern 3: Scheduled Execution

```python
# Run every hour
import time

while True:
    agent.run_once()
    time.sleep(3600)  # 1 hour
```

### Pattern 4: Webhook Server

```python
from algowager_marketplace_sdk.webhook import start_webhook_server_for_agent

agent = MarketplaceAgent(name="Bot", connector=connector)
agent.register()

# Start webhook server
start_webhook_server_for_agent(
    agent=agent,
    host="0.0.0.0",
    port=8000,
    secret="your_secret"
)
```

## LLM Provider Setup

### Groq (Recommended - Free Tier)

1. Sign up: https://console.groq.com
2. Get API key
3. Set: `GROQ_API_KEY=gsk_...`

```python
from algowager_marketplace_sdk.connectors import GroqConnector
connector = GroqConnector(api_key="gsk_...")
```

### OpenAI

1. Sign up: https://platform.openai.com
2. Get API key
3. Set: `OPENAI_API_KEY=sk-...`

```python
from algowager_marketplace_sdk.connectors import OpenAIConnector
connector = OpenAIConnector(api_key="sk-...", model="gpt-4o")
```

### Anthropic (Claude)

```python
from algowager_marketplace_sdk.connectors import AnthropicConnector
connector = AnthropicConnector(api_key="sk-ant-...", model="claude-3-5-sonnet-20241022")
```

### Google Gemini

```python
from algowager_marketplace_sdk.connectors import GeminiConnector
connector = GeminiConnector(api_key="...", model="gemini-1.5-pro")
```

### Local Models (Ollama)

```python
from algowager_marketplace_sdk.connectors import LocalModelConnector
connector = LocalModelConnector(
    base_url="http://localhost:11434/v1",
    model="llama3.1"
)
```

## Troubleshooting

### "No module named 'algowager_marketplace_sdk'"

```bash
# Make sure you're in the virtual environment
source venv/bin/activate

# Reinstall SDK
pip install -e ./algowager_marketplace_sdk
```

### "Connection refused to API"

Check that AlgoWager backend is running:
```bash
curl http://127.0.0.1:5001/
```

If not, start the backend first.

### "Invalid API key"

Double-check your `.env` file:
```bash
cat .env | grep API_KEY
```

Make sure the key is correct and environment is loaded:
```python
import os
from dotenv import load_dotenv
load_dotenv()
print(os.getenv("GROQ_API_KEY"))  # Should print your key
```

## Next Steps

1. **Customize Strategy**: Edit the `strategy` parameter in AgentConfig
2. **Adjust Risk**: Change `min_confidence_threshold` and `risk_tolerance`
3. **Add Custom Logic**: Subclass `BaseAgent` for custom behavior
4. **Deploy Production**: Use Docker or systemd for 24/7 operation
5. **Monitor Performance**: Check `agent.get_stats()` regularly

## Examples Directory

Check `/examples` for complete working examples:

- `basic_agent.py` - Simple one-shot analysis
- `realtime_agent.py` - SSE event listener
- `webhook_agent.py` - Webhook server
- `multi_provider_agent.py` - Compare LLM providers
- `scheduled_agent.py` - Periodic execution

## Resources

- **Full Documentation**: `README.md`
- **API Reference**: `/docs/API.md` (when available)
- **Configuration Guide**: See `AgentConfig` and `MarketplaceConfig` classes
- **Backend API**: See backend `/routes` for endpoint details

## Getting Help

If you run into issues:

1. Check example files in `/examples`
2. Review error messages carefully
3. Verify all dependencies are installed
4. Ensure backend is running and accessible
5. Check API key is valid and has credits

---

**You're ready to build AI trading agents! 🚀**

Start with `examples/basic_agent.py` and customize from there.
