export interface Market {
  id: string
  asset: string
  ticker: string
  question: string
  yesPoolALGO: number
  noPoolALGO: number
  closeTime: string
  volume: number
}

export interface Agent {
  id: string
  name: string
  creator: string
  winRate: number
  profitALGO: number
  betsPlaced: number
  strategy: string
}

export const MOCK_MARKETS: Market[] = [
  { id: 'm1', asset: 'Bitcoin', ticker: 'BTC', question: 'Will BTC be higher tomorrow at 12:00 UTC?', yesPoolALGO: 45000, noPoolALGO: 12000, closeTime: '12:00 UTC', volume: 57000 },
  { id: 'm2', asset: 'Ethereum', ticker: 'ETH', question: 'Will ETH exceed $4,000 by Friday close?', yesPoolALGO: 8200, noPoolALGO: 15400, closeTime: 'Fri 16:00 UTC', volume: 23600 },
  { id: 'm3', asset: 'Algorand', ticker: 'ALGO', question: 'Will ALGO rise 5% against USDT in 24h?', yesPoolALGO: 55000, noPoolALGO: 45000, closeTime: 'Tomorrow 00:00', volume: 100000 },
  { id: 'm4', asset: 'Tesla', ticker: 'TSLA', question: "Will TSLA open higher than yesterday's close?", yesPoolALGO: 1250, noPoolALGO: 8900, closeTime: 'Tomorrow 09:30 EST', volume: 10150 },
]

export const MOCK_AGENTS: Agent[] = [
  { id: 'a1', name: 'NIGHTMARE_CAPITAL', creator: '0x43..A6', winRate: 68.4, profitALGO: 145000, betsPlaced: 1240, strategy: 'On-chain flow momentum' },
  { id: 'a2', name: 'QUANTUM_ARBITRAGE', creator: '0x99..11', winRate: 54.2, profitALGO: 22000, betsPlaced: 5040, strategy: 'Mean reversion stat-arb' },
  { id: 'a3', name: 'SENTIMENT_ORACLE', creator: '0x22..8B', winRate: 61.0, profitALGO: 8500, betsPlaced: 312, strategy: 'GNews API NLP sentiment' },
  { id: 'a4', name: 'VOLATILITY_HUNTER', creator: '0x71..FF', winRate: 48.9, profitALGO: 1100, betsPlaced: 890, strategy: 'Options-implied volatility targeting' },
]

export interface TerminalEvent {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'event'
  message: string
  timestamp: string
}

export interface AuditEntry {
  id: string
  taskName: string
  status: string
  amount: number
}

export const generateAuditEntry = (index: number): AuditEntry => {
  return {
    id: `tx_${Math.random().toString(36).slice(2, 11)}`,
    taskName: ['BET_EXEC', 'ESCROW_LOCK', 'ORACLE_RES'][index % 3],
    status: ['SETTLED', 'MINED', 'CONFIRMED'][index % 3],
    amount: Math.floor(Math.random() * 500) + 10
  }
}
