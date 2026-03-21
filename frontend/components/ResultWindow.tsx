'use client'

import { colors, spacing } from '@/lib/animations'

interface ResultWindowProps {
  result: {
    agentName: string
    taskName: string
    cost: string
    duration: string
  } | null
  isExecuting: boolean
}

export function ResultWindow({ result, isExecuting }: ResultWindowProps) {
  return (
    <div
      style={{
        backgroundColor: colors.surfaceDark,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '8px',
        padding: spacing.lg,
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600 }}>
          EXECUTION RESULT
        </div>
      </div>

      {isExecuting ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: spacing.md,
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: colors.accentPrimary,
              animation: 'pulse-glow 1.5s ease-in-out infinite',
            }}
          />
          <span style={{ color: colors.textSecondary }}>Processing...</span>
        </div>
      ) : result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div
            style={{
              backgroundColor: colors.surfaceInput,
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: '6px',
              padding: spacing.md,
            }}
          >
            <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: spacing.sm }}>
              AGENT ASSIGNED
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: colors.accentPrimary,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {result.agentName}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <div
              style={{
                backgroundColor: colors.surfaceInput,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: '6px',
                padding: spacing.md,
              }}
            >
              <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: spacing.sm }}>
                EXECUTION TIME
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.accentSuccess }}>
                {result.duration}
              </div>
            </div>

            <div
              style={{
                backgroundColor: colors.surfaceInput,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: '6px',
                padding: spacing.md,
              }}
            >
              <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: spacing.sm }}>
                TOTAL COST
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.accentSecondary }}>
                {result.cost} ETH
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: `${colors.accentSuccess}11`,
              border: `1px solid ${colors.accentSuccess}33`,
              borderRadius: '6px',
              padding: spacing.md,
            }}
          >
            <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: spacing.sm }}>
              TASK COMPLETED
            </div>
            <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>
              {result.taskName} executed successfully by {result.agentName}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: colors.textMuted,
          }}
        >
          Ready to execute tasks...
        </div>
      )}
    </div>
  )
}
