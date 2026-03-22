'use client'

import { Agent } from '@/lib/mockData'

interface LeftSidebarProps {
  agents: Agent[]
  selectedAgentId?: string
}

const NAV_ITEMS = [
  { icon: '⬡', label: 'Overview', active: true },
  { icon: '⤷', label: 'Task Runner', active: false },
  { icon: '≡', label: 'Audit Log', active: false },
  { icon: '◈', label: 'Agent Network', active: false },
]

const AGENT_COLORS: Record<string, { dot: string; cls: string }> = {
  'agent-001': { dot: 'dot-green',  cls: 'badge-green'  },
  'agent-002': { dot: 'dot-blue',   cls: 'badge-blue'   },
  'agent-003': { dot: 'dot-purple', cls: 'badge-purple' },
}

export function LeftSidebar({ agents, selectedAgentId }: LeftSidebarProps) {
  return (
    <aside
      style={{
        width: 240,
        background: 'rgba(8,12,20,0.7)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
        animation: 'slide-in-left 0.2s ease both',
      }}
    >
      {/* ── Navigation ── */}
      <div style={{ padding: '14px 10px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="section-label" style={{ padding: '0 8px', marginBottom: 6 }}>Navigation</div>
        {NAV_ITEMS.map(item => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '8px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              background: item.active ? 'rgba(59,130,246,0.1)' : 'transparent',
              borderLeft: item.active ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: item.active ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: item.active ? 600 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* ── Live Agents ── */}
      <div style={{ padding: '12px 10px 8px', borderBottom: '1px solid var(--border-subtle)', flex: 1 }}>
        <div className="section-label" style={{ padding: '0 8px', marginBottom: 8 }}>
          Live Agents
        </div>
        {agents.map((agent, i) => {
          const colors = AGENT_COLORS[agent.id] || AGENT_COLORS['agent-001']
          const latencies = [99, 210, 180]

          return (
            <div
              key={agent.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 10px',
                borderRadius: 8,
                marginBottom: 3,
                background: selectedAgentId === agent.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                borderLeft: `2px solid ${agent.status === 'active' ? 'var(--accent-green)' : agent.status === 'idle' ? 'var(--accent-blue)' : 'var(--accent-purple)'}`,
              }}
            >
              <span className={`dot ${colors.dot}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="truncate" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {agent.name}
                </div>
                <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Port :{3001 + i}
                </div>
              </div>
              <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent-green)', flexShrink: 0 }}>
                ↑ {latencies[i]}ms
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Blockchain Status ── */}
      <div style={{ padding: '12px 10px' }}>
        <div className="section-label" style={{ padding: '0 8px', marginBottom: 8 }}>Blockchain</div>
        <div style={{ padding: '10px', background: 'rgba(232,65,56,0.06)', border: '1px solid rgba(232,65,56,0.15)', borderRadius: 8, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <svg width="8" height="8" viewBox="0 0 8 8"><polygon points="4,0 8,8 0,8" fill="#e84138"/></svg>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#e84138' }}>Avalanche Fuji</span>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>6,421 USDC</div>
          <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>12 payments today</div>
        </div>
        <div style={{ padding: '10px', background: 'rgba(0,112,220,0.06)', border: '1px solid rgba(0,112,220,0.15)', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0070dc' }}>⬢ Algorand Testnet</span>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>14.2 ALGO</div>
          <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>12 logs on-chain</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '8px 18px 12px', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>
          v0.1.0 · {new Date().toISOString().slice(0, 10)}
        </div>
      </div>
    </aside>
  )
}
