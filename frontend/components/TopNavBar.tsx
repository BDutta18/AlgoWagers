'use client'

import { colors, spacing } from '@/lib/animations'

export function TopNavBar() {
  const currentTime = new Date().toLocaleTimeString('en-US', { timeZone: 'UTC' })

  return (
    <nav
      style={{
        backgroundColor: colors.surfaceDarker,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        padding: `${spacing.md} ${spacing.lg}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.875rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${colors.accentPrimary}, ${colors.accentSecondary})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}
        >
          AGENTPAY
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colors.accentSuccess,
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
          <span style={{ color: colors.textSecondary }}>Network: Online</span>
        </div>

        <div style={{ borderLeft: `1px solid ${colors.borderSubtle}`, height: '20px' }} />

        <div style={{ color: colors.textMuted }}>
          {currentTime}
          <span style={{ color: colors.textTertiary }}> UTC</span>
        </div>
      </div>
    </nav>
  )
}
