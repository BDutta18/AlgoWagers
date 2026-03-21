'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MOCK_AGENTS, MOCK_TASKS, generateAuditEntry, generateTerminalEvent, AuditEntry, TerminalEvent } from '@/lib/mockData'

/* ────────────────────────────────────────────────────────────────
   AGENT ORBITAL SVG — the visual centrepiece
   Large precision orbital showing 3 agents rotating around hub
   ──────────────────────────────────────────────────────────────── */

function AgentOrbital({ executing }: { executing: boolean }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        viewBox="0 0 500 500"
        width="100%"
        height="100%"
        style={{ maxWidth: 440, maxHeight: 440, overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E5C3" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#00E5C3" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E5C3" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hubCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%"  stopColor="#00E5C3" />
            <stop offset="100%" stopColor="rgba(0,229,195,0)" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Background ring fades — depth effect */}
        {[180, 145, 110].map((r, i) => (
          <circle
            key={r}
            cx="250" cy="250" r={r}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            strokeDasharray={i === 0 ? '4 8' : i === 1 ? '2 10' : '1 12'}
          />
        ))}

        {/* OUTER ORBIT — Coordinator agent ring */}
        <g style={{ transformOrigin: '250px 250px', animation: `orbit-slow ${executing ? '6s' : '22s'} linear infinite` }}>
          <ellipse cx="250" cy="250" rx="175" ry="60"
            fill="none"
            stroke="rgba(0,229,195,0.22)"
            strokeWidth="1"
            strokeDasharray="3 6"
          />
          {/* Coordinator node */}
          <g style={{ transformOrigin: '425px 250px' }} filter="url(#node-glow)">
            <circle cx="425" cy="250" r="7" fill="rgb(0,229,195)" opacity="0.9" style={{ animation: 'node-pulse 2.2s ease-in-out infinite' }}/>
            <circle cx="425" cy="250" r="12" fill="rgb(0,229,195)" opacity="0.12"/>
          </g>
          {/* Axis label */}
          <text x="425" y="234" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="rgba(0,229,195,0.6)" letterSpacing="1">COORD</text>
        </g>

        {/* MID ORBIT — Translator agent ring */}
        <g style={{ transformOrigin: '250px 250px', animation: `orbit-rev ${executing ? '4s' : '16s'} linear infinite` }}>
          <ellipse cx="250" cy="250" rx="130" ry="50"
            fill="none"
            stroke="rgba(91,158,255,0.25)"
            strokeWidth="1"
          />
          {/* Translator node */}
          <g filter="url(#node-glow)">
            <circle cx="380" cy="250" r="6" fill="#5B9EFF" opacity="0.9" style={{ animation: 'node-pulse 1.8s ease-in-out infinite' }}/>
            <circle cx="380" cy="250" r="10" fill="#5B9EFF" opacity="0.12"/>
          </g>
          <text x="380" y="236" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="rgba(91,158,255,0.6)" letterSpacing="1">TRANS</text>
        </g>

        {/* INNER ORBIT — Data agent ring */}
        <g style={{ transformOrigin: '250px 250px', animation: `orbit-slow2 ${executing ? '3s' : '11s'} linear infinite` }}>
          <ellipse cx="250" cy="250" rx="85" ry="35"
            fill="none"
            stroke="rgba(167,139,250,0.28)"
            strokeWidth="1"
            strokeDasharray="6 4"
          />
          {/* Data node */}
          <g filter="url(#node-glow)">
            <circle cx="335" cy="250" r="5" fill="#A78BFA" opacity="0.9" style={{ animation: 'node-pulse 2.6s ease-in-out infinite' }}/>
            <circle cx="335" cy="250" r="8" fill="#A78BFA" opacity="0.12"/>
          </g>
          <text x="335" y="237" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="rgba(167,139,250,0.6)" letterSpacing="1">DATA</text>
        </g>

        {/* Spiderweb connecting lines from hub */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const x2 = 250 + Math.cos(rad) * 70
          const y2 = 250 + Math.sin(rad) * 70
          return (
            <line
              key={angle}
              x1="250" y1="250"
              x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          )
        })}

        {/* Central hub glow halo */}
        <circle cx="250" cy="250" r="30" fill="url(#hubGrad)" opacity={executing ? 0.6 : 0.3} style={{ transition: 'opacity 0.5s ease' }}/>
        <circle cx="250" cy="250" r="16" fill="url(#hubCore)" opacity={executing ? 1 : 0.7} filter="url(#glow)" style={{ transition: 'opacity 0.5s ease' }}/>
        <circle cx="250" cy="250" r="6"  fill="#FFFFFF"/>

        {/* Central label */}
        <text x="250" y="280" textAnchor="middle"
          fontFamily="'Syne', sans-serif" fontSize="9.5" fontWeight="700"
          fill="rgba(255,255,255,0.4)" letterSpacing="3">
          AGENTPAY
        </text>

        {/* Executing — animated arcs */}
        {executing && [0, 1, 2].map(i => (
          <circle
            key={i}
            cx="250" cy="250"
            r={50 + i * 40}
            fill="none"
            stroke="rgba(0,229,195,0.18)"
            strokeWidth="1.5"
            strokeDasharray="20 40"
            style={{ animation: `orbit-slow ${1.4 + i * 0.5}s linear infinite`, transformOrigin: '250px 250px' }}
          />
        ))}
      </svg>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   TERMINAL PANEL
   ──────────────────────────────────────────────────────────────── */

