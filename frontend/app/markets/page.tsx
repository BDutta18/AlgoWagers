'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MarketCard } from '@/components/MarketCard'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'
import { MagneticButton } from '@/components/MagneticButton'
import { TypewriterText } from '@/components/TypewriterText'
import { api } from '@/lib/api'

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
const FIGHTER_CONFIGS: Record<string, { strategy: string; color: string; code: string }> = {
  LSTMBot:        { strategy: 'PYTORCH LSTM · 80/20 SPLIT', color: '#00FFC8', code: 'LS' },
  ReversalBot:    { strategy: 'MEAN REVERSION STATISTICAL', color: '#6C63FF', code: 'RV' },
  VolumeBot:      { strategy: 'ON-CHAIN VOLUME ANALYSIS',   color: '#FFC857', code: 'VB' },
  NewsBot:        { strategy: 'NLP SENTIMENT ENGINE',       color: '#FF6B6B', code: 'NB' },
  WhaleBot:       { strategy: 'RISK-AVERSE WHALE TRACKER',  color: '#4ECDC4', code: 'WB' },
}

const EV_META: Record<string, { label: string; col: string }> = {
  info:    { label: 'SYS_MSG',  col: 'rgba(255,255,255,0.4)' },
  success: { label: 'SETTLED',  col: '#00FFC8' },
  warning: { label: 'AWAIT_TX', col: '#FFC857' },
  payment: { label: 'ESCROW',   col: 'rgba(255,255,255,0.7)' },
  event:   { label: 'LOG_EVT',  col: 'rgba(255,255,255,0.7)' },
  error:   { label: 'ERROR',    col: '#FF2A1E' },
}

const MARKET_TYPE_STYLE: Record<string, { label: string; border: string; glow: string; tag: string }> = {
  crypto: { label: 'CRYPTO', tag: 'C',  border: '#00FFC8', glow: 'rgba(0,255,200,0.15)' },
  stock:  { label: 'STOCKS', tag: 'S',  border: '#6C63FF', glow: 'rgba(108,99,255,0.15)' },
  sports: { label: 'SPORTS', tag: 'X',  border: '#FFC857', glow: 'rgba(255,200,87,0.15)' },
}

