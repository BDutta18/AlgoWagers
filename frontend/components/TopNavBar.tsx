'use client'

import { useState, useEffect } from 'react'

export function TopNavBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toISOString().slice(0, 19).replace('T', '  ') + 'Z')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 100,
        background: 'rgba(8, 12, 20, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        gap: 16,
      }}
    >
      {/* LEFT — Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Hex icon */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <defs>
            <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-blue)" />
              <stop offset="100%" stopColor="var(--accent-purple)" />
            </linearGradient>
          </defs>
          <polygon
            points="14,2 24,8 24,20 14,26 4,20 4,8"
            fill="url(#hexGrad)"
            opacity="0.18"
            stroke="url(#hexGrad)"
            strokeWidth="1.2"
          />
          <polygon
            points="14,6 21,10 21,18 14,22 7,18 7,10"
            fill="url(#hexGrad)"
            opacity="0.22"
          />
          <circle cx="14" cy="14" r="3.5" fill="url(#hexGrad)" />
        </svg>

        <div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan), var(--accent-purple))',
              backgroundSize: '200% 200%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-logo 5s ease infinite',
            }}
          >
            AgentPay
          </div>
          <div
            className="mono"
            style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: -1, letterSpacing: '0.04em' }}
          >
            Autonomous Multi-Agent Commerce
          </div>
        </div>
      </div>

      {/* CENTER — Agent Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[
          { label: 'Coordinator', color: 'green', cls: 'badge-green' },
          { label: 'Translator', color: 'blue', cls: 'badge-blue' },
          { label: 'Data Agent', color: 'purple', cls: 'badge-purple' },
        ].map((agent) => (
          <div key={agent.label} className={`badge ${agent.cls}`}>
            <span className={`dot dot-${agent.color}`} />
            {agent.label}
          </div>
        ))}

        {/* Demo Mode chip */}
        <div
          className="badge badge-amber"
          style={{ marginLeft: 4 }}
        >
          <span className="dot dot-amber" style={{ width: 5, height: 5 }} />
          DEMO MODE
        </div>
      </div>

      {/* RIGHT — Network badges + wallet + clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avalanche badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(232, 65, 56, 0.09)',
            borderRadius: 6,
            border: '1px solid rgba(232, 65, 56, 0.22)',
            borderLeft: '2px solid #e84138',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 10,10 0,10" fill="#e84138"/></svg>
          <span className="mono" style={{ fontSize: '0.65rem', color: '#e84138' }}>Avalanche Fuji</span>
        </div>

        {/* Algorand badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(0, 112, 220, 0.09)',
            borderRadius: 6,
            border: '1px solid rgba(0, 112, 220, 0.22)',
            borderLeft: '2px solid #0070dc',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#0070dc"/><text x="5" y="7.5" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">A</text></svg>
          <span className="mono" style={{ fontSize: '0.65rem', color: '#0070dc' }}>Algorand Testnet</span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

        {/* Wallet address */}
        <button
          onClick={() => navigator.clipboard?.writeText('0x3B2FaB8c9D8e2F1A4c0E7b3D9') }
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
          title="Click to copy"
        >
          <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', opacity: 0.75 }}>
            0x3B2F…a8c4
          </span>
        </button>

        {/* Clock */}
        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', minWidth: 155 }}>
          {time}
        </span>
      </div>
    </nav>
  )
}