const EV_META: Record<string, { label: string }> = {
  info:    { label: 'SYS'     },
  success: { label: 'SETTLED' },
  warning: { label: 'PAYING'  },
  error:   { label: 'ERROR'   },
  payment: { label: 'CALLING' },
  event:   { label: 'LOGGING' },
}

function TerminalPanel({ events, isRunning, onToggle }: { events: TerminalEvent[], isRunning: boolean, onToggle: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [events])
  const paid = events.filter(e => e.type === 'success').length * 0.005

  return (
    <div className="terminal-wrap" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Terminal header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* MacOS-style traffic lights but minimal */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['#FF5F57','#FEBC2E','#28C840'].map(c => (
              <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c, opacity: 0.6 }} />
            ))}
          </div>
          <span className="label">Live Feed</span>
          {isRunning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div className="dot dot-sm dot-green" />
              <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.58rem', color: 'var(--green)' }}>STREAMING</span>
            </div>
          )}
        </div>
        <button className="btn" style={{ padding: '4px 10px', fontSize: '0.6rem' }} onClick={onToggle}>
          {isRunning ? '⏸' : '▶'}
        </button>
      </div>

      {/* Terminal lines */}
      <div className="terminal-body" style={{ flex: 1 }}>
        {events.length === 0 ? (
          <div style={{ color: 'var(--t4)', display: 'flex', gap: 8 }}>
            <span style={{ color: 'var(--accent)' }}>$</span>
            <span>awaiting task execution<span className="t-cursor"/></span>
          </div>
        ) : events.map((ev, i) => {
          const meta = EV_META[ev.type] || EV_META.info
          const isLast = i === events.length - 1
          const evClass = `ev-${meta.label}`
          return (
            <div key={ev.id} className={`tline ${evClass}`}>
              <span className="tline-time">{new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false })}</span>
              <span className="tline-label">{meta.label}</span>
              <span className="tline-msg">
                {ev.message}
                {isLast && <span className="t-cursor"/>}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Footer counters */}
      <div style={{
        padding: '8px 14px', borderTop: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', gap: 20, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span className="label">Txns</span>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.75rem', color: 'var(--accent)' }}>
            {events.filter(e => e.type === 'success').length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span className="label">Paid</span>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.75rem', color: 'var(--green)' }}>
            {paid.toFixed(3)} USDC
          </span>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   AUDIT TABLE
   ──────────────────────────────────────────────────────────────── */

const SVC_MAP: Record<string, { icon: string; cls: string; short: string }> = {
  'Web Scraping':       { icon: '⬡', cls: 'tag-accent', short: 'Translation'  },
  'Sentiment Analysis': { icon: '◈', cls: 'tag accent',  short: 'Exchange Rate' },
  'Code Audit':         { icon: '⧫', cls: 'tag-dim',     short: 'News Feed'    },
}

function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s/60)}m`
  return `${Math.floor(s/3600)}h`
}

function AuditTable({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--t4)' }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.7rem' }}>
          No on-chain records yet. Execute a task to generate blockchain audit logs.
        </div>
      </div>
    )
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Task ID</th><th>Service</th><th>USDC</th>
          <th>AVAX Txn</th><th>ALGO Txn</th><th>Status</th><th>Age</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(e => {
          const svc = SVC_MAP[e.taskName] || SVC_MAP['Web Scraping']
          const statusCls = e.status === 'completed' ? 'tag-green' : e.status === 'pending' ? 'tag-amber' : 'tag-red'
          return (
            <tr key={e.id}>
              <td>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.65rem', color: 'var(--t3)' }}>
                  {e.id.slice(-8)}
                </span>
              </td>
              <td><span className={`tag ${svc.cls}`}>{svc.icon} {svc.short}</span></td>
              <td><span style={{ fontFamily: 'var(--font-m)', color: 'var(--green)', fontSize: '0.7rem' }}>{e.amount}</span></td>
              <td>
                <a href={`https://testnet.snowtrace.io/tx/${e.txHash}`} target="_blank" rel="noopener noreferrer" className="link-ext" title={e.txHash}>
                  {e.txHash.slice(0,6)}…{e.txHash.slice(-4)} ↗
                </a>
              </td>
              <td>
                <a href={`https://testnet.explorer.perawallet.app/tx/${e.txHash}`} target="_blank" rel="noopener noreferrer" className="link-ext" title={e.txHash}>
                  {e.txHash.slice(0,6)}…{e.txHash.slice(-4)} ↗
                </a>
              </td>
              <td><span className={`tag ${statusCls}`}>{e.status}</span></td>
              <td><span style={{ fontFamily: 'var(--font-m)', color: 'var(--t4)', fontSize: '0.62rem' }}>{timeAgo(e.timestamp)}</span></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/* ────────────────────────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────────────────────────── */

