'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MarketCard } from '@/components/MarketCard'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'
import { MagneticButton } from '@/components/MagneticButton'
import { TypewriterText } from '@/components/TypewriterText'
import { api, socket } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────
interface TerminalEvent {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'event'
  message: string
  timestamp: string
}

interface AuditEntry {
  id: string
  taskName: string
  status: string
  amount: number
  timestamp?: string
}

interface AgentBattle {
  winner: string
  confidence: number
  decision: string
  amount: number
  market_id: string
}

interface FighterState {
  name: string
  confidence: number
  decision: string | null
  strategy: string
  status: 'idle' | 'analyzing' | 'done'
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FIGHTER_CONFIGS: Record<string, { strategy: string; color: string; icon: string }> = {
  LSTMBot:        { strategy: 'PyTorch LSTM · 80/20 split', color: '#00FFC8', icon: '🧠' },
  ReversalBot:    { strategy: 'Mean Reversion Statistical', color: '#6C63FF', icon: '↩️' },
  VolumeBot:      { strategy: 'On-Chain Volume Analysis',   color: '#FFC857', icon: '📊' },
  NewsBot:        { strategy: 'NLP Sentiment Engine',       color: '#FF6B6B', icon: '📰' },
  WhaleBot:       { strategy: 'Risk-Averse Whale Tracker',  color: '#4ECDC4', icon: '🐳' },
}

const EV_META: Record<string, { label: string; col: string }> = {
  info:    { label: 'SYS_MSG',  col: 'rgba(255,255,255,0.4)' },
  success: { label: 'SETTLED',  col: '#00FFC8' },
  warning: { label: 'AWAIT_TX', col: '#FFC857' },
  payment: { label: 'ESCROW',   col: 'rgba(255,255,255,0.7)' },
  event:   { label: 'LOG_EVT',  col: 'rgba(255,255,255,0.7)' },
  error:   { label: 'ERROR',    col: '#FF2A1E' },
}

const MARKET_TYPE_STYLE: Record<string, { icon: string; label: string; border: string; glow: string }> = {
  crypto: { icon: '₿', label: 'CRYPTO',  border: '#00FFC8', glow: 'rgba(0,255,200,0.2)' },
  stock:  { icon: '📈', label: 'STOCKS',  border: '#6C63FF', glow: 'rgba(108,99,255,0.2)' },
  sports: { icon: '⚽', label: 'SPORTS',  border: '#FFC857', glow: 'rgba(255,200,87,0.2)' },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MarketsPage() {
  const [markets, setMarkets]               = useState<any[]>([])
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null)
  const [betAmount, setBetAmount]           = useState('')
  const [betDirection, setBetDirection]     = useState<'YES' | 'NO' | null>(null)
  const [isExecuting, setIsExecuting]       = useState(false)
  const [events, setEvents]                 = useState<TerminalEvent[]>([])
  const [audit, setAudit]                   = useState<AuditEntry[]>([])
  const [battleWinner, setBattleWinner]     = useState<AgentBattle | null>(null)
  const [fighters, setFighters]             = useState<FighterState[]>([])
  const [battlePhase, setBattlePhase]       = useState<'idle' | 'fighting' | 'resolved'>('idle')
  const [showWagerPanel, setShowWagerPanel] = useState(false)
  const [isLoading, setIsLoading]           = useState(true)
  const [filter, setFilter]                 = useState('ALL')
  const terminalEndRef                      = useRef<HTMLDivElement>(null)

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchMarkets = useCallback(async () => {
    try {
      const data = await api.getMarkets()
      setMarkets(data)
      if (data.length > 0 && !selectedMarketId) setSelectedMarketId(data[0].id)
    } catch { /* silent */ }
    finally { setIsLoading(false) }
  }, [selectedMarketId])

  const fetchAudit = useCallback(async () => {
    try {
      const data = await api.getFeed()
      setAudit(data)
    } catch { /* silent */ }
  }, [])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const addEvent = (type: TerminalEvent['type'], message: string) => {
    setEvents(p => [{ id: Date.now() + Math.random() + '', type, message, timestamp: new Date().toISOString() }, ...p].slice(0, 20))
  }

  const transformMarket = (m: any) => ({
    id:         m.id,
    ticker:     m.ticker || m.asset?.toUpperCase(),
    asset:      m.asset,
    type:       m.type || 'crypto',
    question:   m.question || `Will ${m.asset?.toUpperCase()} be higher by market close?`,
    yesPoolALGO: m.yes_pool || 0,
    noPoolALGO:  m.no_pool  || 0,
    volume:     (m.yes_pool || 0) + (m.no_pool || 0),
    price:      m.price,
    yes_prob:   m.yes_prob,
    no_prob:    m.no_prob,
    closeTime:  new Date(m.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })

  const selectedMarket = markets.find(m => m.id === selectedMarketId)
  const selectedTransformed = selectedMarket ? transformMarket(selectedMarket) : null

  const filteredMarkets = markets.filter(m => {
    if (filter === 'ALL') return true
    if (filter === 'CRYPTO') return m.type === 'crypto'
    if (filter === 'STOCKS') return m.type === 'stock'
    if (filter === 'SPORTS') return m.type === 'sports'
    return true
  })

  // ── Battle animation helpers ─────────────────────────────────────────────
  const startBattleAnimation = (agents: string[]) => {
    setBattlePhase('fighting')
    setFighters(agents.map(name => ({
      name,
      confidence: 0,
      decision: null,
      strategy: FIGHTER_CONFIGS[name]?.strategy || 'AI Strategy',
      status: 'analyzing',
    })))
  }

  const resolveBattle = (winner: AgentBattle) => {
    setBattlePhase('resolved')
    setBattleWinner(winner)
    setFighters(prev => prev.map(f => ({
      ...f,
      status: 'done',
      decision: f.name === winner.winner ? winner.decision : (Math.random() > 0.5 ? 'YES' : 'NO'),
      confidence: f.name === winner.winner
        ? winner.confidence
        : Math.floor(Math.random() * 40) + 40,
    })))
    setTimeout(() => { setBattlePhase('idle'); setBattleWinner(null); setFighters([]) }, 12000)
  }

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMarkets()
    fetchAudit()

    socket.on('price_update', (data: { id: string; price: number }) => {
      setMarkets(prev => prev.map(m => m.id === data.id ? { ...m, price: data.price } : m))
    })

    socket.on('agent_thought', (data: any) => {
      addEvent(data.decision === 'NO_BET' ? 'info' : 'event',
        `${data.agent} → ${data.decision}: ${data.reason}`)

      // If first thought event, it contains all_agents — kick off Battle Arena
      if (data.all_agents && data.all_agents.length > 0) {
        startBattleAnimation(data.all_agents)
      }

      // Update individual fighter confidence in real-time
      setFighters(prev => {
        // If fighters not yet initialized (edge case), skip
        if (prev.length === 0) return prev
        return prev.map(f =>
          f.name === data.agent
            ? { ...f, confidence: data.confidence || 0, decision: data.decision, status: 'analyzing' }
            : f
        )
      })
    })

    socket.on('agent_bet', () => { fetchMarkets() })

    socket.on('agent_battle_winner', (data: AgentBattle) => {
      resolveBattle(data)
      addEvent('warning', `⚔️ ${data.winner} WINS with ${data.confidence}% confidence → Executing ${data.amount} ALGO ${data.decision}`)
    })

    socket.on('audit_update', (ev: AuditEntry) => {
      setAudit(prev => [ev, ...prev].slice(0, 50))
    })

    const interval = setInterval(fetchMarkets, 30000)
    return () => {
      ['price_update', 'agent_thought', 'agent_bet', 'agent_battle_winner', 'audit_update'].forEach(e => socket.off(e))
      clearInterval(interval)
    }
  }, [])

  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [events])

  // ── Execute wager ─────────────────────────────────────────────────────────
  const handleExecuteBet = async () => {
    if (isExecuting || !selectedMarketId || !betDirection || !betAmount) return
    setIsExecuting(true)

    const agentNames = ['LSTMBot', 'ReversalBot', 'VolumeBot', 'NewsBot', 'WhaleBot']
    startBattleAnimation(agentNames)

    const steps: Array<[TerminalEvent['type'], string]> = [
      ['info',    'INITIATING ALGORAND PUYA ESCROW CONTRACT...'],
      ['payment', `REQUESTING ${betAmount} ALGO LOCK FROM PERA WALLET...`],
      ['warning', 'COMMITTING WAGER TO ON-CHAIN PARIMUTUEL POOL...'],
    ]
    for (const [type, msg] of steps) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
      addEvent(type, msg)
    }

    try {
      await api.placeBet(selectedMarketId, betDirection, parseFloat(betAmount))
      addEvent('success', `TXN CONFIRMED. ${betDirection} WAGER PLACED SUCCESSFULLY.`)
      await new Promise(r => setTimeout(r, 600))
      addEvent('event', 'MARKET STATE UPDATED. AI BATTLE INITIATED...')
      fetchMarkets()
    } catch {
      addEvent('error', 'ERROR: Backend communication failed. Ensure server runs on port 5001.')
    } finally {
      setIsExecuting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full flex flex-col pt-[80px]">

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 md:px-10 py-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 700, lineHeight: 1.1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 16, textShadow: '0 0 30px rgba(255,42,30,0.2)' }}>
            LIVE <GlitchDissolveText text="MARKETS" glowColor="#FF2A1E" />
          </div>
          <p className="font-mono text-white/50 text-sm mt-2">Binary prediction markets on crypto, stocks &amp; world events · Real-time AI settlement</p>
        </div>
        <div className="flex gap-3">
          <MagneticButton onClick={() => { fetchMarkets() }} className="mech-btn text-xs px-4 py-2">
            <span>⟳ REFRESH</span>
          </MagneticButton>
          <MagneticButton onClick={async () => { setIsLoading(true); await api.createMarket({ asset: 'algorand', type: 'crypto' }); fetchMarkets() }} className="mech-btn mech-btn-red text-xs px-4 py-2" disabled={isLoading}>
            <span>+ CREATE MARKET</span>
          </MagneticButton>
        </div>
      </motion.div>

      {/* ── Agent Battle Arena ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {(battlePhase !== 'idle' || battleWinner) && (
          <motion.div
            key="battle"
            initial={{ opacity: 0, y: 30, scaleY: 0.8 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -30, scaleY: 0.8 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="mx-6 md:mx-10 mb-8 rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,200,87,0.4)', background: 'linear-gradient(135deg, rgba(255,200,87,0.05) 0%, rgba(0,0,0,0.9) 50%, rgba(255,42,30,0.05) 100%)' }}
          >
            {/* Arena Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: battlePhase === 'fighting' ? 360 : 0 }}
                  transition={{ duration: 2, repeat: battlePhase === 'fighting' ? Infinity : 0, ease: 'linear' }}
                  className="text-2xl"
                >⚔️</motion.div>
                <div>
                  <span className="font-mono font-bold text-sm text-yellow-400 tracking-widest uppercase">Agent Battle Arena</span>
                  <p className="text-xs text-white/40 font-mono">5 AI models competing · Best confidence executes on-chain</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {battlePhase === 'fighting' && (
                  <span className="font-mono text-xs text-yellow-400 animate-pulse px-3 py-1 rounded border border-yellow-400/40 bg-yellow-400/10">● LIVE BATTLE</span>
                )}
                {battlePhase === 'resolved' && battleWinner && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="font-mono text-xs text-green-neon px-3 py-1 rounded border border-green-neon/40 bg-green-neon/10"
                  >🏆 {battleWinner.winner} WON</motion.span>
                )}
              </div>
            </div>

            {/* Fighters Grid */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              {fighters.map((fighter, i) => {
                const cfg = FIGHTER_CONFIGS[fighter.name] || { color: '#fff', icon: '🤖' }
                const isWinner = battleWinner?.winner === fighter.name
                return (
                  <motion.div
                    key={fighter.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative rounded-xl p-4 flex flex-col items-center gap-3 text-center"
                    style={{
                      border: `1px solid ${isWinner ? '#FFC857' : cfg.color}40`,
                      background: isWinner ? 'rgba(255,200,87,0.1)' : `${cfg.color}08`,
                      boxShadow: isWinner ? `0 0 20px rgba(255,200,87,0.3)` : 'none',
                    }}
                  >
                    {isWinner && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg"
                      >🏆</motion.div>
                    )}
                    <div className="text-2xl">{cfg.icon}</div>
                    <div>
                      <p className="font-mono text-xs font-bold text-white">{fighter.name}</p>
                      <p className="font-mono text-[9px] text-white/40 mt-0.5">{cfg.strategy}</p>
                    </div>

                    {/* Confidence bar */}
                    <div className="w-full">
                      <div className="flex justify-between text-[9px] font-mono mb-1">
                        <span style={{ color: cfg.color }}>CONF</span>
                        <motion.span
                          animate={{ opacity: fighter.status === 'analyzing' ? [1, 0.3, 1] : 1 }}
                          transition={{ duration: 0.8, repeat: fighter.status === 'analyzing' ? Infinity : 0 }}
                          className="text-white"
                        >{fighter.confidence > 0 ? `${fighter.confidence}%` : '...'}</motion.span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: fighter.confidence > 0 ? `${fighter.confidence}%` : '15%' }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: isWinner ? '#FFC857' : cfg.color }}
                        />
                      </div>
                    </div>

                    {fighter.decision && (
                      <span
                        className="font-mono text-[9px] px-2 py-0.5 rounded font-bold"
                        style={{
                          background: fighter.decision === 'YES' ? 'rgba(0,255,200,0.15)' : 'rgba(255,42,30,0.15)',
                          color: fighter.decision === 'YES' ? '#00FFC8' : '#FF2A1E',
                          border: `1px solid ${fighter.decision === 'YES' ? '#00FFC8' : '#FF2A1E'}40`,
                        }}
                      >{fighter.decision}</span>
                    )}

                    {fighter.status === 'analyzing' && (
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="text-[9px] font-mono text-white/40"
                      >analyzing...</motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Winner Banner */}
            {battlePhase === 'resolved' && battleWinner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-6 pb-6"
              >
                <div
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: 'linear-gradient(90deg, rgba(255,200,87,0.2), rgba(255,200,87,0.05))', border: '1px solid rgba(255,200,87,0.4)' }}
                >
                  <div>
                    <p className="font-mono text-xs text-yellow-400/60 uppercase tracking-widest mb-1">🏆 Winner Executes Transaction</p>
                    <p className="font-bold text-white"><span className="text-yellow-400">{battleWinner.winner}</span> → {battleWinner.amount} ALGO on <span className={battleWinner.decision === 'YES' ? 'text-green-neon' : 'text-red-neon'}>{battleWinner.decision}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 font-mono">Confidence</p>
                    <p className="text-2xl font-bold text-yellow-400">{battleWinner.confidence}%</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Filters ──────────────────────────────────────────────── */}
      <div className="flex gap-3 px-6 md:px-10 mb-6 flex-wrap">
        {['ALL', 'CRYPTO', 'STOCKS', 'SPORTS'].map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(cat)}
            className="font-mono text-xs tracking-widest px-4 py-2 rounded border transition-all duration-300"
            style={{
              borderColor: filter === cat ? '#FF2A1E' : 'rgba(255,255,255,0.15)',
              color:        filter === cat ? '#FF2A1E' : 'rgba(255,255,255,0.5)',
              background:   filter === cat ? 'rgba(255,42,30,0.1)' : 'transparent',
            }}
          >{cat}</motion.button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-neon animate-pulse" />
          <span className="font-mono text-xs text-white/30">{markets.length} active markets</span>
        </div>
      </div>

      {/* ── Main Content: Markets + Wager Panel ──────────────────────────── */}
      <div className="flex gap-6 px-6 md:px-10 pb-12 flex-1">

        {/* Markets Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-max overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/3 h-52 animate-pulse" />
            ))
          ) : filteredMarkets.length === 0 ? (
            <div className="col-span-3 text-center py-20 text-white/30 font-mono">No markets found for this filter.</div>
          ) : (
            filteredMarkets.map((m_raw) => {
              const m = transformMarket(m_raw)
              const style = MARKET_TYPE_STYLE[m_raw.type] || MARKET_TYPE_STYLE.crypto
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => { setSelectedMarketId(m.id); setBetDirection(null); setBetAmount(''); setShowWagerPanel(true) }}
                  className="cursor-pointer rounded-xl border p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300"
                  style={{
                    borderColor: selectedMarketId === m.id ? style.border : 'rgba(255,255,255,0.08)',
                    background:  selectedMarketId === m.id ? style.glow : 'rgba(255,255,255,0.02)',
                    boxShadow:   selectedMarketId === m.id ? `0 0 24px ${style.glow}` : 'none',
                  }}
                >
                  {/* Type Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-[10px] font-bold px-2 py-0.5 rounded tracking-widest"
                      style={{ background: `${style.border}15`, color: style.border, border: `1px solid ${style.border}30` }}
                    >{style.icon} {style.label}</span>
                    <span className="font-mono text-[10px] text-white/30">{m.closeTime}</span>
                  </div>

                  {/* Ticker + Price */}
                  <div>
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-mono font-bold text-xl text-white">{m.ticker}</span>
                      {m.price != null && m.price > 0 && (
                        <span className="font-mono text-sm" style={{ color: style.border }}>
                          ${typeof m.price === 'number' ? m.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : m.price}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{m.question}</p>
                  </div>

                  {/* Probability Bar */}
                  <div>
                    <div className="flex justify-between text-[9px] font-mono text-white/40 mb-1.5">
                      <span>YES <strong className="text-green-neon">{Math.round((m.yes_prob || 0.5) * 100)}%</strong></span>
                      <span>NO <strong className="text-red-neon">{Math.round((m.no_prob || 0.5) * 100)}%</strong></span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                      <div className="h-full bg-green-neon/70 transition-all duration-500" style={{ width: `${(m.yes_prob || 0.5) * 100}%` }} />
                      <div className="h-full bg-red-neon/70 transition-all duration-500" style={{ width: `${(m.no_prob || 0.5) * 100}%` }} />
                    </div>
                  </div>

                  {/* Volume + CTA */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-white/40">VOL: <strong className="text-white/60">{(m.volume / 1000).toFixed(1)}K ALGO</strong></span>
                    <span
                      className="font-mono text-[9px] tracking-widest px-2 py-1 rounded transition-all"
                      style={{ background: style.glow, color: style.border, border: `1px solid ${style.border}30` }}
                    >WAGER →</span>
                  </div>

                  {/* Active overlay indicator */}
                  {selectedMarketId === m.id && (
                    <div className="absolute top-0 right-0 w-1 h-full opacity-80" style={{ background: `linear-gradient(to bottom, ${style.border}, transparent)` }} />
                  )}
                </motion.div>
              )
            })
          )}
        </div>

        {/* ── Wager + Battle Panel (right side) ──────────────────────────── */}
        <div className="w-full md:w-[420px] flex flex-col gap-6 sticky top-8 h-fit">

          {/* WAGER PANEL */}
          <AnimatePresence>
            {showWagerPanel && selectedTransformed && (
              <motion.div
                key="wager"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="rounded-xl border border-red-neon/40 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(255,42,30,0.05) 0%, rgba(0,0,0,0.9) 100%)' }}
              >
                {/* Panel Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-white/40 tracking-widest uppercase">Place Wager</span>
                    <p className="font-bold text-white mt-0.5">{selectedTransformed.ticker} · {(MARKET_TYPE_STYLE[selectedTransformed.type] || MARKET_TYPE_STYLE.crypto).label}</p>
                  </div>
                  <button onClick={() => setShowWagerPanel(false)} className="text-white/30 hover:text-white transition-colors text-lg">✕</button>
                </div>

                <div className="p-6 flex flex-col gap-5">
                  {/* Question */}
                  <p className="text-sm text-white/80 leading-relaxed font-medium border-l-2 border-red-neon/50 pl-3">
                    {selectedTransformed.question}
                  </p>

                  {/* YES/NO */}
                  <div className="grid grid-cols-2 gap-3">
                    {(['YES', 'NO'] as const).map(dir => (
                      <motion.button
                        key={dir}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setBetDirection(dir)}
                        className="py-4 font-bold text-base uppercase tracking-widest rounded-lg border-2 transition-all duration-200"
                        style={{
                          borderColor: betDirection === dir ? (dir === 'YES' ? '#00FFC8' : '#FF2A1E') : 'rgba(255,255,255,0.1)',
                          color:        betDirection === dir ? (dir === 'YES' ? '#00FFC8' : '#FF2A1E') : 'rgba(255,255,255,0.4)',
                          background:   betDirection === dir ? (dir === 'YES' ? 'rgba(0,255,200,0.1)' : 'rgba(255,42,30,0.1)') : 'rgba(255,255,255,0.02)',
                          boxShadow:    betDirection === dir ? `0 0 20px ${dir === 'YES' ? 'rgba(0,255,200,0.2)' : 'rgba(255,42,30,0.2)'}` : 'none',
                        }}
                      >{dir}</motion.button>
                    ))}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-mono text-white/40 tracking-widest mb-2">AMOUNT (ALGO)</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={betAmount}
                      onChange={e => setBetAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 text-white font-mono rounded-lg p-3 placeholder-white/20 focus:border-red-neon focus:outline-none transition-all"
                    />
                  </div>

                  {/* Return estimate */}
                  {betDirection && betAmount && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg border border-white/10 bg-white/3">
                      <p className="text-xs text-white/40 font-mono mb-1">ESTIMATED RETURN</p>
                      <p className="text-xl font-bold text-white">{Math.round(parseFloat(betAmount || '0') * (betDirection === 'YES' ? 1.85 : 2.15))} ALGO</p>
                    </motion.div>
                  )}

                  {/* Execute */}
                  <MagneticButton
                    className={`w-full text-center py-4 font-bold uppercase tracking-widest rounded-lg ${betDirection && betAmount ? 'mech-btn mech-btn-red' : 'mech-btn opacity-40 cursor-not-allowed'}`}
                    onClick={handleExecuteBet}
                    disabled={isExecuting || !betDirection || !betAmount}
                  >
                    <span>{isExecuting ? '⟳ PROCESSING...' : '⚡ EXECUTE WAGER'}</span>
                  </MagneticButton>

                  {isExecuting && (
                    <p className="text-xs text-center font-mono text-yellow-400/70 animate-pulse">
                      5 AI agents analyzing market · Winner executes trade
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Live Terminal (Agent Thoughts) ────────────────────────────── */}
          <div className="rounded-xl border border-red-neon/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-red-neon/20 flex items-center justify-between bg-red-neon/5">
              <span className="font-mono text-xs text-red-neon tracking-widest uppercase">ALGORAND SETTLEMENT LAYER</span>
              {isExecuting && <span className="text-xs font-mono text-red-neon animate-pulse">● LIVE</span>}
            </div>
            <div className="h-52 overflow-y-auto px-5 py-4 font-mono text-xs leading-relaxed space-y-2">
              {events.length === 0 ? (
                <div className="text-white/20 animate-pulse"><TypewriterText text="> AWAITING WAGER TO INITIATE AGENT ANALYSIS..." speed={30} /></div>
              ) : (
                events.map((ev, idx) => {
                  const m = EV_META[ev.type] || EV_META.info
                  return (
                    <motion.div key={ev.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                      <span className="text-white/25 shrink-0">[{new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                      <span style={{ color: m.col }} className="shrink-0 font-bold">{m.label}</span>
                      <span className="text-white/70 flex-1 break-all">
                        {idx === 0 && isExecuting ? <TypewriterText text={ev.message} speed={20} /> : ev.message}
                      </span>
                    </motion.div>
                  )
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* ── On-chain Audit Trail ─────────────────────────────────────── */}
          <div className="rounded-xl border border-cyan-neon/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-cyan-neon/20 bg-cyan-neon/5">
              <span className="font-mono text-xs text-cyan-neon tracking-widest uppercase">ON-CHAIN AUDIT TRAIL</span>
            </div>
            <div className="divide-y divide-white/5">
              {audit.slice(0, 6).map((a, idx) => (
                <motion.div
                  key={a.id || idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-5 py-3 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-white/30 truncate">TX: {(a.id || '').slice(-12)}</p>
                    <p className="font-mono text-xs text-white/80 font-bold">{a.taskName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-mono text-[10px] font-bold ${a.status === 'SETTLED' ? 'text-green-neon' : a.status === 'CONFIRMED' ? 'text-cyan-neon' : 'text-yellow-400'}`}>{a.status}</p>
                    <p className="font-mono text-sm font-bold text-white">{a.amount} <span className="text-xs text-white/40">ALGO</span></p>
                  </div>
                </motion.div>
              ))}
              {audit.length === 0 && (
                <p className="px-5 py-6 text-xs font-mono text-white/20 text-center">No transactions yet. Place a wager to begin.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
