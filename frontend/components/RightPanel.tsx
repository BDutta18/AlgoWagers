'use client'

import { TerminalEvent } from '@/lib/mockData'
import { colors, spacing } from '@/lib/animations'

interface RightPanelProps {
  events: TerminalEvent[]
  isRunning: boolean
  onTogglePlayback: () => void
}

function getEventColor(type: TerminalEvent['type']): string {
  switch (type) {
    case 'success':
      return colors.accentSuccess
    case 'error':
      return colors.accentDanger
    case 'warning':
      return colors.accentWarning
    case 'payment':
      return colors.accentSecondary
    case 'event':
      return colors.accentPrimary
    default:
      return colors.textSecondary
  }
}

export function RightPanel({ events, isRunning, onTogglePlayback }: RightPanelProps) {
  return (
    <div
      style={{
        backgroundColor: colors.surfaceDark,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${spacing.md} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.borderSubtle}`,
          backgroundColor: colors.surfaceInput,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600 }}>
          LIVE EVENT STREAM ({events.length})
        </div>
        <button
          onClick={onTogglePlayback}
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: isRunning ? colors.accentDanger : colors.accentSuccess,
            color: colors.void,
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isRunning ? 'PAUSE' : 'PLAY'}
        </button>
      </div>

      {/* Terminal Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing.lg,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
          lineHeight: 1.8,
        }}
      >
        {events.length === 0 ? (
          <div style={{ color: colors.textMuted }}>
            Waiting for events...
          </div>
        ) : (
          <div>
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  marginBottom: spacing.md,
                  color: getEventColor(event.type),
                  animation: 'fade-in 0.3s ease-out',
                }}
              >
                <div>
                  <span style={{ color: colors.textMuted }}>
                    [{new Date(event.timestamp).toLocaleTimeString()}]
                  </span>
                  {' '}
                  <span>{event.message}</span>
                </div>
                {event.details && (
                  <div
                    style={{
                      marginTop: spacing.xs,
                      paddingLeft: spacing.md,
                      color: colors.textMuted,
                      fontSize: '0.7rem',
                    }}
                  >
                    {event.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: `${spacing.md} ${spacing.lg}`,
          borderTop: `1px solid ${colors.borderSubtle}`,
          backgroundColor: colors.surfaceInput,
          fontSize: '0.7rem',
          color: colors.textMuted,
        }}
      >
        {isRunning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <div
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: colors.accentSuccess,
                animation: 'pulse-glow 1.5s ease-in-out infinite',
              }}
            />
            Stream active
          </div>
        )}
      </div>
    </div>
  )
}
