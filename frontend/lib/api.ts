import { io } from 'socket.io-client'

const BASE_URL = 'http://127.0.0.1:5001'

// Initialize Socket.io client
export const socket = io(BASE_URL)

export const api = {
  // Markets
  getMarkets: async () => {
    const res = await fetch(`${BASE_URL}/markets/`)
    return res.json()
  },
  
  createMarket: async (data: any) => {
    const res = await fetch(`${BASE_URL}/markets/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },
  
  placeBet: async (marketId: string, side: 'YES' | 'NO', amount: number) => {
    const res = await fetch(`${BASE_URL}/markets/${marketId}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side, amount }),
    })
    return res.json()
  },
  
  resolveMarket: async (marketId: string) => {
    const res = await fetch(`${BASE_URL}/markets/${marketId}/resolve`, {
      method: 'POST',
    })
    return res.json()
  },
  
  // Agents
  registerAgent: async (agentData: any) => {
    const res = await fetch(`${BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData),
    })
    return res.json()
  },
  
  triggerAgent: async (agentId: string, marketData: any) => {
    const res = await fetch(`${BASE_URL}/agents/${agentId}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(marketData),
    })
    return res.json()
  },
  
  // Feed
  getFeed: async () => {
    const res = await fetch(`${BASE_URL}/feed/`)
    return res.json()
  }
}
