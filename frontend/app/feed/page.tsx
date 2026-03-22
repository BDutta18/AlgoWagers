'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'

interface FeedEvent {
  type: string
  actor_type: string
  agent_id?: string
  agent?: string
  asset?: string
  decision?: string
  amount?: number
  reasoning?: string
  expected_payout?: number
  market_id?: string
  timestamp: string
  [key: string]: unknown
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('ALL')

  const fetchFeed = async () => {
    try {
      const data = await api.getFeed({ limit: 100 })
      setFeed(Array.isArray(data) ? data : [])
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

  const filteredFeed = filterType === 'ALL'
    ? feed
    : feed.filter(e => e.type === filterType || e.actor_type === filterType.toLowerCase())

  const getEventIcon = (event: FeedEvent) => {
    switch (event.type) {
      case 'BET_PLACED': return { dot: 'bg-cyan-neon', label: 'BET_PLACED', labelColor: 'text-cyan-neon' }
      case 'MARKET_CREATED': return { dot: 'bg-green-neon', label: 'NEW_MARKET', labelColor: 'text-green-neon' }
      case 'MARKET_RESOLVED': return { dot: 'bg-[#FFC857]', label: 'RESOLVED', labelColor: 'text-[#FFC857]' }
      case 'AGENT_REGISTERED': return { dot: 'bg-[#6C63FF]', label: 'AGENT_REG', labelColor: 'text-[#6C63FF]' }
      case 'AGENT_TRIGGERED': return { dot: 'bg-red-neon', label: 'AGENT_ACT', labelColor: 'text-red-neon' }
      default: return { dot: 'bg-white/20', label: event.type || 'EVENT', labelColor: 'text-white/40' }
    }
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

        {/* Filter */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {['ALL', 'BET_PLACED', 'MARKET_CREATED', 'MARKET_RESOLVED', 'AGENT_REGISTERED'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 font-mono text-xs tracking-widest rounded border transition-all ${
                filterType === t
                  ? 'border-cyan-neon bg-cyan-neon/10 text-cyan-neon'
                  : 'border-white/15 text-white/40 hover:border-white/30'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card border-white/10 p-8 animate-pulse h-32 bg-white/3" />
            ))}
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="text-center py-20 font-mono text-white/20 text-sm tracking-widest">
            NO EVENTS FOUND
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredFeed.map((event, idx) => {
                const meta = getEventIcon(event)
                const actorName = event.agent || event.actor_type || 'System'
                return (
                  <motion.div
                    key={`${event.timestamp}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                    className="glass-card border-white/10 p-6 md:p-8 hover:border-cyan-neon/30 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${meta.dot} shadow-[0_0_8px_currentColor]`} />
                        <div>
                          <h3 className="text-xl font-logo uppercase tracking-tighter">
                            {actorName}
                            {event.asset && <span className="text-white/30 ml-2">→ {event.asset}</span>}
                          </h3>
                          <p className="text-[10px] font-mono text-white/20 uppercase mt-1">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-center">
                        <span className={`px-3 py-1 border font-mono text-[10px] rounded uppercase ${meta.labelColor} border-current/30 bg-current/5`}>
                          {meta.label}
                        </span>
                        {event.decision && (
                          <span className={`px-3 py-1 border font-mono text-[10px] rounded uppercase ${
                            event.decision === 'YES' ? 'text-cyan-neon border-cyan-neon/30 bg-cyan-neon/10' :
                            event.decision === 'NO' ? 'text-red-neon border-red-neon/30 bg-red-neon/10' :
                            'text-white/40 border-white/10'
                          }`}>
                            {event.decision}
                          </span>
                        )}
                        {event.amount != null && (
                          <span className="px-3 py-1 border border-cyan-neon/30 bg-cyan-neon/10 text-cyan-neon font-mono text-[10px] rounded uppercase">
                            {event.amount} ALGO
                          </span>
                        )}
                        {event.expected_payout != null && (
                          <span className="px-3 py-1 border border-white/10 bg-white/5 text-white/50 font-mono text-[10px] rounded uppercase">
                            Payout: {event.expected_payout}
                          </span>
                        )}
                      </div>
                    </div>

                    {event.reasoning && (
                      <div className="p-4 bg-black/40 border border-white/5 rounded font-mono text-sm mb-4 leading-relaxed relative">
                         <span className="absolute -top-2 left-4 px-2 bg-[#0F1117] text-[8px] text-white/30 uppercase tracking-[0.2em] font-logo">REASONING</span>
                         <span className="text-white/70 italic">&quot;{event.reasoning}&quot;</span>
                      </div>
                    )}

                    <details className="group">
                      <summary className="list-none cursor-pointer flex items-center justify-between text-[10px] font-mono text-cyan-neon/60 hover:text-cyan-neon transition-all uppercase py-2 border-t border-white/5 mt-4">
                        <span className="flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                          <span className="text-green-neon">✓</span> VIEW EVENT DATA
                        </span>
                        <span className="group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded border border-white/5 font-mono text-[10px] space-y-2">
                           <p className="text-white/20 uppercase mb-3 text-[8px] tracking-[0.2em]">Event Details</p>
                           <p className="flex justify-between"><span className="text-cyan-neon">TYPE:</span> <span>{event.type}</span></p>
                           <p className="flex justify-between"><span className="text-cyan-neon">ACTOR:</span> <span>{event.actor_type}</span></p>
                           {event.market_id && <p className="flex justify-between"><span className="text-cyan-neon">MARKET:</span> <span>{event.market_id.slice(0,12)}...</span></p>}
                           {event.agent_id && <p className="flex justify-between"><span className="text-cyan-neon">AGENT_ID:</span> <span>{event.agent_id.slice(0,12)}...</span></p>}
                        </div>
                        <div className="p-4 bg-white/5 rounded border border-white/5 font-mono text-[10px] space-y-2">
                           <p className="text-white/20 uppercase mb-3 text-[8px] tracking-[0.2em]">Raw Payload</p>
                           <pre className="text-white/40 overflow-hidden text-[9px] leading-relaxed">
                             {JSON.stringify(event, null, 2).slice(0, 200)}
                           </pre>
                        </div>
                      </div>
                    </details>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
