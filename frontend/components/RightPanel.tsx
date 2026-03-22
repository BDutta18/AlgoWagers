'use client'

import { useRef, useEffect } from 'react'
import { TerminalEvent } from '@/lib/mockData'

interface RightPanelProps {
  events: TerminalEvent[]
  isRunning: boolean
  onTogglePlayback: () => void
}

const EVENT_STYLES: Record<string, { label: string; color: string }> = {
  info:    { label: 'INIT',      color: '#8899bb' },
  success: { label: 'SETTLED',   color: '#22c55e' },
  warning: { label: 'PAYING',    color: '#f59e0b' },
  error:   { label: 'ERROR',     color: '#ef4444' },
  payment: { label: 'CALLING',   color: '#3b82f6' },
  event:   { label: 'LOGGING',   color: '#22d3ee' },
}

export function RightPanel({ events, isRunning, onTogglePlayback }: RightPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  const totalPaid = events.filter(e => e.type === 'success').length * 0.005
  const paymentCount = events.filter(e => e.type === 'warning').length

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(4,5,10,0.6)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="section-label">Live Activity</span>
          {isRunning && (
            <div className="badge badge-green" style={{ fontSize: '0.6rem', padding: '2px 7px' }}>
              <span className="dot dot-green" style={{ width: 5, height: 5 }} />
              SSE Live
            </div>
          )}
        </div>

        <div style={{ display: 'flex', align: 'center', gap: 6 }}>
          <button
            onClick={onTogglePlayback}
            className="btn btn-ghost"
            style={{ padding: '4px 11px', fontSize: '0.68rem' }}
          >
            {isRunning ? '⏸ Pause' : '▶ Resume'}
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div
        className="terminal"
        style={{ flex: 1, overflowY: 'auto' }}
      >
        {events.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>$</span>{' '}
            Awaiting task execution...
            <span className="terminal-cursor" />
          </div>
        ) : (
          events.map((event, i) => {
            const style = EVENT_STYLES[event.type] || EVENT_STYLES.info
            const isLast = i === events.length - 1

            return (
              <div key={event.id} className="terminal-line" style={{ marginBottom: 2 }}>
                <span style={{ color: 'var(--text-dim)', flexShrink: 0, fontSize: '0.68rem' }}>
                  [{new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false })}]
                </span>

                <span
                  style={{
                    color: style.color,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    minWidth: 62,
                    fontSize: '0.7rem',
                    flexShrink: 0,
                  }}
                >
                  {style.label}
                </span>

                <span style={{ color: event.type === 'success' ? '#a7f3d0' : 'var(--text-secondary)', fontSize: '0.73rem' }}>
                  {event.message}
                  {isLast && <span className="terminal-cursor" style={{ background: style.color }} />}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer counters */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(4,5,10,0.6)',
          display: 'flex',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div>
          <span className="section-label" style={{ marginRight: 6 }}>Payments</span>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
            {paymentCount}
          </span>
        </div>
        <div>
          <span className="section-label" style={{ marginRight: 6 }}>Total Paid</span>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>
            {totalPaid.toFixed(3)} USDC
          </span>
        </div>
      </div>
    </div>
  )
}
