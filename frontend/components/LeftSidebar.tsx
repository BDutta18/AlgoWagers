'use client'

import { Agent } from '@/lib/mockData'
import { colors, spacing, getColorByStatus, getStatusLabel } from '@/lib/animations'

interface LeftSidebarProps {
  agents: Agent[]
  selectedAgentId?: string
}

export function LeftSidebar({ agents, selectedAgentId }: LeftSidebarProps) {
  const totalBalance = agents.reduce((acc, agent) => acc + agent.hourlyRate, 0)

  return (
    <aside
      style={{
        width: '280px',
        backgroundColor: colors.surfaceDarker,
        borderRight: `1px solid ${colors.borderSubtle}`,
        padding: spacing.lg,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
      }}
    >
      {/* Balance Card */}
      <div
        style={{
          backgroundColor: colors.surfaceDark,
          border: `1px solid ${colors.borderPrimary}`,
          borderRadius: '8px',
          padding: spacing.lg,
          boxShadow: `0 0 20px ${colors.accentPrimary}33`,
        }}
      >
        <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: spacing.sm }}>
          AVAILABLE BALANCE
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.accentPrimary }}>
          {totalBalance.toFixed(4)} ETH
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: colors.textTertiary,
            marginTop: spacing.sm,
          }}
        >
          Network: Ethereum
        </div>
      </div>

      {/* Agents List */}
      <div>
        <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: spacing.md, fontWeight: 600 }}>
          ACTIVE AGENTS ({agents.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {agents.map((agent) => (
            <div
              key={agent.id}
              style={{
                backgroundColor:
                  selectedAgentId === agent.id ? `${colors.accentPrimary}22` : colors.surfaceDark,
                border: `1px solid ${selectedAgentId === agent.id ? colors.accentPrimary : colors.borderSubtle}`,
                borderRadius: '6px',
                padding: spacing.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <div style={{ fontWeight: 600, color: colors.textPrimary, fontSize: '0.875rem' }}>
                  {agent.name}
                </div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getColorByStatus(agent.status),
                  }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: colors.textTertiary, marginBottom: spacing.sm }}>
                {agent.model}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: colors.textMuted }}>
                <span>{getStatusLabel(agent.status)}</span>
                <span>${agent.hourlyRate.toFixed(3)}/hr</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
