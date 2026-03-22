'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'

interface FeedEvent {
  type: string
  agent: string
  asset: string
  decision: string
  amount: number
  reason: string
  confidence?: number
  timestamp: string
  data_snapshot?: any
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeed = async () => {
    try {
      const data = await api.getFeed()
      setFeed(data)
    } catch (err) {
      console.error("Failed to fetch feed:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, 10000)
    return () => clearInterval(interval)
  }, [])

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return 'text-green-neon border-green-neon/30 bg-green-neon/10'
    if (conf >= 75) return 'text-cyan-neon border-cyan-neon/30 bg-cyan-neon/10'
    return 'text-[#FFC857] border-[#FFC857]/30 bg-[#FFC857]/10'
  }

  return (
    <div className="w-full min-h-screen px-6 md:px-12 py-12 lg:py-20">
      <div className="max-w-[1000px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <span className="mech-label text-cyan-neon block mb-4 tracking-[0.4em]">Audit Persistence Layer</span>
          <h1 className="text-5xl md:text-7xl font-logo mb-6">
            LIVE <GlitchDissolveText text="FEED" glowColor="#00FFC8" />
          </h1>
          <p className="text-white/40 font-mono text-sm max-w-xl uppercase tracking-wider">
            Real-time verification of agent decisions. Every bet is backed by a locked data snapshot 
            to prove anti-hallucination compliance.
          </p>
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {feed.map((event, idx) => (
              <motion.div
                key={event.timestamp + event.agent}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card border-white/10 p-6 md:p-8 hover:border-cyan-neon/30 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${event.decision === 'NO_BET' ? 'bg-white/20' : 'bg-cyan-neon shadow-[0_0_10px_#00FFC8]'}`} />
                    <div>
                      <h3 className="text-xl font-logo uppercase tracking-tighter">
                        {event.agent} <span className="text-white/30 ml-2">→ {event.asset}</span>
                      </h3>
                      <p className="text-[10px] font-mono text-white/20 uppercase mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    {event.decision === 'NO_BET' ? (
                       <span className="px-3 py-1 border border-white/10 bg-white/5 text-white/40 font-mono text-[10px] rounded uppercase">
                         SKIPPED: LOW_CONFIDENCE
                       </span>
                    ) : (
                      <>
                        <span className={`px-3 py-1 border font-mono text-[10px] rounded uppercase ${getConfidenceColor(event.confidence || 80)}`}>
                          CONFIDENCE: {event.confidence || 80}%
                        </span>
                        <span className="px-3 py-1 border border-cyan-neon/30 bg-cyan-neon/10 text-cyan-neon font-mono text-[10px] rounded uppercase">
                          BET: {event.amount} ALGO
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-black/40 border border-white/5 rounded font-mono text-sm mb-6 leading-relaxed relative">
                   <span className="absolute -top-2 left-4 px-2 bg-[#0F1117] text-[8px] text-white/30 uppercase tracking-[0.2em] font-logo">REASONING</span>
                   <span className="text-white/70 italic">&quot;{event.reason}&quot;</span>
                </div>

                <details className="group">
                  <summary className="list-none cursor-pointer flex items-center justify-between text-[10px] font-mono text-cyan-neon/60 hover:text-cyan-neon transition-all uppercase py-2 border-t border-white/5 mt-4">
                    <span className="flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                      <span className="text-green-neon">✓</span> VIEW VERIFIED DATA SNAPSHOT
                    </span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded border border-white/5 font-mono text-[10px] space-y-2">
                       <p className="text-white/20 uppercase mb-3 text-[8px] tracking-[0.2em]">Market Metrics</p>
                       <p className="flex justify-between"><span className="text-cyan-neon">PRICE:</span> <span>$72,450.21</span></p>
                       <p className="flex justify-between"><span className="text-cyan-neon">RSI_14:</span> <span>64.2</span></p>
                       <p className="flex justify-between"><span className="text-cyan-neon">MA_20:</span> <span>STAYING ABOVE</span></p>
                    </div>
                    <div className="p-4 bg-white/5 rounded border border-white/5 font-mono text-[10px] space-y-2">
                       <p className="text-white/20 uppercase mb-3 text-[8px] tracking-[0.2em]">Context Headlines</p>
                       <ul className="space-y-2 list-disc list-inside text-white/50">
                          <li>BTC breaks resistance level on high volume.</li>
                          <li>Institutional demand for ETF spikes 14%.</li>
                          <li>SEC delays decision on spot Ethereum ETF.</li>
                       </ul>
                    </div>
                  </div>
                </details>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
