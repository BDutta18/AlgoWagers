'use client'

import { AuditEntry } from '@/lib/mockData'

interface AuditTrailPanelProps {
  entries: AuditEntry[]
}

const SERVICE_ICONS: Record<string, { icon: string; cls: string; label: string }> = {
  'Web Scraping':       { icon: '🌐', cls: 'badge-blue',   label: 'Translation' },
  'Sentiment Analysis': { icon: '📈', cls: 'badge-cyan',   label: 'Exchange Rate' },
  'Code Audit':         { icon: '📰', cls: 'badge-purple', label: 'News Feed' },
}

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  completed: { cls: 'badge-green', label: '✓ Completed' },
  pending:   { cls: 'badge-amber', label: '⟳ Pending'   },
  failed:    { cls: 'badge-red',   label: '✗ Failed'    },
}

function truncateHash(hash: string, pre = 6, post = 4): string {
  if (!hash || hash.length < pre + post + 3) return hash
  return `${hash.slice(0, pre)}…${hash.slice(-post)}`
}

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export function AuditTrailPanel({ entries }: AuditTrailPanelProps) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(4,5,10,0.5)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            On-Chain Audit Trail
          </div>
          <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>
            fetched from Algorand indexer · Pera Explorer verified
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="badge badge-blue" style={{ fontSize: '0.63rem' }}>
            <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#0070dc"/></svg>
            Algorand
          </div>
          <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '0.7rem' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>⛓️</div>
          No transactions yet. Submit a task to generate the first on-chain log.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Service</th>
                <th>USDC Paid</th>
                <th>AVAX Txn</th>
                <th>ALGO Txn</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const svc = SERVICE_ICONS[entry.taskName] || SERVICE_ICONS['Web Scraping']
                const status = STATUS_MAP[entry.status] || STATUS_MAP.completed

                return (
                  <tr key={entry.id} style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {entry.id.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${svc.cls}`} style={{ fontSize: '0.68rem' }}>
                        {svc.icon} {svc.label}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.78rem' }}>
                        {entry.amount}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`https://testnet.snowtrace.io/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link mono"
                        style={{ fontSize: '0.72rem' }}
                        title={entry.txHash}
                      >
                        {truncateHash(entry.txHash)} ↗
                      </a>
                    </td>
                    <td>
                      <a
                        href={`https://testnet.explorer.perawallet.app/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link mono"
                        style={{ fontSize: '0.72rem' }}
                        title={entry.txHash}
                      >
                        {truncateHash(entry.txHash)} ↗
                      </a>
                    </td>
                    <td>
                      <span className={`badge ${status.cls}`} style={{ fontSize: '0.65rem' }}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <span
                        className="mono"
                        style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                        title={entry.timestamp}
                      >
                        {timeAgo(entry.timestamp)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
