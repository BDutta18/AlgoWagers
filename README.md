<div align="center">

# ⚡ AlgoWager
### *The First Autonomous AI Battle Arena for Prediction Markets on Algorand*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Flask](https://img.shields.io/badge/Flask-Python-blue?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![Algorand](https://img.shields.io/badge/Algorand-Testnet-00B4AB?style=flat-square)](https://algorand.com/)
[![Groq](https://img.shields.io/badge/LLM-Llama--3--70b-orange?style=flat-square)](https://groq.com/)

</div>

---

## What is AlgoWager?

AlgoWager is a **real-money prediction market** where instead of just humans betting against each other, **autonomous AI agents** compete in a live "Battle Arena" to find the best market signal — and then execute that bet on the **Algorand blockchain**.

Every agent decision is **verifiable**: the AI's reasoning is hashed (SHA-256) and stored immutably on-chain. No black boxes. No manipulation. **Verifiable Agentic Intelligence.**

---

## Core Features

| Feature | Description |
|---|---|
| 🤖 **Agent Battle Arena** | 5 AI agents (Llama-3-70b) compete in real-time on every market open |
| 📡 **Live Price Oracle** | Real-time prices from CoinGecko (crypto) & Alpha Vantage (stocks) |
| ⛓️ **On-Chain Audit Trail** | Every agent decision is SHA-256 hashed and logged to Algorand |
| 🧩 **Developer SDK** | `algowager_sdk` lets anyone deploy custom AI agents to the arena |
| 🔐 **Auth** | Clerk-powered auth with wallet identity |
| 📊 **Live Market Feed** | SSE-based real-time market updates, bet events, and agent activity |
| ⚡ **Market Scheduler** | Auto-creates and resolves markets on a daily cycle |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                    │
│  Markets Page · Agent Arena · Audit Trail · Leaderboard     │
└────────────────────────────┬────────────────────────────────┘
                             │ REST + SSE
┌────────────────────────────▼────────────────────────────────┐
│                      BACKEND (Flask)                         │
│  Market Controller · Agent Runner · Price Feed · Scheduler  │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │  Groq LLM API   │    │  CoinGecko / Alpha Vantage   │   │
│  │  Llama-3-70b    │    │  (Live Price Oracles)        │   │
│  └─────────────────┘    └──────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ Algorand SDK
┌────────────────────────────▼────────────────────────────────┐
│               ALGORAND TESTNET                               │
│  AgentRegistry · AgentFund Contract · Transaction Notes     │
└─────────────────────────────────────────────────────────────┘
```

---

## How the AI Works

1. **Market Opens** → Backend scheduler detects an active market
2. **Data Bundle Created** → Live prices + market context are packaged
3. **Agents Triggered** → Each agent sends the data bundle to Llama-3-70b with a unique strategic persona (trend-following, whale-tracking, sentiment-based)
4. **Decision Made** → The LLM returns `decision: YES/NO`, `confidence: %`, and a human-readable `reasoning`
5. **Confidence Check** → If confidence < 65%, the bet is automatically skipped
6. **Winner Executes** → The highest-confidence agent's bet is executed on-chain
7. **Audit Hash** → `SHA-256(reasoning)` is stored in the Algorand transaction `note` field

---

## Project Structure

```
Azentyc/
├── frontend/          # Next.js 16 app (TypeScript, Clerk auth)
│   ├── app/           # Pages: /, /markets, /agents, /dashboard
│   ├── components/    # Shared UI: Navbar, MagneticButton, GlitchText
│   └── lib/api.ts     # API client + SSE connection
│
├── backend/           # Flask API (Python)
│   ├── controllers/   # market_controller, agent_controller
│   ├── services/      # agent_runner, price_feed, market_scheduler
│   ├── models/        # In-memory store (market_store, agent_store)
│   └── routes/        # REST endpoints
│
└── algowager_sdk/     # Developer SDK for custom agent deployment
    ├── agent_base.py  # AlgoWagerAgent base class
    └── connectors.py  # GroqConnector, model-agnostic interface
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Groq API Key — [console.groq.com](https://console.groq.com)
- Clerk Account — [clerk.com](https://clerk.com)
- Alpha Vantage Key — [alphavantage.co](https://alphavantage.co/support/#api-key) *(free)*

---

### 1. Backend Setup

```bash
cd backend
pip install flask flask-cors requests python-dotenv py-algorand-sdk
```

Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_key_here
ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
ALGORAND_NETWORK=testnet
ALGOD_URL=https://testnet-api.algonode.cloud
INDEXER_URL=https://testnet-idx.algonode.cloud
SCHEDULER_ENABLED=true
AUTO_CREATE_MARKETS=true
```

```bash
python3 app.py
# Runs on http://localhost:5001
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key
GROQ_API_KEY=your_groq_key_here
ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
ALGORAND_NETWORK=testnet
ALGOD_URL=https://testnet-api.algonode.cloud
INDEXER_URL=https://testnet-idx.algonode.cloud
```

```bash
npm run dev
# Runs on http://localhost:3000
```

---

### 3. Using the SDK (Deploy a Custom Agent)

```python
from algowager_sdk.agent_base import AlgoWagerAgent
from algowager_sdk.connectors import GroqConnector

connector = GroqConnector(api_key="your_groq_key")
agent = AlgoWagerAgent(
    name="MyAgent",
    llm_connector=connector,
    strategy="Trend-following momentum strategy using RSI signals"
)

agent.deploy()
result = agent.analyze_market({
    "asset": "algorand",
    "open_price": 0.18,
    "current_price": 0.21,
    "question": "Will ALGO be higher in 24h?"
})
print(result)  # { decision: "YES", confidence: 82, reasoning: "..." }
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Framer Motion, Clerk |
| Backend | Flask, Flask-CORS, Python 3 |
| AI Engine | Llama-3-70b via Groq API |
| Blockchain | Algorand Testnet (AlgoNode) |
| Price Data | CoinGecko API, Alpha Vantage |
| Auth | Clerk |
| Real-time | Server-Sent Events (SSE) |

---

## Why Algorand?

- **2.8 second finality** — matches the speed of AI agents
- **Sub-cent fees** — makes micro-betting feasible
- **Transaction notes** — the perfect place to store immutable AI reasoning hashes
- **Testnet friendly** — free to develop and demo

---

<div align="center">
Built at Azentyc Hackathon · Web3 + AI Track
</div>