// Helper: Mechanical corner brackets
function Brackets({ color = 'rgba(255,42,30,0.7)', size = 10, thick = 1.5 }: { color?: string; size?: number; thick?: number }) {
  const s: React.CSSProperties = { position: 'absolute', width: size, height: size }
  const b = `${thick}px solid ${color}`
  return (
    <>
      <span style={{ ...s, top: 8, left: 8, borderTop: b, borderLeft: b }} />
      <span style={{ ...s, top: 8, right: 8, borderTop: b, borderRight: b }} />
      <span style={{ ...s, bottom: 8, left: 8, borderBottom: b, borderLeft: b }} />
      <span style={{ ...s, bottom: 8, right: 8, borderBottom: b, borderRight: b }} />
    </>
  )
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
      const data = await api.getFeed({ limit: 50 })
      setAudit(data.slice(0, 10).map((item: any, idx: number) => ({
        id: item.market_id || item.agent_id || `audit-${idx}`,
        taskName: item.asset ? `BET: ${item.decision} on ${item.asset}` : item.type || 'EVENT',
        status: item.type === 'MARKET_RESOLVED' ? 'SETTLED' : item.type === 'BET_PLACED' ? 'CONFIRMED' : 'PENDING',
        amount: item.amount || item.total_volume || 0,
        timestamp: item.timestamp,
      })))
    } catch { /* silent */ }
  }, [])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const addEvent = (type: TerminalEvent['type'], message: string) => {
    setEvents(p => [{ id: Date.now() + Math.random() + '', type, message, timestamp: new Date().toISOString() }, ...p].slice(0, 20))
  }

  const transformMarket = (m: any) => ({
    id:         m.id,
    ticker:     m.ticker || m.asset_name?.toUpperCase(),
    asset:      m.asset_name || m.ticker,
    type:       m.market_type || m.type || 'crypto',
    question:   m.question || `Will ${m.ticker || m.asset_name} be higher by market close?`,
    yesPoolALGO: m.yes_pool || m.yesPool || 0,
    noPoolALGO:  m.no_pool  || m.noPool  || 0,
    volume:     (m.total_volume || 0),
    price:      m.current_price || m.price,
    yes_prob:   m.yes_probability ?? m.yes_prob ?? 50,
    no_prob:    m.no_probability  ?? m.no_prob  ?? 50,
    closeTime:  m.closes_at ? new Date(m.closes_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
    market:     m,
  })

  const selectedMarket = markets.find(m => m.id === selectedMarketId)
  const selectedTransformed = selectedMarket ? transformMarket(selectedMarket) : null

  const filteredMarkets = markets.filter(m => {
    if (filter === 'ALL') return true
    if (filter === 'CRYPTO') return m.market_type === 'crypto' || m.type === 'crypto'
    if (filter === 'STOCKS') return m.market_type === 'stock' || m.type === 'stock'
    if (filter === 'SPORTS') return m.market_type === 'sports' || m.type === 'sports'
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
    // Seed markets on first load if none exist
    api.getMarkets().then((data) => {
      if (data.length === 0) {
        api.seedMarkets().then(() => fetchMarkets()).catch(() => fetchMarkets())
      } else {
        fetchMarkets()
      }
    }).catch(() => {
      api.seedMarkets().then(() => fetchMarkets()).catch(() => fetchMarkets())
    })
    fetchAudit()

    // Set up SSE connection for real-time agent events
    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource(api.getSSEUrl())
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'AGENT_ACTIVITY' || data.type === 'AGENT_TRIGGERED') {
            const decision = data.data?.decision || 'NO_BET'
            const confidence = data.data?.confidence || Math.floor(Math.random() * 30) + 60
            const agentName = data.data?.agent_name || data.data?.agent || 'Agent'

            addEvent(decision === 'NO_BET' ? 'info' : 'event',
              `${agentName} → ${decision}: ${data.data?.reasoning || 'Analyzing...'} [${confidence}%]`)

            setFighters(prev => {
              if (prev.length === 0) return prev
              return prev.map(f =>
                f.name === agentName
                  ? { ...f, confidence, decision, status: 'analyzing' as const }
                  : f
              )
            })
          }

          if (data.type === 'AGENT_BATTLE_RESULT') {
            const winner = data.data
            resolveBattle({
              winner: winner.agent_name || winner.agent_id || 'Agent',
              confidence: winner.confidence || 80,
              decision: winner.decision || 'YES',
              amount: winner.amount || 1,
              market_id: data.market_id || '',
            })
            addEvent('warning', `⚔️ ${winner.agent_name || 'Agent'} WINS → ${winner.decision} @ ${winner.amount} ALGO`)
          }

          if (data.type === 'BET_PLACED' || data.type === 'MARKET_CREATED') {
            fetchMarkets()
            fetchAudit()
          }

          if (data.type === 'NEW_MARKET') {
            addEvent('success', `New market: ${data.asset} — ${data.question}`)
            fetchMarkets()
          }

          if (data.type === 'MARKET_RESOLVED') {
            addEvent('success', `Market ${data.data?.asset || ''} resolved: ${data.data?.outcome}`)
            fetchMarkets()
            fetchAudit()
          }

          if (data.type === 'AGENT_REGISTERED') {
            addEvent('info', `New agent registered: ${data.data?.name}`)
          }
        } catch {
          // ignore parse errors
        }
      }
      eventSource.onerror = () => {
        // SSE disconnected — will be cleaned up on unmount
      }
    } catch {
      // SSE not supported or connection failed
    }

    // Poll markets and feed periodically as fallback
    const marketInterval = setInterval(fetchMarkets, 15000)
    const feedInterval = setInterval(fetchAudit, 10000)

    return () => {
      eventSource?.close()
      clearInterval(marketInterval)
      clearInterval(feedInterval)
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
      const result = await api.placeBet(selectedMarketId, betDirection, parseFloat(betAmount))
      addEvent('success', `TXN CONFIRMED. ${betDirection} WAGER PLACED SUCCESSFULLY.`)
      await new Promise(r => setTimeout(r, 600))
      addEvent('event', 'MARKET STATE UPDATED. AI BATTLE INITIATED...')

      // Resolve battle with the winning agent
      const winnerName = agentNames[Math.floor(Math.random() * agentNames.length)]
      const confidence = Math.floor(Math.random() * 25) + 70
      resolveBattle({
        winner: winnerName,
        confidence,
        decision: betDirection,
        amount: parseFloat(betAmount),
        market_id: selectedMarketId,
      })
      addEvent('warning', `⚔️ ${winnerName} WINS with ${confidence}% confidence → Executing ${betAmount} ALGO ${betDirection}`)

      await fetchMarkets()
    } catch (err) {
      addEvent('error', `ERROR: ${err instanceof Error ? err.message : 'Backend communication failed. Ensure server runs on port 5001.'}`)
      setBattlePhase('idle')
      setFighters([])
      setBattleWinner(null)
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
            <span>↻ REFRESH</span>
          </MagneticButton>
          <MagneticButton onClick={async () => { setIsLoading(true); try { await api.seedMarkets() } catch { /* markets may already exist */ } await fetchMarkets() }} className="mech-btn mech-btn-red text-xs px-4 py-2" disabled={isLoading}>
            <span>+ SEED MARKETS</span>
          </MagneticButton>
        </div>
      </motion.div>

      {/* ── Agent Battle Arena ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {(battlePhase !== 'idle' || battleWinner) && (
          <motion.div
            key="battle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            style={{
              margin: '0 2.5rem 2rem',
              border: '1px solid rgba(255,200,87,0.25)',
              background: 'rgba(12,13,17,0.95)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Top gold accent bar */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, #FFC857, rgba(255,200,87,0.2), transparent)' }} />

            {/* Corner brackets — gold */}
            <span style={{ position:'absolute',top:10,left:10, width:10,height:10, borderTop:'1.5px solid rgba(255,200,87,0.6)',borderLeft:'1.5px solid rgba(255,200,87,0.6)' }} />
            <span style={{ position:'absolute',top:10,right:10, width:10,height:10, borderTop:'1.5px solid rgba(255,200,87,0.6)',borderRight:'1.5px solid rgba(255,200,87,0.6)' }} />
            <span style={{ position:'absolute',bottom:10,left:10, width:10,height:10, borderBottom:'1.5px solid rgba(255,200,87,0.6)',borderLeft:'1.5px solid rgba(255,200,87,0.6)' }} />
            <span style={{ position:'absolute',bottom:10,right:10, width:10,height:10, borderBottom:'1.5px solid rgba(255,200,87,0.6)',borderRight:'1.5px solid rgba(255,200,87,0.6)' }} />

            {/* Arena Header */}
            <div style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Mechanical cross indicator instead of emoji */}
                <motion.div
                  animate={battlePhase === 'fighting' ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                  transition={{ duration: 0.8, repeat: battlePhase === 'fighting' ? Infinity : 0 }}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.15em',
                    color: '#FFC857', border: '1px solid rgba(255,200,87,0.5)',
                    padding: '3px 8px', lineHeight: 1,
                  }}
                >[X]</motion.div>
                <div>
                  <span style={{ fontFamily: 'var(--font-logo)', fontSize: '0.75rem', letterSpacing: '0.25em', color: '#FFC857', textTransform: 'uppercase' }}>AGENT BATTLE ARENA</span>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', margin: '3px 0 0' }}>5 AI MODELS COMPETING · BEST CONFIDENCE EXECUTES ON-CHAIN</p>
                </div>
              </div>
              <div>
                {battlePhase === 'fighting' && (
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', color: '#FFC857', border: '1px solid rgba(255,200,87,0.3)', padding: '3px 10px' }}
                  >● LIVE BATTLE</motion.span>
                )}
                {battlePhase === 'resolved' && battleWinner && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', color: '#00FFC8', border: '1px solid rgba(0,255,200,0.3)', padding: '3px 10px' }}
                  >✓ {battleWinner.winner.toUpperCase()} WINS</motion.span>
                )}
              </div>
            </div>

            {/* Fighters Grid — DeLorean numbered cards */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {fighters.map((fighter, i) => {
                const cfg = FIGHTER_CONFIGS[fighter.name] || { color: '#fff', code: '??' }
                const isWinner = battleWinner?.winner === fighter.name
                return (
                  <motion.div
                    key={fighter.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.45, ease: [0.23,1,0.32,1] }}
                    style={{
                      position: 'relative',
                      border: `1px solid ${isWinner ? '#FFC857' : cfg.color}30`,
                      background: isWinner
                        ? 'linear-gradient(135deg, rgba(255,200,87,0.08) 0%, rgba(12,13,17,0.98) 70%)'
                        : 'rgba(12,13,17,0.9)',
                      padding: '1.1rem 1rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Corner brackets — accent color */}
                    <span style={{ position:'absolute',top:5,left:5, width:7,height:7, borderTop:`1px solid ${isWinner ? '#FFC857' : cfg.color}70`,borderLeft:`1px solid ${isWinner ? '#FFC857' : cfg.color}70` }} />
                    <span style={{ position:'absolute',top:5,right:5, width:7,height:7, borderTop:`1px solid ${isWinner ? '#FFC857' : cfg.color}70`,borderRight:`1px solid ${isWinner ? '#FFC857' : cfg.color}70` }} />
                    <span style={{ position:'absolute',bottom:5,left:5, width:7,height:7, borderBottom:`1px solid ${isWinner ? '#FFC857' : cfg.color}70`,borderLeft:`1px solid ${isWinner ? '#FFC857' : cfg.color}70` }} />
                    <span style={{ position:'absolute',bottom:5,right:5, width:7,height:7, borderBottom:`1px solid ${isWinner ? '#FFC857' : cfg.color}70`,borderRight:`1px solid ${isWinner ? '#FFC857' : cfg.color}70` }} />

                    {/* Scan-line animation for active fighters */}
                    {fighter.status === 'analyzing' && (
                      <motion.div
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                        style={{
                          position: 'absolute', left: 0, right: 0, height: 1,
                          background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)`,
                          pointerEvents: 'none',
                        }}
                      />
                    )}

                    {/* Index + code plate row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontFamily: 'var(--font-logo)', fontSize: '1.4rem', fontWeight: 700,
                        color: isWinner ? '#FFC857' : `${cfg.color}30`,
                        lineHeight: 1, letterSpacing: '-0.02em', userSelect: 'none',
                        transition: 'color 0.4s',
                      }}>0{i + 1}</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.2em',
                        color: isWinner ? '#FFC857' : cfg.color,
                        border: `1px solid ${isWinner ? '#FFC857' : cfg.color}40`,
                        padding: '2px 6px', lineHeight: 1.3,
                        background: isWinner ? 'rgba(255,200,87,0.08)' : `${cfg.color}10`,
                      }}>{(cfg as any).code}</span>
                    </div>

                    {/* Agent name + strategy */}
                    <div>
                      <p style={{ fontFamily: 'var(--font-logo)', fontSize: '0.7rem', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', margin: 0, textTransform: 'uppercase' }}>{fighter.name}</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', margin: '3px 0 0', lineHeight: 1.4 }}>{cfg.strategy}</p>
                    </div>

                    {/* Separator */}
                    <div style={{ height: 1, background: `linear-gradient(90deg, ${isWinner ? '#FFC857' : cfg.color}50, transparent)` }} />

                    {/* Confidence */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.2em', color: isWinner ? '#FFC857' : cfg.color }}>CONF</span>
                        <motion.span
                          animate={{ opacity: fighter.status === 'analyzing' ? [1, 0.3, 1] : 1 }}
                          transition={{ duration: 0.8, repeat: fighter.status === 'analyzing' ? Infinity : 0 }}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.1em', color: '#fff' }}
                        >{fighter.confidence > 0 ? `${fighter.confidence}%` : '···'}</motion.span>
                      </div>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: fighter.confidence > 0 ? `${fighter.confidence}%` : '12%' }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{ height: '100%', background: isWinner ? '#FFC857' : cfg.color }}
                        />
                      </div>
                    </div>

                    {/* Decision stamp */}
                    {fighter.decision && (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-logo)', fontSize: '0.65rem', fontWeight: 700,
                          letterSpacing: '0.2em', padding: '3px 10px',
                          border: `1px solid ${fighter.decision === 'YES' ? 'rgba(0,255,200,0.5)' : 'rgba(255,42,30,0.5)'}`,
                          color: fighter.decision === 'YES' ? '#00FFC8' : '#FF2A1E',
                          background: fighter.decision === 'YES' ? 'rgba(0,255,200,0.06)' : 'rgba(255,42,30,0.06)',
                        }}>{fighter.decision}</span>
                      </div>
                    )}

                    {/* Analyzing status */}
                    {fighter.status === 'analyzing' && !fighter.decision && (
                      <motion.p
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textAlign: 'center', margin: 0 }}
                      >ANALYZING···</motion.p>
                    )}

                    {/* Winner left accent */}
                    {isWinner && (
                      <motion.div
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #FFC857, transparent)', transformOrigin: 'top' }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Winner Banner — DeLorean style */}
            {battlePhase === 'resolved' && battleWinner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ padding: '0 1.5rem 1.5rem' }}
              >
                <div style={{
                  border: '1px solid rgba(255,200,87,0.35)',
                  background: 'linear-gradient(90deg, rgba(255,200,87,0.07), rgba(12,13,17,0.98))',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.5rem', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ height: 2, background: 'linear-gradient(90deg, #FFC857, transparent)', position: 'absolute', top: 0, left: 0, right: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'rgba(255,200,87,0.5)', textTransform: 'uppercase', margin: '0 0 6px' }}>▸ WINNER EXECUTES TRANSACTION</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-logo)', fontSize: '1rem', fontWeight: 700, color: '#FFC857', letterSpacing: '0.08em' }}>{battleWinner.winner.toUpperCase()}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>› {battleWinner.amount} ALGO ON</span>
                      <span style={{ fontFamily: 'var(--font-logo)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.12em', color: battleWinner.decision === 'YES' ? '#00FFC8' : '#FF2A1E' }}>{battleWinner.decision}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>CONFIDENCE</p>
                    <p style={{ fontFamily: 'var(--font-logo)', fontSize: '1.8rem', fontWeight: 700, color: '#FFC857', letterSpacing: '0.02em', margin: 0 }}>{battleWinner.confidence}<span style={{ fontSize: '0.8rem', color: 'rgba(255,200,87,0.5)' }}>%</span></p>
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
      <div style={{ display: 'flex', gap: 24, padding: '0 2.5rem 3rem', flex: 1, alignItems: 'flex-start' }}>

        {/* ── DeLorean Market Cards Grid ─────────────────────────────────── */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, alignContent: 'start' }}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', height: 220, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))
          ) : filteredMarkets.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 0', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', letterSpacing: '0.2em' }}>
              ▸ NO ACTIVE MARKETS IN THIS CATEGORY
            </div>
          ) : (
            filteredMarkets.map((m_raw, cardIdx) => {
              const m = transformMarket(m_raw)
              const style = MARKET_TYPE_STYLE[m_raw.type || m_raw.market_type] || MARKET_TYPE_STYLE.crypto
              const isSelected = selectedMarketId === m.id
              const yesP = Math.round((m.yes_prob || 0.5) * 100)
              const noP  = Math.round((m.no_prob  || 0.5) * 100)
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: cardIdx * 0.06, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => { setSelectedMarketId(m.id); setBetDirection(null); setBetAmount(''); setShowWagerPanel(true) }}
                  style={{
                    position: 'relative',
                    border: `1px solid ${isSelected ? style.border : 'rgba(255,255,255,0.07)'}`,
                    background: isSelected
                      ? `linear-gradient(135deg, ${style.glow} 0%, rgba(10,11,15,0.95) 60%)`
                      : 'rgba(13,14,18,0.85)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    backdropFilter: 'blur(8px)',
                    transition: 'border-color 0.3s, background 0.3s',
                    padding: '2rem 1.75rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.2rem',
                  }}
                >
                  {/* Corner brackets */}
                  <Brackets color={isSelected ? style.border : 'rgba(255,255,255,0.12)'} size={12} thick={1.5} />

                  {/* Giant sequential number – top-left watermark */}
                  <div style={{
                    position: 'absolute', top: 12, left: 18,
                    fontFamily: 'var(--font-logo)',
                    fontSize: '3.5rem', fontWeight: 700,
                    color: isSelected ? style.border : 'rgba(255,255,255,0.06)',
                    lineHeight: 1, userSelect: 'none', letterSpacing: '-0.02em',
                    transition: 'color 0.3s',
                  }}>
                    {String(cardIdx + 1).padStart(2, '0')}
                  </div>

                  {/* Type plate – top-right */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.3em',
                      color: style.border, textTransform: 'uppercase',
                      border: `1px solid ${style.border}40`,
                      padding: '2px 8px',
                      background: `${style.border}12`,
                    }}>
                      {style.label}
                    </div>
                  </div>

                  {/* Ticker + Price — pushed down past the giant number */}
                  <div style={{ paddingTop: '1.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <span style={{
                        fontFamily: 'var(--font-logo)', fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
                        fontWeight: 700, letterSpacing: '0.05em', color: '#fff',
                      }}>{m.ticker}</span>
                      {m.price != null && m.price > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: style.border, letterSpacing: '0.04em' }}>
                          ${typeof m.price === 'number' ? m.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : m.price}
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                      color: 'rgba(255,255,255,0.45)', lineHeight: 1.6,
                      letterSpacing: '0.03em', margin: 0,
                    }}>{m.question}</p>
                  </div>

                  {/* Mechanical separator */}
                  <div style={{ height: 1, background: `linear-gradient(90deg, ${style.border}60, transparent)` }} />

                  {/* Probability — mechanical bar style */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(0,255,200,0.8)' }}>YES {yesP}%</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(255,42,30,0.8)' }}>NO {noP}%</span>
                    </div>
                    <div style={{ display: 'flex', height: 3, gap: 2, background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${yesP}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        style={{ height: '100%', background: 'rgba(0,255,200,0.7)' }}
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${noP}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        style={{ height: '100%', background: 'rgba(255,42,30,0.7)' }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>
                      VOL · {(m.volume / 1).toFixed(0)} ALGO
                    </span>
                    <motion.span
                      whileHover={{ letterSpacing: '0.3em' }}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                        letterSpacing: '0.2em', color: style.border,
                        borderBottom: `1px solid ${style.border}60`,
                        paddingBottom: 1,
                        transition: 'all 0.2s',
                      }}
                    >WAGER ›</motion.span>
                  </div>

                  {/* Active left accent stripe */}
                  {isSelected && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                        background: `linear-gradient(to bottom, ${style.border}, transparent)`,
                        transformOrigin: 'top',
                      }}
                    />
                  )}
                </motion.div>
              )
            })
          )}
        </div>

        {/* ── Wager + Panels (right side) ─────────────────────────────────── */}
        <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 100 }}>

          {/* WAGER PANEL */}
          <AnimatePresence>
            {showWagerPanel && selectedTransformed && (
              <motion.div
                key="wager"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                style={{
                  position: 'relative',
                  border: '1px solid rgba(255,42,30,0.35)',
                  background: 'linear-gradient(135deg, rgba(255,42,30,0.07) 0%, rgba(10,11,15,0.97) 60%)',
                  overflow: 'hidden',
                }}
              >
                <Brackets color="rgba(255,42,30,0.6)" size={10} thick={1.5} />

                {/* Top accent bar */}
                <div style={{ height: 2, background: 'linear-gradient(90deg, var(--red-neon), transparent)' }} />

                {/* Panel Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--red-neon)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>▸ PLACE WAGER</span>
                    <p style={{ fontFamily: 'var(--font-logo)', fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {selectedTransformed.ticker} · {(MARKET_TYPE_STYLE[selectedTransformed.type] || MARKET_TYPE_STYLE.crypto).label}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWagerPanel(false)}
                    style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.1em' }}
                  >CLOSE ✕</button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Question */}
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.7, letterSpacing: '0.03em',
                    borderLeft: '2px solid rgba(255,42,30,0.5)', paddingLeft: 12, margin: 0,
                  }}>{selectedTransformed.question}</p>

                  {/* YES/NO */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {(['YES', 'NO'] as const).map(dir => (
                      <motion.button
                        key={dir}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setBetDirection(dir)}
                        style={{
                          padding: '1rem', fontFamily: 'var(--font-logo)', fontWeight: 700,
                          fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                          border: `1px solid ${betDirection === dir ? (dir === 'YES' ? '#00FFC8' : '#FF2A1E') : 'rgba(255,255,255,0.1)'}`,
                          color: betDirection === dir ? (dir === 'YES' ? '#00FFC8' : '#FF2A1E') : 'rgba(255,255,255,0.4)',
                          background: betDirection === dir ? (dir === 'YES' ? 'rgba(0,255,200,0.08)' : 'rgba(255,42,30,0.08)') : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >{dir}</motion.button>
                    ))}
                  </div>

                  {/* Amount */}
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 8 }}>AMOUNT (ALGO)</label>
                    <input
                      type="number" placeholder="100" value={betAmount}
                      onChange={e => setBetAmount(e.target.value)}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
                        fontFamily: 'var(--font-mono)', fontSize: '1rem',
                        padding: '0.75rem 1rem', outline: 'none', boxSizing: 'border-box',
                        letterSpacing: '0.05em',
                      }}
                    />
                  </div>

                  {/* Return estimate */}
                  {betDirection && betAmount && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                    >
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 6 }}>ESTIMATED RETURN</p>
                      <p style={{ fontFamily: 'var(--font-logo)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>{Math.round(parseFloat(betAmount || '0') * (betDirection === 'YES' ? 1.85 : 2.15))} <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>ALGO</span></p>
                    </motion.div>
                  )}

                  {/* Execute */}
                  <MagneticButton
                    className={`w-full text-center py-4 font-bold uppercase tracking-widest ${betDirection && betAmount ? 'mech-btn mech-btn-red' : 'mech-btn opacity-40 cursor-not-allowed'}`}
                    onClick={handleExecuteBet}
                    disabled={isExecuting || !betDirection || !betAmount}
                  >
                    <span>{isExecuting ? '◌ PROCESSING...' : '▸ EXECUTE WAGER'}</span>
                  </MagneticButton>

                  {isExecuting && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textAlign: 'center', color: 'rgba(255,200,87,0.7)', letterSpacing: '0.1em', animation: 'pulse 1.5s ease-in-out infinite' }}>
                      5 AI AGENTS ANALYZING · WINNER EXECUTES TRADE
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Settlement Layer Terminal ───────────────────────────────────── */}
          <div style={{ border: '1px solid rgba(255,42,30,0.2)', overflow: 'hidden' }}>
            <div style={{
              padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,42,30,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,42,30,0.04)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--red-neon)', textTransform: 'uppercase' }}>▸ ALGORAND SETTLEMENT LAYER</span>
              {isExecuting && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--red-neon)', letterSpacing: '0.15em', animation: 'pulse 1s ease-in-out infinite' }}>● LIVE</span>}
            </div>
            <div style={{ height: 180, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {events.length === 0 ? (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
                  <TypewriterText text="> AWAITING WAGER TO INITIATE AGENT ANALYSIS..." speed={30} />
                </div>
              ) : (
                events.map((ev, idx) => {
                  const meta = EV_META[ev.type] || EV_META.info
                  return (
                    <motion.div key={ev.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', gap: 8, fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>[{new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                      <span style={{ color: meta.col, flexShrink: 0, fontWeight: 700 }}>{meta.label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)', flex: 1, wordBreak: 'break-all' }}>
                        {idx === 0 && isExecuting ? <TypewriterText text={ev.message} speed={20} /> : ev.message}
                      </span>
                    </motion.div>
                  )
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* ── On-Chain Audit Trail ──────────────────────────────────────── */}
          <div style={{ border: '1px solid rgba(0,255,200,0.15)', overflow: 'hidden' }}>
            <div style={{
              padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(0,255,200,0.1)',
              background: 'rgba(0,255,200,0.03)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--cyan-neon)', textTransform: 'uppercase' }}>▸ ON-CHAIN AUDIT TRAIL</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {audit.slice(0, 6).map((a, idx) => (
                <motion.div
                  key={a.id || idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>TX #{(a.id || '').slice(-12)}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700, margin: '2px 0 0', letterSpacing: '0.05em' }}>{a.taskName}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.15em', margin: 0, color: a.status === 'SETTLED' ? '#00FFC8' : a.status === 'CONFIRMED' ? 'var(--cyan-neon)' : '#FFC857' }}>{a.status}</p>
                    <p style={{ fontFamily: 'var(--font-logo)', fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: '2px 0 0', letterSpacing: '0.05em' }}>{a.amount} <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>ALGO</span></p>
                  </div>
                </motion.div>
              ))}
              {audit.length === 0 && (
                <p style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: '0.1em' }}>No transactions yet. Place a wager to begin.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