const TASK_PRESETS = [
  { id: 'translate', label: 'Translate', icon: '⬡', desc: 'DeepL API · 0.005 USDC' },
  { id: 'rates',     label: 'Live Rates', icon: '◈', desc: 'ECB Frankfurter · 0.002 USDC' },
  { id: 'news',      label: 'News Feed',  icon: '⧫', desc: 'GNews API · 0.002 USDC' },
]

export default function AgentPayApp() {
  const [time, setTime] = useState('')
  const [blockH, setBlockH] = useState(18342156)
  const [taskInput, setTaskInput] = useState('')
  const [content, setContent] = useState('')
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set(['translate', 'rates']))
  const [isExecuting, setIsExecuting] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [events, setEvents] = useState<TerminalEvent[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [sseRunning, setSseRunning] = useState(true)
  const [copied, setCopied] = useState(false)
  const eventIdx = useRef(0)

  // Clock
  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().slice(0,19).replace('T', ' ') + 'Z')
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  // Block height
  useEffect(() => {
    const id = setInterval(() => setBlockH(h => h + 1), 12000); return () => clearInterval(id)
  }, [])

  // Seed audit
  useEffect(() => {
    setAudit(Array.from({ length: 6 }, (_, i) => generateAuditEntry(i)))
  }, [])

  // Demo SSE stream
  useEffect(() => {
    if (!sseRunning) return
    const id = setInterval(() => {
      setEvents(prev => {
        const ev = generateTerminalEvent(eventIdx.current++, MOCK_AGENTS.map(a => a.id))
        return [...prev.slice(-60), ev]
      })
    }, 1400)
    return () => clearInterval(id)
  }, [sseRunning])

  // Audit periodic update
  useEffect(() => {
    const id = setInterval(() => {
      setAudit(prev => [generateAuditEntry(prev.length), ...prev].slice(0, 12))
    }, 14000)
    return () => clearInterval(id)
  }, [])

  const handleExecute = useCallback(async () => {
    if (isExecuting) return
    setIsExecuting(true)
    setHasResult(false)

    const steps = [
      { type: 'info' as const, msg: 'Task received. Routing to coordinator...' },
      { type: 'event' as const, msg: 'Consulting Claude 3.5 Sonnet for routing decision...' },
      { type: 'payment' as const, msg: '→ agent-translator :3002' },
      { type: 'warning' as const, msg: '402 Payment Required · 0.005 USDC' },
      { type: 'warning' as const, msg: 'Signing USDC tx on Avalanche Fuji C-Chain...' },
      { type: 'success' as const, msg: '0x4a3f…e817 confirmed · +0.005 USDC settled' },
      { type: 'payment' as const, msg: '→ agent-data :3003' },
      { type: 'warning' as const, msg: '402 Payment Required · 0.002 USDC' },
      { type: 'warning' as const, msg: 'Signing USDC tx on Avalanche Fuji C-Chain...' },
      { type: 'success' as const, msg: '0xb82c…a91d confirmed · +0.002 USDC settled' },
      { type: 'event' as const, msg: 'Claude synthesizing combined response...' },
      { type: 'event' as const, msg: 'Writing audit record to Algorand Testnet...' },
      { type: 'success' as const, msg: 'Task complete. Total: 0.007 USDC paid.' },
    ]

    setSseRunning(false)
    setEvents([])
    eventIdx.current = 0

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400))
      const ev: TerminalEvent = {
        id: `exec-${Date.now()}-${Math.random()}`,
        type: step.type,
        message: step.msg,
        timestamp: new Date().toISOString(),
      }
      setEvents(prev => [...prev, ev])
    }

    await new Promise(r => setTimeout(r, 300))
    setAudit(prev => [generateAuditEntry(prev.length), ...prev].slice(0, 12))
    setIsExecuting(false)
    setHasResult(true)
    setSseRunning(true)
  }, [isExecuting])

  const copyAddr = () => {
    navigator.clipboard?.writeText('0x3B2FaB8c9D8e2F1A4c0E7b3D9')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const togglePreset = (id: string) => {
    setSelectedPresets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 2,
    }}>

      {/* ══════════════════════════════════════════
          TOP NAV — DeLorean split header style
          ══════════════════════════════════════════ */}
      <header style={{
        height: 54,
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(6,6,10,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 50,
      }}>
        {/* Logo cell */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 22px',
          borderRight: '1px solid var(--border)',
          minWidth: 200,
        }}>
          {/* Hex icon */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <polygon points="11,1 20,6 20,16 11,21 2,16 2,6" fill="none" stroke="rgba(0,229,195,0.5)" strokeWidth="1"/>
            <polygon points="11,5 17,8.5 17,13.5 11,17 5,13.5 5,8.5" fill="rgba(0,229,195,0.1)"/>
            <circle cx="11" cy="11" r="3" fill="var(--accent)"/>
          </svg>
          <div>
            <div style={{
              fontFamily: 'var(--font-d)',
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '-0.04em',
              color: 'var(--t1)',
              lineHeight: 1,
            }}>
              AGENTPAY
            </div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.55rem', color: 'var(--t4)', letterSpacing: '0.08em', marginTop: 1 }}>
              AUTONOMOUS · COMMERCE
            </div>
          </div>
        </div>

        {/* Agent status pills */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          flex: 1,
          padding: '0 20px',
        }}>
          {[
            { label: 'Coordinator', dot: 'dot-green', port: '3001' },
            { label: 'Translator',  dot: 'dot-accent', port: '3002' },
            { label: 'Data Agent',  dot: 'dot-green', port: '3003' },
          ].map((a, i) => (
            <div key={a.label} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0 16px',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
              height: '100%',
            }}>
              <div className={`dot dot-sm ${a.dot}`}/>
              <div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.65rem', color: 'var(--t2)' }}>{a.label}</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.55rem', color: 'var(--t4)' }}>:{a.port}</div>
              </div>
            </div>
          ))}

          {/* Demo mode */}
          <div style={{ marginLeft: 6 }}>
            <span className="tag tag-amber" style={{ fontSize: '0.57rem' }}>
              <div className="dot dot-sm dot-amber"/>
              DEMO
            </span>
          </div>
        </div>

        {/* Right cells */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          borderLeft: '1px solid var(--border)',
        }}>
          {/* Network badges */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
            borderRight: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="8" height="8" viewBox="0 0 8 8"><polygon points="4,0 8,8 0,8" fill="#E31B23"/></svg>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: '#E31B23', opacity: 0.85 }}>Fuji</span>
            </div>
            <div style={{ width: 1, height: 12, background: 'var(--border)' }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: '#0070DC', opacity: 0.85 }}>⬢ Algo</span>
            </div>
          </div>

          {/* Wallet + clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px' }}>
            <button
              onClick={copyAddr}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              title="Copy address"
            >
              <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.65rem', color: copied ? 'var(--accent)' : 'var(--t3)' }}>
                {copied ? 'Copied!' : '0x3B2F…a8c4'}
              </span>
            </button>
            <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: 'var(--t4)', minWidth: 148 }}>
              {time}
            </span>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          BODY — Three column grid
          ══════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '200px 1fr 300px',
        overflow: 'hidden',
        height: 'calc(100vh - 54px - 32px)',
      }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(6,6,10,0.6)',
        }}>
          {/* Agent list */}
          <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div className="label" style={{ padding: '0 14px', marginBottom: 10 }}>Agents</div>
            {MOCK_AGENTS.map((a, i) => {
              const dots = ['dot-green','dot-accent','dot-green']
              const colors = ['var(--accent)','#5B9EFF','#A78BFA']
              return (
                <div key={a.id} style={{
                  padding: '9px 14px',
                  borderLeft: `2px solid ${isExecuting ? colors[i] : 'transparent'}`,
                  transition: 'border-color 0.3s ease',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className={`dot dot-sm ${dots[i]}`}/>
                      <span style={{ fontFamily: 'var(--font-b)', fontSize: '0.72rem', fontWeight: 500, color: 'var(--t2)' }}>
                        {a.name}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.58rem', color: colors[i], opacity: 0.8 }}>
                      :{3001 + i}
                    </span>
                  </div>
                  <div style={{ paddingLeft: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span className="label" style={{ color: 'var(--t4)' }}>{a.model}</span>
                    <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.58rem', color: 'var(--t4)' }}>
                      {[99, 210, 180][i]}ms
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Blockchain balances */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div className="label" style={{ marginBottom: 10 }}>Blockchain</div>
            <div style={{
              background: 'rgba(227,27,35,0.06)',
              border: '1px solid rgba(227,27,35,0.18)',
              borderLeft: '2px solid #E31B23',
              padding: '9px 10px',
              marginBottom: 8,
            }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 3 }}>
                <svg width="7" height="7" viewBox="0 0 8 8"><polygon points="4,0 8,8 0,8" fill="#E31B23"/></svg>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: '#E31B23' }}>Avalanche Fuji</span>
              </div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--t1)' }}>6,421 USDC</div>
              <div className="label" style={{ color: 'var(--t4)' }}>12 payments today</div>
            </div>
            <div style={{
              background: 'rgba(0,112,220,0.06)',
              border: '1px solid rgba(0,112,220,0.18)',
              borderLeft: '2px solid #0070DC',
              padding: '9px 10px',
            }}>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: '#0070DC', marginBottom: 3 }}>⬢ Algorand Testnet</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--t1)' }}>14.2 ALGO</div>
              <div className="label" style={{ color: 'var(--t4)' }}>12 logs on-chain</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding: '14px', flex: 1 }}>
            <div className="label" style={{ marginBottom: 10 }}>Session</div>
            {[
              ['Tasks Run', '4'],
              ['USDC Spent', '0.028'],
              ['ALGO Fees', '0.004'],
              ['Uptime', '99.8%'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, alignItems: 'baseline' }}>
                <span className="label" style={{ color: 'var(--t4)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.72rem', color: 'var(--t2)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Version footer */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div className="label" style={{ color: 'var(--t4)' }}>v0.1.0 · 2026-03-21</div>
          </div>
        </aside>

        {/* ── CENTER MAIN ── */}
        <main style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRight: '1px solid var(--border)',
        }}>
          {/* ORBITAL VISUAL — top section, the DeLorean hero feel */}
          <div style={{
            flex: '0 0 auto',
            height: isExecuting ? 210 : 240,
            position: 'relative',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'height 0.5s var(--ease)',
            overflow: 'hidden',
          }}>
            {/* Big ambient text — editorial typographic feel (DeLorean-inspired) */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              overflow: 'hidden',
            }}>
              <div style={{
                fontFamily: 'var(--font-d)',
                fontWeight: 800,
                fontSize: 'clamp(60px, 10vw, 110px)',
                letterSpacing: '-0.06em',
                color: 'rgba(255,255,255,0.025)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}>
                AGENTPAY
              </div>
            </div>

            {/* Orbital SVG */}
            <div style={{ width: 280, height: 220, position: 'relative', zIndex: 1 }}>
              <AgentOrbital executing={isExecuting}/>
            </div>

            {/* Right side — status data (DeLorean detail panel) */}
            <div style={{
              position: 'absolute',
              right: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              zIndex: 2,
            }}>
              <div style={{ textAlign: 'right' }}>
                <div className="label">Claude Model</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.7rem', color: 'var(--accent)' }}>Sonnet 3.5</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="label">Protocol</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.7rem', color: 'var(--t2)' }}>x402 / USDC</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="label">Audit Chain</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.7rem', color: 'var(--t2)' }}>Algorand</div>
              </div>
              {isExecuting && (
                <div className="tag tag-accent" style={{ alignSelf: 'flex-end' }}>
                  <div className="dot dot-sm dot-accent"/>EXECUTING
                </div>
              )}
            </div>

            {/* Left side status */}
            <div style={{
              position: 'absolute',
              left: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              zIndex: 2,
            }}>
              <div>
                <div className="label">Network</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.7rem', color: '#E31B23' }}>Avalanche Fuji</div>
              </div>
              <div>
                <div className="label">Block</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.7rem', color: 'var(--t2)' }}>#{blockH.toLocaleString()}</div>
              </div>
              <div>
                <div className="label">Status</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <div className="dot dot-sm dot-green"/>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.7rem', color: 'var(--green)' }}>Synced</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable lower content */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* TASK CONSOLE */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-d)',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    letterSpacing: '-0.03em',
                    color: 'var(--t1)',
                  }}>
                    Task Console
                  </div>
                  <div className="label" style={{ marginTop: 1 }}>Autonomous multi-agent orchestration</div>
                </div>
                <div className="tag tag-dim" style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem' }}>
                  <div className="dot dot-sm dot-accent"/>Claude 3.5 Sonnet
                </div>
              </div>

              {/* Service toggles */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {TASK_PRESETS.map(p => {
                  const active = selectedPresets.has(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePreset(p.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '6px 13px',
                        background: active ? 'rgba(0,229,195,0.08)' : 'transparent',
                        border: `1px solid ${active ? 'var(--accent-line)' : 'var(--border)'}`,
                        color: active ? 'var(--accent)' : 'var(--t3)',
                        fontFamily: 'var(--font-m)',
                        fontSize: '0.63rem',
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                      <span style={{ opacity: 0.5, fontSize: '0.55rem' }}>{p.desc}</span>
                    </button>
                  )
                })}
              </div>

              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <input
                  type="text"
                  placeholder="e.g. Translate this to Hindi and include today's USD → INR exchange rate"
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                />
                <textarea
                  placeholder="Paste content to process here..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={3}
                  style={{ marginTop: 8 }}
                />
              </div>

              {/* Footer — cost preview + execute */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="tag tag-accent" style={{ fontSize: '0.58rem' }}>Translation · 0.005 USDC</span>
                  <span className="tag tag-dim" style={{ fontSize: '0.58rem' }}>Data · 0.002 USDC</span>
                </div>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="btn btn-execute"
                >
                  {isExecuting ? (
                    <><div className="spinner" style={{ borderTopColor: 'var(--t4)' }}/> Executing…</>
                  ) : (
                    <>
                      <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="1,0 10,5 1,10" fill="currentColor"/></svg>
                      Execute Task
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RESULT PANEL */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
              minHeight: 140,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
                  Result
                </div>
                {hasResult && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="tag tag-accent" style={{ fontSize: '0.58rem' }}>✓ Translator</span>
                    <span className="tag tag-green"  style={{ fontSize: '0.58rem' }}>✓ Data Agent</span>
                    <span className="tag tag-dim"    style={{ fontSize: '0.58rem' }}>0.007 USDC total</span>
                  </div>
                )}
              </div>

              {isExecuting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Progress bar */}
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0, height: '100%',
                      background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                      width: '40%',
                      animation: 'progress-move 1.4s ease-in-out infinite',
                    }}/>
                  </div>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.65rem', color: 'var(--accent)', flexShrink: 0 }}>
                    Agents collaborating…
                  </span>
                </div>
              ) : hasResult ? (
                <div style={{
                  fontFamily: 'var(--font-b)',
                  fontSize: '0.8rem',
                  lineHeight: 1.7,
                  color: 'var(--t2)',
                  borderLeft: '2px solid var(--accent-line)',
                  paddingLeft: 14,
                }}>
                  Translation complete: <span style={{ color: 'var(--t1)' }}>"ब्लॉकचेन वित्त को बदल रहा है।"</span><br/>
                  <span style={{ color: 'var(--t3)' }}>Live ECB rate: USD → INR = </span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-m)' }}>₹83.42</span>
                  <span style={{ color: 'var(--t3)' }}> · Updated daily from ECB data feeds.</span>
                </div>
              ) : (
                <div style={{
                  fontFamily: 'var(--font-m)',
                  fontSize: '0.7rem',
                  color: 'var(--t4)',
                  fontStyle: 'italic',
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  Submit a task above to initiate autonomous agent execution.
                </div>
              )}
            </div>

            {/* AUDIT TABLE */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '10px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-d)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '-0.02em' }}>
                    On-Chain Audit
                  </span>
                  <span className="label" style={{ marginLeft: 10 }}>Algorand Testnet Indexer</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="tag tag-dim" style={{ fontSize: '0.58rem' }}>⬢ Pera Explorer</span>
                  <button className="btn" style={{ padding: '4px 10px', fontSize: '0.6rem' }}>↻ Refresh</button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <AuditTable entries={audit}/>
              </div>
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL — Terminal ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TerminalPanel events={events} isRunning={sseRunning} onToggle={() => setSseRunning(r => !r)}/>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          BOTTOM STATUS BAR
          ══════════════════════════════════════════ */}
      <footer style={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(6,6,10,0.95)',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {[
            { icon: '▲', label: 'Fuji', color: '#E31B23' },
            { icon: '⬢', label: 'Algorand', color: '#0070DC' },
            { icon: '◆', label: 'Claude', color: '#A78BFA' },
          ].map(n => (
            <div key={n.label} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: n.color, opacity: 0.8 }}>{n.icon} {n.label}</span>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: 'var(--t4)' }}>
          Coordinator: <span style={{ color: 'var(--t3)' }}>0x3B2F…a8c4</span>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: 'var(--t4)' }}>
            Block <span style={{ color: 'var(--t2)' }}>#{blockH.toLocaleString()}</span>
          </span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div className="dot dot-sm dot-green"/>
            <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: 'var(--green)' }}>Synced</span>
          </div>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.6rem', color: 'var(--t4)' }}>{time}</span>
        </div>
      </footer>
    </div>
  )
}
