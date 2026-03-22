'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { MagneticButton } from '@/components/MagneticButton'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'

const MOCK_INVEST_AGENTS = [
  {
    id: '1',
    name: 'MOMENTUM_ALPHA',
    strategy: 'TREND_FOLLOWING',
    roi: '+24.8%',
    winRate: '78%',
    reputation: 1045,
    fundSize: '12,400',
    investors: 42,
    lastBets: ['WIN', 'WIN', 'LOSS', 'WIN', 'WIN'],
    description: 'Specializes in high-volume trend breakouts using RSI and MA crossovers.'
  },
  {
    id: '2',
    name: 'REVERSAL_OMEGA',
    strategy: 'MEAN_REVERSION',
    roi: '+12.4%',
    winRate: '65%',
    reputation: 890,
    fundSize: '8,200',
    investors: 19,
    lastBets: ['LOSS', 'WIN', 'WIN', 'WIN', 'LOSS'],
    description: 'Identifies overbought/oversold conditions using MACD and Bollinger Bands.'
  },
  {
    id: '3',
    name: 'SENTIMENT_AI',
    strategy: 'NEWS_ANALYSIS',
    roi: '+31.2%',
    winRate: '82%',
    reputation: 1250,
    fundSize: '45,000',
    investors: 128,
    lastBets: ['WIN', 'WIN', 'WIN', 'WIN', 'WIN'],
    description: 'Models market impact of real-time GNews headlines and social buzz.'
  }
]

export default function InvestPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  return (
    <div className="w-full min-h-screen px-6 md:px-12 py-12 lg:py-20">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <span className="mech-label text-red-neon block mb-4 tracking-[0.4em]">Investment Terminal Alpha-01</span>
          <h1 className="text-6xl md:text-8xl font-logo mb-6 leading-tight">
            FUND <GlitchDissolveText text="CAPITAL" glowColor="#FF2A1E" />
          </h1>
          <p className="text-white/40 font-mono text-sm md:text-base max-w-2xl tracking-wide uppercase">
            Deploy capital into verified, non-hallucinating AI agents. 
            Profit from autonomous strategies with full on-chain transparency.
          </p>
        </motion.div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Value Locked', val: '65,600 ALGO', color: 'var(--red-neon)' },
            { label: 'Active Investors', val: '189', color: 'var(--cyan-neon)' },
            { label: 'Avg ROI (24h)', val: '+18.4%', color: 'var(--gold-accent)' },
            { label: 'Markets Settled', val: '1,245', color: 'white' }
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-card p-6 border-white/5"
            >
              <span className="mech-label block mb-2">{s.label}</span>
              <p className="font-logo text-xl" style={{ color: s.color }}>{s.val}</p>
            </motion.div>
          ))}
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {MOCK_INVEST_AGENTS.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="slot-card group"
            >
              <div className="slot-brand">
                <span className="mech-label text-cyan-neon tracking-widest">{agent.strategy}</span>
                <div className="flex gap-1">
                  {agent.lastBets.map((res, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full ${res === 'WIN' ? 'bg-green-neon' : 'bg-red-neon'}`} />
                  ))}
                </div>
              </div>

              <h2 className="text-4xl font-logo mt-4 mb-2">{agent.name}</h2>
              <p className="text-white/30 font-mono text-xs mb-8 h-10 overflow-hidden line-clamp-2">
                {agent.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-white/5 border border-white/5 rounded">
                  <span className="mech-label text-[10px] block mb-1">REPUTATION</span>
                  <p className="text-gold-accent font-logo text-lg">🏆 {agent.reputation}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded">
                  <span className="mech-label text-[10px] block mb-1">WIN RATE</span>
                  <p className="text-cyan-neon font-logo text-lg">{agent.winRate}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded">
                  <span className="mech-label text-[10px] block mb-1">TOTAL ROI</span>
                  <p className="text-green-neon font-logo text-lg">{agent.roi}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded">
                  <span className="mech-label text-[10px] block mb-1">FUND SIZE</span>
                  <p className="text-white font-logo text-lg">{agent.fundSize} <span className="text-[10px] text-white/30">ALGO</span></p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center px-2 mb-2">
                  <span className="text-[10px] font-mono text-white/20 uppercase">STAKED BY {agent.investors} INVESTORS</span>
                  <span className="text-[10px] font-mono text-cyan-neon uppercase">MIRROR ACTIVE</span>
                </div>
                
                <div className="flex gap-2">
                  <MagneticButton className="mech-btn mech-btn-red flex-1 py-3 text-[0.7rem] justify-center">
                    <span>INVEST ALGO</span>
                  </MagneticButton>
                  <button className="flex-1 border border-white/10 hover:border-cyan-neon/40 hover:bg-cyan-neon/5 transition-all text-white/60 hover:text-cyan-neon font-logo text-[0.7rem] tracking-widest rounded px-4 py-3">
                    MIRROR
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Audit Footnote */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1 }}
           className="mt-20 py-8 border-t border-white/5 text-center"
        >
          <p className="text-white/10 font-mono text-[10px] tracking-[0.5em] uppercase">
            All agents are verified by the internal data bundle pipeline. Hallucinations are physically impossible by system design.
          </p>
        </motion.div>

      </div>
    </div>
  )
}
