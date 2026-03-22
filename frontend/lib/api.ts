const BASE_URL = 'http://127.0.0.1:5001'

export const api = {
  getMarkets: async (params?: { type?: string; status?: string }) => {
    const url = new URL(`${BASE_URL}/markets/`)
    if (params?.type) url.searchParams.set('type', params.type)
    if (params?.status) url.searchParams.set('status', params.status)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Failed to fetch markets: ${res.status}`)
    return res.json()
  },

  getMarket: async (marketId: string) => {
    const res = await fetch(`${BASE_URL}/markets/${marketId}`)
    if (!res.ok) throw new Error(`Failed to fetch market: ${res.status}`)
    return res.json()
  },

  createMarket: async (data: { asset: string; close_time?: string }) => {
    const res = await fetch(`${BASE_URL}/markets/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`Failed to create market: ${res.status}`)
    return res.json()
  },

  seedMarkets: async () => {
    const res = await fetch(`${BASE_URL}/markets/seed`, { method: 'POST' })
    if (!res.ok) throw new Error(`Failed to seed markets: ${res.status}`)
    return res.json()
  },

  placeBet: async (marketId: string, side: 'YES' | 'NO', amount: number) => {
    const res = await fetch(`${BASE_URL}/markets/${marketId}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side, amount }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(err.error || `Bet failed: ${res.status}`)
    }
    return res.json()
  },

  resolveMarket: async (marketId: string) => {
    const res = await fetch(`${BASE_URL}/markets/${marketId}/resolve`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error(`Failed to resolve market: ${res.status}`)
    return res.json()
  },

  getAgents: async () => {
    const res = await fetch(`${BASE_URL}/agents/`)
    if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`)
    return res.json()
  },

  getAgent: async (agentId: string) => {
    const res = await fetch(`${BASE_URL}/agents/${agentId}`)
    if (!res.ok) throw new Error(`Agent not found: ${res.status}`)
    return res.json()
  },

  getAgentLeaderboard: async (limit = 10) => {
    const res = await fetch(`${BASE_URL}/agents/leaderboard?limit=${limit}`)
    if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${res.status}`)
    return res.json()
  },

  getAgentHistory: async (agentId: string) => {
    const res = await fetch(`${BASE_URL}/agents/${agentId}/history`)
    if (!res.ok) throw new Error(`Failed to fetch agent history: ${res.status}`)
    return res.json()
  },

  registerAgent: async (agentData: {
    name: string
    creator_wallet: string
    specialization?: string
    strategy?: string
    webhook_url?: string
    api_key?: string
    model?: string
    default_bet_amount?: number
  }) => {
    const res = await fetch(`${BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(err.error || `Registration failed: ${res.status}`)
    }
    return res.json()
  },

  triggerAgent: async (agentId: string, marketData: { market_id?: string; asset?: string; price?: number; ticker?: string }) => {
    const res = await fetch(`${BASE_URL}/agents/${agentId}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(marketData),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(err.error || `Agent trigger failed: ${res.status}`)
    }
    return res.json()
  },

  getFeed: async (params?: { limit?: number; event_type?: string; actor_type?: string }) => {
    const url = new URL(`${BASE_URL}/feed/`)
    if (params?.limit) url.searchParams.set('limit', String(params.limit))
    if (params?.event_type) url.searchParams.set('event_type', params.event_type)
    if (params?.actor_type) url.searchParams.set('actor_type', params.actor_type)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`)
    return res.json()
  },

  getSSEUrl: () => `${BASE_URL}/agents/ws/events`,
}
