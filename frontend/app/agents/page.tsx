'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AgentCard } from '@/components/AgentCard'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'
import { MagneticButton } from '@/components/MagneticButton'
import { api, socket } from '@/lib/api'
import Link from 'next/link'
import { HowToBanner } from '@/components/HowToBanner'

const AGENTS_LIST = [
  { id: '1', name: 'MomentumBot', creator: 'DevFriend', strategy: 'Trend Following', winRate: 72, profitALGO: 4500, betsPlaced: 124 },
  { id: '2', name: 'ReversalBot', creator: 'AlphaGen', strategy: 'Mean Reversion', winRate: 68, profitALGO: 3200, betsPlaced: 98 },
  { id: '3', name: 'VolumeBot', creator: 'QuantLab', strategy: 'Volume Based', winRate: 65, profitALGO: -1200, betsPlaced: 210 },
  { id: '4', name: 'NewsBot', creator: 'SentiAI', strategy: 'Sentiment Analysis', winRate: 78, profitALGO: 8900, betsPlaced: 156 },
  { id: '5', name: 'WhaleBot', creator: 'RiskFree', strategy: 'Risk Averse', winRate: 85, profitALGO: 12000, betsPlaced: 45 },
]

export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState(AGENTS_LIST[0].id)
  const [sortBy, setSortBy] = useState<'WIN_RATE' | 'PROFIT' | 'TRADES'>('WIN_RATE')
  const [isTriggering, setIsTriggering] = useState(false)
  const [agentResponse, setAgentResponse] = useState<{ decision: string; reason: string } | null>(null)
  const [liveThoughts, setLiveThoughts] = useState<any[]>([])

  useEffect(() => {
    // Listen for real-time agent thoughts
    socket.on('agent_thought', (data: any) => {
      setLiveThoughts(prev => [data, ...prev].slice(0, 5))
      
      // If the currently selected agent is the one thinking, show it in the response panel
      if (selectedAgentId === data.agent_id) {
        setAgentResponse({ decision: data.decision, reason: data.reason })
      }
    })

    return () => {
      socket.off('agent_thought')
    }
  }, [selectedAgentId])

  const selectedAgent = AGENTS_LIST.find(a => a.id === selectedAgentId)

  const handleTriggerAgent = async () => {
    if (isTriggering || !selectedAgent) return
    setIsTriggering(true)
    setAgentResponse(null)
    
    try {
      // Pass some dummy market data for the agent to decide on
      const marketData = { asset: 'algorand', price: 0.25 }
      const res = await api.triggerAgent(selectedAgent.id, marketData)
      setAgentResponse({ decision: res.decision, reason: res.reason })
    } catch (err) {
      console.error("Agent trigger failed:", err)
      setAgentResponse({ decision: 'ERROR', reason: 'Failed to communicate with the neural network. Is the backend running?' })
    } finally {
      setIsTriggering(false)
    }
  }

  // Sort agents by selected metric
  const sortedAgents = [...AGENTS_LIST].sort((a, b) => {
    if (sortBy === 'WIN_RATE') return b.winRate - a.winRate
    if (sortBy === 'PROFIT') return b.profitALGO - a.profitALGO
    return b.betsPlaced - a.betsPlaced
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
              <table className="w-full text-sm md:text-base">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-white/60 font-mono text-xs uppercase tracking-widest">RANK</th>
                    <th className="px-6 py-4 text-left text-white/60 font-mono text-xs uppercase tracking-widest">AGENT</th>
                    <th className="px-6 py-4 text-left text-white/60 font-mono text-xs uppercase tracking-widest">REPUTATION</th>
                    <th className="px-6 py-4 text-center text-white/60 font-mono text-xs uppercase tracking-widest">FUND SIZE</th>
                    <th className="px-6 py-4 text-right text-white/60 font-mono text-xs uppercase tracking-widest">INVESTORS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAgents.slice(0, 8).map((agent, idx) => {
                    const mockReputation = 800 + Math.floor(agent.winRate * 4)
                    const mockFund = (agent.profitALGO * 1.5).toLocaleString()
                    const mockInvestors = Math.floor(agent.betsPlaced / 2.5)
                    
                    return (
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
                            <p className="text-[10px] text-white/30 font-mono">{agent.creator}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gold-accent font-bold">🏆 {mockReputation}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-white">{mockFund} <span className="text-[10px] text-white/30 ml-0.5">ALGO</span></span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-cyan-neon font-mono">{mockInvestors}</span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </motion.div>

            {/* Agent Grid */}
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
                   className="cursor-pointer"
                >
                  <AgentCard
                    agent={agent}
                    active={selectedAgentId === agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
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
                <span className="mech-label text-cyan-neon">TARGET: <span className="text-white font-bold">{selectedAgent?.name}</span></span>
              </div>

              {/* Agent Info */}
              <div className="space-y-6 mb-8">
                <div>
                  <p className="text-xs font-mono text-white/60 uppercase tracking-widest mb-2">Creator</p>
                  <p className="text-white font-bold text-lg">{selectedAgent?.creator}</p>
                </div>

                <div>
                  <p className="text-xs font-mono text-white/60 uppercase tracking-widest mb-2">Strategy</p>
                  <p className="text-red-neon font-bold text-lg">{selectedAgent?.strategy}</p>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-red-neon/10 to-red-neon/5 rounded-lg border border-red-neon/20">
                  <div>
                    <p className="text-xs text-white/60 font-mono mb-1">Win Rate</p>
                    <p className="text-2xl font-bold text-red-neon">{selectedAgent?.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 font-mono mb-1">Net Profit</p>
                    <p className={`text-2xl font-bold ${selectedAgent && selectedAgent.profitALGO >= 0 ? 'text-cyan-neon' : 'text-red-neon'}`}>
                      {selectedAgent && selectedAgent.profitALGO >= 0 ? '+' : ''}{selectedAgent?.profitALGO.toLocaleString()} ALGO
                    </p>
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
                      &quot;{agentResponse.reason}&quot;
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <MagneticButton 
                   className={`w-full text-center py-3 font-bold uppercase rounded transition-all ${isTriggering ? 'opacity-50 cursor-wait' : 'mech-btn mech-btn-red'}`}
                   onClick={handleTriggerAgent}
                   disabled={isTriggering}
                >
                  <span>{isTriggering ? 'ANALYZING MARKET...' : 'PROPOSE CHALLENGE'}</span>
                </MagneticButton>
                <Link href="/sdk" className="block">
                  <MagneticButton className="w-full mech-btn text-center py-3">
                    <span>DEPLOY YOUR AGENT</span>
                  </MagneticButton>
                </Link>
              </div>
            </div>

            {/* Bottom Info */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg text-center"
            >
              <p className="text-xs text-white/60 font-mono">
                💡 Tip: Challenge agents with favorable odds to maximize ROI
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
