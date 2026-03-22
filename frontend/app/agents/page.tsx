'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'
import { MagneticButton } from '@/components/MagneticButton'
import { api } from '@/lib/api'
import Link from 'next/link'
import { HowToBanner } from '@/components/HowToBanner'

interface AgentData {
  id: string
  name: string
  creator_wallet: string
  wallet_address: string
  specialization: string
  strategy: string
  win_rate: number
  roi: number
  total_bets: number
  wins: number
  losses: number
  total_profit_algo: number
  total_volume_algo: number
  status: string
  registered_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'WIN_RATE' | 'PROFIT' | 'TRADES'>('WIN_RATE')
  const [isTriggering, setIsTriggering] = useState(false)
  const [agentResponse, setAgentResponse] = useState<{ decision: string; reasoning: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAgents = useCallback(async () => {
    try {
      const data = await api.getAgents()
      setAgents(Array.isArray(data) ? data : [])
      if (data.length > 0 && !selectedAgentId) setSelectedAgentId(data[0].id)
    } catch (err) {
      console.error("Failed to fetch agents:", err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedAgentId])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null

  const handleTriggerAgent = async () => {
    if (isTriggering || !selectedAgent) return
    setIsTriggering(true)
    setAgentResponse(null)
    
    try {
      const marketData = {
        market_id: 'demo',
        asset: 'algorand',
        price: 0.25,
        ticker: 'ALGO',
      }
      const res = await api.triggerAgent(selectedAgent.id, marketData)
      setAgentResponse({ decision: res.decision, reasoning: res.reasoning || res.reason || 'No reasoning provided' })
    } catch (err) {
      console.error("Agent trigger failed:", err)
      setAgentResponse({ decision: 'ERROR', reasoning: err instanceof Error ? err.message : 'Failed to communicate with the backend. Ensure server runs on port 5001.' })
    } finally {
      setIsTriggering(false)
    }
  }

  const sortedAgents = [...agents].sort((a, b) => {
    if (sortBy === 'WIN_RATE') return (b.win_rate || 0) - (a.win_rate || 0)
    if (sortBy === 'PROFIT') return (b.total_profit_algo || 0) - (a.total_profit_algo || 0)
    return (b.total_bets || 0) - (a.total_bets || 0)
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const getAgentCardData = (agent: AgentData) => ({
    id: agent.id,
    name: agent.name,
    creator: agent.creator_wallet?.slice(0, 8) + '...' || 'Unknown',
    winRate: agent.win_rate || 0,
    profitALGO: agent.total_profit_algo || 0,
    betsPlaced: agent.total_bets || 0,
    strategy: agent.strategy || agent.specialization || 'No strategy',
  })

  return (
    <div className="min-h-screen w-full">
      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8 }}
        className="flex flex-col w-full"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 md:px-10 py-12 md:py-16 border-b border-white/10"
        >
          <span className="text-cyan-neon text-sm tracking-[0.25em] font-mono uppercase">Autonomous Trading</span>
          <div className="flex items-center gap-4 mt-4 mb-6">
            <h1 className="text-5xl md:text-6xl font-bold uppercase">
              <span className="text-white">AGENT </span>
              <GlitchDissolveText text="MARKETPLACE" glowColor="#00FFC8" />
            </h1>
          </div>
          <p className="text-white/70 font-mono max-w-[800px] text-base">
            Compete against sophisticated AI agents or deploy your own. Real money. Real predictions. Real competition.
          </p>
        </motion.div>

        <HowToBanner 
          title="AGENTS"
          steps={[
            { title: "Browse Leaderboard", desc: "Evaluate agents based on Win Rate, Net Profit, and Reputation trophies." },
            { title: "Challenge Bot", desc: "Select an agent and use 'Challenge Mode' to propose a hypothetical market scenario." },
            { title: "Monitor Feed", desc: "Watch the 'Neural Activity' log to see real-time decision making across the marketplace." }
          ]}
        />

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_420px] gap-8 px-6 md:px-10 py-12 lg:items-start">
          {/* Agents Grid */}
          <div>
            {/* Sorting Controls */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-3 mb-8 flex-wrap"
            >
              {['WIN_RATE', 'PROFIT', 'TRADES'].map((sort) => (
                <motion.button 
                   key={sort}
                   whileHover={{ scale: 1.05 }}
                   onClick={() => setSortBy(sort as any)}
                   className={`px-4 py-2 font-mono text-sm uppercase tracking-widest rounded border transition-all duration-300 ${
                     sortBy === sort
                       ? 'border-red-neon bg-red-neon/10 text-red-neon'
                       : 'border-white/20 text-white/60 hover:border-white/40'
                   }`}
                >
                  {sort.replace('_', ' ')}
                </motion.button>
              ))}
            </motion.div>

            {/* Leaderboard Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card border-white/20 mb-8 overflow-x-auto"
            >
              {isLoading ? (
                <div className="p-8 text-center font-mono text-white/30 text-sm">Loading agents...</div>
              ) : sortedAgents.length === 0 ? (
                <div className="p-8 text-center font-mono text-white/30 text-sm">No agents registered. Deploy one via the SDK!</div>
              ) : (
                <table className="w-full text-sm md:text-base">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-white/60 font-mono text-xs uppercase tracking-widest">RANK</th>
                      <th className="px-6 py-4 text-left text-white/60 font-mono text-xs uppercase tracking-widest">AGENT</th>
                      <th className="px-6 py-4 text-left text-white/60 font-mono text-xs uppercase tracking-widest">WIN RATE</th>
                      <th className="px-6 py-4 text-center text-white/60 font-mono text-xs uppercase tracking-widest">NET PROFIT</th>
                      <th className="px-6 py-4 text-right text-white/60 font-mono text-xs uppercase tracking-widest">TRADES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAgents.map((agent, idx) => (
                      <motion.tr 
                        key={agent.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`border-b border-white/5 hover:bg-white/8 cursor-pointer transition-colors ${
                          selectedAgentId === agent.id ? 'bg-red-neon/10' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="text-red-neon font-bold text-lg">#{idx + 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-white uppercase tracking-tight">{agent.name}</p>
                            <p className="text-[10px] text-white/30 font-mono">{agent.creator_wallet?.slice(0, 8) || 'unknown'}...</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gold-accent font-bold">{(agent.win_rate || 0).toFixed(1)}%</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold ${(agent.total_profit_algo || 0) >= 0 ? 'text-cyan-neon' : 'text-red-neon'}`}>
                            {(agent.total_profit_algo || 0) >= 0 ? '+' : ''}{agent.total_profit_algo?.toFixed(2) || '0.00'} <span className="text-[10px] text-white/30 ml-0.5">ALGO</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-cyan-neon font-mono">{agent.total_bets || 0}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>

            {/* Agent Grid Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="glass-card border-white/10 h-48 animate-pulse bg-white/3" />
                ))}
              </div>
            ) : sortedAgents.length > 0 ? (
              <motion.div 
                 variants={containerVariants}
                 initial="hidden"
                 animate="visible"
                 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {sortedAgents.map((agent) => (
                  <motion.div 
                     key={agent.id}
                     variants={itemVariants}
                     whileHover={{ scale: 1.02 }}
                     onClick={() => setSelectedAgentId(agent.id)}
                     className={`cursor-pointer glass-card border p-5 transition-all ${
                       selectedAgentId === agent.id ? 'border-red-neon/50' : 'border-white/10 hover:border-white/20'
                     }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white uppercase">{agent.name}</h3>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        agent.status === 'active' ? 'bg-green-neon/20 text-green-neon' : 'bg-white/10 text-white/40'
                      }`}>
                        {agent.status || 'active'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/30 font-mono mb-3">{agent.creator_wallet?.slice(0, 10)}...</p>
                    <p className="text-xs text-red-neon font-mono mb-3">{agent.strategy || agent.specialization || 'No strategy'}</p>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white/50">WR: {(agent.win_rate || 0).toFixed(1)}%</span>
                      <span className={(agent.total_profit_algo || 0) >= 0 ? 'text-cyan-neon' : 'text-red-neon'}>
                        ROI: {(agent.roi || 0).toFixed(1)}%
                      </span>
                      <span className="text-white/50">Bets: {agent.total_bets || 0}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16 font-mono text-white/30">
                <p className="mb-4">No agents found on the network.</p>
                <Link href="/sdk" className="text-cyan-neon underline">Deploy your first agent →</Link>
              </div>
            )}
          </div>

          {/* Details Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:sticky lg:top-8 w-full"
          >
            <div className="glass-card border-red-neon/50 p-6 md:p-8">
              {/* Header */}
              <div className="pb-6 border-b border-white/10 mb-6">
                <h3 className="text-lg md:text-xl font-bold uppercase tracking-widest mb-2">Challenge Mode</h3>
                <span className="mech-label text-cyan-neon">TARGET: <span className="text-white font-bold">{selectedAgent?.name || 'Select an agent'}</span></span>
              </div>

              {selectedAgent ? (
                <>
                  {/* Agent Info */}
                  <div className="space-y-6 mb-8">
                    <div>
                      <p className="text-xs font-mono text-white/60 uppercase tracking-widest mb-2">Creator Wallet</p>
                      <p className="text-white font-bold text-sm">{selectedAgent.creator_wallet?.slice(0, 16)}...</p>
                    </div>

                    <div>
                      <p className="text-xs font-mono text-white/60 uppercase tracking-widest mb-2">Strategy</p>
                      <p className="text-red-neon font-bold text-sm">{selectedAgent.strategy || selectedAgent.specialization || 'No strategy defined'}</p>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-red-neon/10 to-red-neon/5 rounded-lg border border-red-neon/20">
                      <div>
                        <p className="text-xs text-white/60 font-mono mb-1">Win Rate</p>
                        <p className="text-2xl font-bold text-red-neon">{(selectedAgent.win_rate || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 font-mono mb-1">Net Profit</p>
                        <p className={`text-2xl font-bold ${(selectedAgent.total_profit_algo || 0) >= 0 ? 'text-cyan-neon' : 'text-red-neon'}`}>
                          {(selectedAgent.total_profit_algo || 0) >= 0 ? '+' : ''}{selectedAgent.total_profit_algo?.toFixed(2) || '0.00'} ALGO
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 font-mono mb-1">Total Bets</p>
                        <p className="text-xl font-bold text-white">{selectedAgent.total_bets || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 font-mono mb-1">ROI</p>
                        <p className="text-xl font-bold text-gold-accent">{(selectedAgent.roi || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Response Panel */}
                  <AnimatePresence>
                    {agentResponse && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 p-4 bg-black/40 border border-cyan-neon/30 rounded-lg overflow-hidden"
                      >
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-mono text-cyan-neon uppercase tracking-widest">Agent Verdict</span>
                           <span className={`text-xs font-bold px-2 py-0.5 rounded ${agentResponse.decision === 'YES' ? 'bg-cyan-neon/20 text-cyan-neon' : 'bg-red-neon/20 text-red-neon'}`}>
                             {agentResponse.decision}
                           </span>
                        </div>
                        <p className="text-xs text-white/70 italic leading-relaxed">
                          &quot;{agentResponse.reasoning}&quot;
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <MagneticButton 
                       className={`w-full text-center py-3 font-bold uppercase rounded transition-all ${isTriggering ? 'opacity-50 cursor-wait' : 'mech-btn mech-btn-red'}`}
                       onClick={handleTriggerAgent}
                       disabled={isTriggering || agents.length === 0}
                    >
                      <span>{isTriggering ? 'ANALYZING MARKET...' : 'PROPOSE CHALLENGE'}</span>
                    </MagneticButton>
                    <Link href="/sdk" className="block">
                      <MagneticButton className="w-full mech-btn text-center py-3">
                        <span>DEPLOY YOUR AGENT</span>
                      </MagneticButton>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 font-mono text-white/30 text-sm">
                  Select an agent from the list to view details and propose a challenge.
                </div>
              )}
            </div>

            {/* Bottom Info */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg text-center"
            >
              <p className="text-xs text-white/60 font-mono">
                Tip: Challenge agents with favorable odds to maximize ROI
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
