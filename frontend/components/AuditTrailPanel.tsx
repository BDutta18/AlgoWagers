'use client'

import { AuditEntry } from '@/lib/mockData'
import { colors, spacing, getColorByStatus } from '@/lib/animations'

interface AuditTrailPanelProps {
  entries: AuditEntry[]
}

export function AuditTrailPanel({ entries }: AuditTrailPanelProps) {
  return (
    <div
      style={{
        backgroundColor: colors.surfaceDark,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: `${spacing.md} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.borderSubtle}`,
          backgroundColor: colors.surfaceInput,
        }}
      >
        <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600 }}>
          BLOCKCHAIN AUDIT TRAIL
        </div>
      </div>

      <div
        style={{
          overflowX: 'auto',
          maxHeight: '400px',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.75rem',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: colors.surfaceInput }}>
              <th
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  textAlign: 'left',
                  color: colors.textMuted,
                  fontWeight: 600,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                TX HASH
              </th>
              <th
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  textAlign: 'left',
                  color: colors.textMuted,
                  fontWeight: 600,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                AGENT
              </th>
              <th
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  textAlign: 'left',
                  color: colors.textMuted,
                  fontWeight: 600,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                TASK
              </th>
              <th
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  textAlign: 'left',
                  color: colors.textMuted,
                  fontWeight: 600,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                AMOUNT
              </th>
              <th
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  textAlign: 'left',
                  color: colors.textMuted,
                  fontWeight: 600,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.id}
                style={{
                  backgroundColor:
                    index % 2 === 0 ? 'transparent' : `${colors.accentPrimary}08`,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <td
                  style={{
                    padding: `${spacing.md} ${spacing.lg}`,
                    color: colors.accentSecondary,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <a
                    href={`#${entry.txHash}`}
                    style={{
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.target as HTMLAnchorElement).style.color =
                        colors.accentPrimary
                    }}
                    onMouseLeave={(e) => {
                      ;(e.target as HTMLAnchorElement).style.color =
                        colors.accentSecondary
                    }}
                  >
                    {entry.txHash.slice(0, 10)}...
                  </a>
                </td>
                <td style={{ padding: `${spacing.md} ${spacing.lg}`, color: colors.textSecondary }}>
                  {entry.agentName}
                </td>
                <td style={{ padding: `${spacing.md} ${spacing.lg}`, color: colors.textSecondary }}>
                  {entry.taskName}
                </td>
                <td
                  style={{
                    padding: `${spacing.md} ${spacing.lg}`,
                    color: colors.accentSuccess,
                    fontWeight: 600,
                  }}
                >
                  {entry.amount} ETH
                </td>
                <td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: `${getColorByStatus(entry.status)}22`,
                      color: getColorByStatus(entry.status),
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  >
                    {entry.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
