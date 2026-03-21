'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOCK_AGENTS, generateAuditEntry, TerminalEvent, AuditEntry } from '@/lib/mockData'
import { AmbientWavyBackground } from '@/components/AmbientWavyBackground'
import { ParticleNetwork } from '@/components/ParticleNetwork'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'
import { AgentSlotCard } from '@/components/AgentSlotCard'
import { CustomCursor } from '@/components/CustomCursor'
import { TypewriterText } from '@/components/TypewriterText'
import { MagneticButton } from '@/components/MagneticButton'

const EV_META: Record<string, { label: string, col: string }> = {
  info:    { label: 'SYS_MSG',  col: 'rgba(255,255,255,0.4)' },
  success: { label: 'SETTLED',  col: '#FF2A1E' },
  warning: { label: 'AWAIT_TX', col: '#ffaa00' },
  payment: { label: 'X402_REQ', col: 'rgba(255,255,255,0.7)' },
  event:   { label: 'LOG_EVT',  col: 'rgba(255,255,255,0.7)' },
}

export default function App() {
  const [view, setView] = useState<'MARKETPLACE' | 'TERMINAL'>('MARKETPLACE')
  const [selectedAgent, setSelectedAgent] = useState(MOCK_AGENTS[1].id)
  const [taskInput, setTaskInput] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  
  const [events, setEvents] = useState<TerminalEvent[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])

  useEffect(() => { setAudit(Array.from({ length: 4 }, (_, i) => generateAuditEntry(i))) }, [])

  const handleExecute = async () => {
    if (isExecuting) return
    setIsExecuting(true)
    setView('TERMINAL') // Trigger grand iris transition
    
    // Slight delay before matrix stream starts
    setTimeout(async () => {
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
        await new Promise(r => setTimeout(r, 800 + Math.random() * 800))
        setEvents(p => [...p, { id: Date.now().toString(), type: step.type, message: step.msg, timestamp: new Date().toISOString() }])
      }

      setAudit(p => [generateAuditEntry(p.length), ...p].slice(0,8))
      setIsExecuting(false)
    }, 1500)
  }

  // Auto-scroll terminal
  const terminalEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [events])

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden z-10 selection:bg-[#FF2A1E] selection:text-white">
      {/* GLOBAL BACKGROUND ENGINES */}
      <CustomCursor />
      <AmbientWavyBackground />
      <ParticleNetwork />

      {/* ─────────────────────────────────────────────────────────
          HEADER BAR (Floating Glassmorphism)
          ───────────────────────────────────────────────────────── */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{
          margin: '20px 40px',
          padding: '24px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px'
        }}
      >
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ width: 44, height: 44, background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', display: 'grid', placeItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--white)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--font-logo)', fontSize: '1.4rem', letterSpacing: '0.25em', lineHeight: 1.1 }}>
              AZENTYC
            </div>
            <div className="mech-label" style={{ letterSpacing: '0.35em', marginTop: 4 }}>
              AUTONOMOUS COMMERCE INFRASTRUCTURE
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <span className="mech-label cursor-pointer hover:text-white transition-colors">LOG_IN</span>
            <span className="mech-label cursor-pointer hover:text-white transition-colors">REGISTER</span>
          </div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <span onClick={() => setView('MARKETPLACE')} className={`cursor-pointer transition-colors ${view === 'MARKETPLACE' ? 'text-[#FF2A1E]' : 'text-white/70 hover:text-white'}`} style={{ fontFamily: 'var(--font-logo)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
              MARKETPLACE
            </span>
            <span className="cursor-pointer transition-colors hover:text-white text-white/70" style={{ fontFamily: 'var(--font-logo)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>DOCS</span>
            <MagneticButton className="mech-btn mech-btn-red text-[0.75rem] px-[16px] py-[8px]"><span>CONNECT EVM</span></MagneticButton>
          </div>
        </div>
      </motion.header>

      {/* ─────────────────────────────────────────────────────────
          PAGE CONTENT (AnimatePresence View Router)
          ───────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        <AnimatePresence mode="wait">

          {/* =======================================================
              VIEW: MARKETPLACE
              ======================================================= */}
          {view === 'MARKETPLACE' && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.4 } }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col overflow-y-auto"
            >
              {/* Massive Hero Text */}
              <div style={{ padding: '40px 40px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(60px, 10vw, 140px)', fontWeight: 700, lineHeight: '0.85', textTransform: 'uppercase' }}>
                    <GlitchDissolveText text="AZENTYC" glowColor="#FF2A1E" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(60px, 10vw, 140px)', fontWeight: 700, lineHeight: '0.85', textTransform: 'uppercase', color: 'transparent', WebkitTextStroke: '2px #FF2A1E' }}>
                      <GlitchDissolveText glowColor="#FF2A1E">PROTO</GlitchDissolveText>
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: 'clamp(40px, 8vw, 100px)', color: '#FF2A1E', textShadow: '0 0 60px rgba(255,42,30,0.35)', marginLeft: -10 }}>
                      <GlitchDissolveText glowColor="#FF2A1E">01</GlitchDissolveText>
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Layout for Slots & Input */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(500px, 1fr) 400px', gap: 40, padding: '0 40px 60px', flex: 1 }}>
                
                <motion.div 
                  initial="hidden" animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.1 } } }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}
                >
                  {MOCK_AGENTS.map((agent, i) => (
                    <motion.div key={agent.id} variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}>
                      <AgentSlotCard
                        agent={agent}
                        num={(i + 7).toString().padStart(2, '0')}
                        active={selectedAgent === agent.id}
                        onClick={() => setSelectedAgent(agent.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                <div className="flex flex-col sticky top-10 self-start w-full">
                  <div className="mech-panel">
                    <div style={{ padding: '0 0 24px', borderBottom: '1px solid var(--border-dim)', marginBottom: 24 }}>
                      <h3 style={{ fontSize: '1.4rem', marginBottom: 8 }}>COMMAND_INTERFACE</h3>
                      <span className="mech-label">DIRECTIVE FOR <strong>{MOCK_AGENTS.find(a => a.id === selectedAgent)?.name}</strong></span>
                    </div>
                    <textarea
                      rows={5}
                      placeholder="INPUT OPERATIONAL DIRECTIVES HERE..."
                      value={taskInput}
                      onChange={e => setTaskInput(e.target.value)}
                      style={{ marginBottom: 24, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dim)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <MagneticButton className="mech-btn mech-btn-red" onClick={handleExecute} disabled={isExecuting}>
                        <span>AUTHORIZE PROTOCOL</span>
                      </MagneticButton>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* =======================================================
              VIEW: TERMINAL (IRIS WIPE)
              ======================================================= */}
          {view === 'TERMINAL' && (
            <motion.div
              key="terminal"
              initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
              animate={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }} // Grand cinematic iris wipe
              className="absolute inset-0 flex flex-col padding-0 overflow-hidden"
              style={{ background: 'var(--bg-deep)' }} // solid backdrop to hide marketplace entirely
            >
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, padding: '40px', height: '100%' }}>
                
                {/* TERMINAL FEED (Live Matrix) */}
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-red)', background: 'rgba(0,0,0,0.4)', position: 'relative' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-red)', background: 'rgba(255,42,30,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 4, height: 16, background: '#FF2A1E' }}/>
                      <span className="mech-label text-white">AUTONOMOUS FEED // ENCRYPTED NODE</span>
                    </div>
                    {isExecuting && <span className="mech-label text-[#FF2A1E] animate-pulse">REC_</span>}
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '30px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 2.5 }}>
                    {events.length === 0 ? (
                      <div style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <TypewriterText text="> INITIATING HANDSHAKE PROTOCOL. AWAITING FEED FROM COORDINATOR..." speed={30} />
                      </div>
                    ) : (
                      events.map((ev, idx) => {
                        const m = EV_META[ev.type] || EV_META.info
                        // Only typewrite the very latest event
                        const isLatest = idx === events.length - 1 && isExecuting
                        
                        return (
                          <div key={ev.id} style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                            <span style={{ color: 'rgba(255,255,255,0.3)', minWidth: 80 }}>[{new Date(ev.timestamp).toLocaleTimeString('en-US', {hour12:false})}]</span>
                            <span style={{ color: m.col, minWidth: 100 }}>{m.label}</span>
                            <span style={{ color: 'rgba(255,255,255,0.85)', flex: 1 }}>
                              {isLatest ? <TypewriterText text={ev.message} speed={25} /> : ev.message}
                            </span>
                          </div>
                        )
                      })
                    )}
                    <div ref={terminalEndRef}/>
                  </div>
                </div>

                {/* AUDIT LOG & STATUS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                  <div className="mech-panel" style={{ flex: 1 }}>
                    <div style={{ padding: '0 0 24px', borderBottom: '1px solid var(--border-dim)' }}>
                      <span className="mech-label text-white text-[0.8rem]">ALGORAND ON-CHAIN WRITE_LOG</span>
                    </div>
                    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {audit.length === 0 ? <span className="mech-label">NO RECORDS FOUND.</span> : audit.map(a => (
                        <motion.div 
                          key={a.id} 
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-dim)', paddingBottom: 16 }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span className="mech-label text-[0.7rem] text-white">TX_HASH: {a.id.slice(-12)}</span>
                            <span className="mech-label text-[0.8rem] text-white/70">ROUTINE: {a.taskName}</span>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-logo)', fontSize: '0.9rem', color: '#FF2A1E', letterSpacing: '0.05em' }}>{a.amount} USDC</span>
                            <span className="mech-label tracking-widest">{a.status}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <MagneticButton className="mech-btn" onClick={() => setView('MARKETPLACE')}>
                      <span>ABORT & RETURN</span>
                    </MagneticButton>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
