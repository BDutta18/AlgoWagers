'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOCK_AGENTS, generateAuditEntry, generateTerminalEvent, AuditEntry, TerminalEvent } from '@/lib/mockData'
import { AmbientWavyBackground } from '@/components/AmbientWavyBackground'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'
import { AgentSlotCard } from '@/components/AgentSlotCard'

/* =========================================================================
   DELOREAN "ALPHA" GLITCH HERO
   ========================================================================= */

function HeroDisplay() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      style={{ padding: '60px 40px', position: 'relative' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(80px, 12vw, 160px)',
          fontWeight: 700,
          lineHeight: '0.85',
          textTransform: 'uppercase'
        }}>
          <GlitchDissolveText text="AGENT" glowColor="#FF2A1E" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(80px, 12vw, 160px)',
            fontWeight: 700,
            lineHeight: '0.85',
            textTransform: 'uppercase',
            color: 'transparent',
            WebkitTextStroke: '2px #FF2A1E',
          }}>
            <GlitchDissolveText glowColor="#FF2A1E">PROTO</GlitchDissolveText>
          </div>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: 'clamp(60px, 10vw, 140px)',
            color: '#FF2A1E',
            textShadow: '0 0 60px rgba(255,42,30,0.35)',
            marginLeft: -10
          }}>
            <GlitchDissolveText glowColor="#FF2A1E">01</GlitchDissolveText>
          </span>
        </div>
      </div>

      <div style={{
        marginTop: 40,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        borderBottom: '2px solid #FF2A1E',
        paddingBottom: 20,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-logo)', fontSize: '1.2rem', color: '#FF2A1E', letterSpacing: '0.15em', marginBottom: 10 }}>MARKETPLACE</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ width: 10, height: 2, background: '#FF2A1E' }}/>
            <span className="mech-label" style={{ color: '#FF2A1E' }}>ACTIVE WORKERS: {MOCK_AGENTS.length}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* =========================================================================
   TERMINAL (Industrial Style)
   ========================================================================= */

const EV_META: Record<string, { label: string, col: string }> = {
  info:    { label: 'SYS_MSG',  col: 'rgba(255,255,255,0.4)' },
  success: { label: 'SETTLED',  col: '#FF2A1E' },
  warning: { label: 'AWAIT_TX', col: '#ffaa00' },
  payment: { label: 'X402_REQ', col: 'rgba(255,255,255,0.7)' },
  event:   { label: 'LOG_EVT',  col: 'rgba(255,255,255,0.7)' },
}

function TerminalPanel({ events }: { events: TerminalEvent[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }) }, [events])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 4, height: 16, background: '#FF2A1E' }}/>
          <span className="mech-label">LIVE SYSTEM FEED // DATA STREAM</span>
        </div>
        <span className="mech-label text-[#FF2A1E] animate-pulse">REC_</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 2 }}>
        {events.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>{'>'} System ready. Awaiting operational input...<span style={{ animation: 'blink 1s step-end infinite' }}>_</span></div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map(ev => {
              const m = EV_META[ev.type] || EV_META.info
              return (
                <motion.div 
                  key={ev.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', gap: 16 }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.4)', minWidth: 60 }}>[{new Date(ev.timestamp).toLocaleTimeString('en-US', {hour12:false})}]</span>
                  <span style={{ color: m.col, minWidth: 80 }}>{m.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{ev.message}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={ref}/>
      </div>
    </div>
  )
}

/* =========================================================================
   MAIN APP
   ========================================================================= */

export default function App() {
  const [selectedAgent, setSelectedAgent] = useState(MOCK_AGENTS[1].id)
  const [taskInput, setTaskInput] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [events, setEvents] = useState<TerminalEvent[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])

  // Seed audit
  useEffect(() => { setAudit(Array.from({ length: 4 }, (_, i) => generateAuditEntry(i))) }, [])

  const handleExecute = async () => {
    if (isExecuting) return
    setIsExecuting(true)
    setEvents([])

    const steps = [
      { type: 'info' as const, msg: 'INITIALIZING AUTONOMOUS ROUTINE...' },
      { type: 'payment' as const, msg: 'NEGOTIATING X402 PROTOCOL WITH TARGET AGENT' },
      { type: 'warning' as const, msg: 'AWAITING AVALANCHE C-CHAIN SETTLEMENT [42000 GWEI]' },
      { type: 'success' as const, msg: 'TXN OK: 0x4a3f...e817. FUNDS DEPOSITED.' },
      { type: 'event' as const, msg: 'EXECUTION PARAMETERS SENT. AWAITING PROCESSOR...' },
      { type: 'success' as const, msg: 'PROCESS OK. TERMINATING THREAD.' },
    ]

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 500))
      setEvents(p => [...p, { id: Date.now().toString(), type: step.type, message: step.msg, timestamp: new Date().toISOString() }])
    }

    setAudit(p => [generateAuditEntry(p.length), ...p].slice(0,8))
    setIsExecuting(false)
  }

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden z-10">
      <AmbientWavyBackground />

      {/* ─────────────────────────────────────────────────────────
          HEADER BAR (DeLorean Top Nav)
          ───────────────────────────────────────────────────────── */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{
          padding: '24px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* DeLorean-style Logo Layout */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ width: 44, height: 44, background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', display: 'grid', placeItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--white)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-logo)',
              fontSize: '1.4rem',
              letterSpacing: '0.25em',
              lineHeight: 1.1,
            }}>
              AGENTP/\Y
            </div>
            <div className="mech-label" style={{ letterSpacing: '0.35em', marginTop: 4 }}>
              AUTONOMOUS COMMERCE INFRASTRUCTURE
            </div>
          </div>
        </div>

        {/* DeLorean Top-right Nav Links */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <span className="mech-label" style={{ color: 'var(--white)' }}>LOG_IN</span>
            <span className="mech-label" style={{ color: 'var(--white)' }}>REGISTER</span>
          </div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <span className="cursor-pointer transition-colors hover:text-[#FF2A1E]" style={{ fontFamily: 'var(--font-logo)', fontSize: '0.9rem', color: 'var(--white)', letterSpacing: '0.1em' }}>MARKETPLACE</span>
            <span className="cursor-pointer transition-colors hover:text-white" style={{ fontFamily: 'var(--font-logo)', fontSize: '0.9rem', color: 'var(--white-70)', letterSpacing: '0.1em' }}>DOCS</span>
            <button className="mech-btn mech-btn-red" style={{ padding: '8px 16px', fontSize: '0.75rem' }}><span>CONNECT EVM</span></button>
          </div>
        </div>
      </motion.header>

      {/* ─────────────────────────────────────────────────────────
          PAGE CONTENT
          ───────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative', zIndex: 10 }}>

        {/* Big Glitch Hero */}
        <HeroDisplay />

        {/* Bottom Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(400px, 1fr) 500px',
          gap: 40,
          padding: '0 40px 60px',
          flex: 1,
        }}>

          {/* LEFT: Agent Slots & Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

            {/* Grid of 3D slot cards */}
            <motion.div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 20,
              }}
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.1 } }
              }}
            >
              {MOCK_AGENTS.map((agent, i) => (
                <motion.div key={agent.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                  <AgentSlotCard
                    agent={agent}
                    num={(i + 7).toString().padStart(2, '0')}
                    active={selectedAgent === agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Command Input Area */}
            <motion.div 
              className="mech-panel"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div style={{ padding: '0 0 24px', borderBottom: '1px solid var(--border-dim)', marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: 8 }}>COMMAND_INTERFACE</h3>
                <span className="mech-label">DIRECTIVE INPUT FOR TARGET AGENT</span>
              </div>
              <textarea
                rows={4}
                placeholder="INPUT OPERATIONAL DIRECTIVES HERE..."
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                style={{ marginBottom: 24, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dim)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="mech-btn mech-btn-red" onClick={handleExecute} disabled={isExecuting}>
                  <span>{isExecuting ? 'PROCESSING_TICK...' : 'EXECUTE_PROTOCOL [ENTER]'}</span>
                </button>
              </div>
            </motion.div>

          </div>

          {/* RIGHT: Terminal & Audit */}
          <motion.div 
            style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-dim)' }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <TerminalPanel events={events} />

            {/* Log Table underneath */}
            <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-dim)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-dim)' }}>
                 <span className="mech-label">ALGORAND ON-CHAIN WRITE_LOG</span>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {audit.length === 0 ? <span className="mech-label">NO RECORDS FOUND.</span> : audit.map(a => (
                  <motion.div 
                    key={a.id} 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-dim)', paddingBottom: 10 }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="mech-label text-white">TX: {a.id.slice(-10)}</span>
                      <span className="mech-label">ROUTINE: {a.taskName}</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-logo)', fontSize: '0.8rem', color: '#FF2A1E' }}>{a.amount} USDC</span>
                      <span className="mech-label">{a.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>

        {/* Very bottom footer bar */}
        <div style={{
          padding: '24px 40px',
          borderTop: '1px solid var(--border-dim)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span className="mech-label">© 2026 AUTONOMOUS AGENT ORG.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <span className="mech-label">SYS_STATUS: ONLINE</span>
            <span className="mech-label text-[#FF2A1E]">C-CHAIN: SYNCED</span>
          </div>
        </div>

      </main>
    </div>
  )
}
