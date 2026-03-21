'use client'

import { colors, spacing } from '@/lib/animations'

export function BottomStatusBar() {
  const coordinatorAddress = '0x7a2f8c9d3e1b5a6f9c2d8e1a3f7b9c5e2a8d1f3'
  const blockHeight = 18342156

  return (
    <footer
      style={{
        backgroundColor: colors.surfaceDarker,
        borderTop: `1px solid ${colors.borderSubtle}`,
        padding: `${spacing.md} ${spacing.lg}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: spacing.lg,
        fontSize: '0.75rem',
      }}
    >
      <div>
        <div style={{ color: colors.textMuted, marginBottom: spacing.xs }}>COORDINATOR</div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            color: colors.accentPrimary,
            fontSize: '0.7rem',
          }}
        >
          {coordinatorAddress}
        </div>
      </div>

      <div>
        <div style={{ color: colors.textMuted, marginBottom: spacing.xs }}>BLOCK HEIGHT</div>
        <div style={{ color: colors.textPrimary, fontWeight: 600 }}>#{blockHeight}</div>
      </div>

      <div>
        <div style={{ color: colors.textMuted, marginBottom: spacing.xs }}>GAS PRICE</div>
        <div style={{ color: colors.textSecondary }}>42 gwei</div>
      </div>

      <div>
        <div style={{ color: colors.textMuted, marginBottom: spacing.xs }}>NETWORK STATUS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: colors.accentSuccess,
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
          <span style={{ color: colors.accentSuccess }}>Synced</span>
        </div>
      </div>
    </footer>
  )
}
