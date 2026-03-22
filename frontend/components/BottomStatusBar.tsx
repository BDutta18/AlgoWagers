'use client'

import { useState, useEffect } from 'react'

export function BottomStatusBar() {
  const [blockHeight, setBlockHeight] = useState(18342156)
  const [gasPrice, setGasPrice] = useState(42)

  useEffect(() => {
    const id = setInterval(() => {
      setBlockHeight(h => h + 1)
      setGasPrice(Math.floor(38 + Math.random() * 12))
    }, 12000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 34,
        zIndex: 100,
        background: 'rgba(4,6,14,0.92)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 0,
      }}
    >
      {/* Left — Network icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="8" height="8" viewBox="0 0 8 8"><polygon points="4,0 8,8 0,8" fill="#e84138"/></svg>
          <span className="mono" style={{ fontSize: '0.65rem', color: '#e84138', opacity: 0.8 }}>Fuji</span>
        </div>
        <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="mono" style={{ fontSize: '0.65rem', color: '#0070dc', opacity: 0.8 }}>⬢ Algorand</span>
        </div>
        <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="dot dot-purple" style={{ width: 5, height: 5 }} />
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent-purple)', opacity: 0.8 }}>Claude</span>
        </div>
      </div>

      {/* Center — Coordinator address */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Coordinator:{' '}
          <span style={{ color: 'var(--accent-blue)', opacity: 0.7 }}>0x3B2F…a8c4</span>
        </span>
      </div>

      {/* Right — Block height + gas + time */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Block <span style={{ color: 'var(--text-secondary)' }}>#{blockHeight.toLocaleString()}</span>
        </span>
        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Gas <span style={{ color: 'var(--accent-cyan)', opacity: 0.8 }}>{gasPrice} gwei</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="dot dot-green" style={{ width: 5, height: 5 }} />
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent-green)', opacity: 0.8 }}>Synced</span>
        </div>
      </div>
    </footer>
  )
}
