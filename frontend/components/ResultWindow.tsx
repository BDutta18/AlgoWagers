'use client'

interface ResultWindowProps {
  result: {
    agentName: string
    taskName: string
    cost: string
    duration: string
  } | null
  isExecuting: boolean
}

const DEMO_RESULT_TEXT = `Based on the agent analysis: The phrase has been successfully translated to Hindi as "ब्लॉकचेन वित्त को बदल रहा है।" 
Live data retrieved: USD → INR exchange rate is ₹83.42 (as of ECB data, updated daily). Today's top tech headline: "AI agents begin conducting autonomous micro-transactions on blockchain testnets."`

export function ResultWindow({ result, isExecuting }: ResultWindowProps) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
        ...(result ? {
          borderColor: 'rgba(34, 197, 94, 0.25)',
          boxShadow: '0 0 32px rgba(34, 197, 94, 0.06)',
        } : {}),
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
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Task Result
        </div>
        {result && (
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Claude 3.5 Sonnet</span>
            <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>✓ {result.duration}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isExecuting ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            {/* Animated agent constellation */}
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.65 }}>
              <circle cx="20" cy="40" r="10" fill="rgba(59,130,246,0.2)" stroke="var(--accent-blue)" strokeWidth="1"/>
              <text x="20" y="44" textAnchor="middle" fontSize="9" fill="var(--accent-blue)">T</text>
              <circle cx="100" cy="40" r="10" fill="rgba(34,211,238,0.2)" stroke="var(--accent-cyan)" strokeWidth="1"/>
              <text x="100" y="44" textAnchor="middle" fontSize="9" fill="var(--accent-cyan)">D</text>
              <circle cx="60" cy="15" r="10" fill="rgba(168,85,247,0.2)" stroke="var(--accent-purple)" strokeWidth="1"/>
              <text x="60" y="19" textAnchor="middle" fontSize="7" fill="var(--accent-purple)">AI</text>
              <circle cx="60" cy="60" r="12" fill="rgba(34,197,94,0.15)" stroke="var(--accent-green)" strokeWidth="1.5"/>
              <text x="60" y="64" textAnchor="middle" fontSize="7" fill="var(--accent-green)">✓</text>
              <line x1="30" y1="40" x2="48" y2="60" stroke="var(--border-glow)" strokeWidth="1" strokeDasharray="3 3"/>
              <line x1="90" y1="40" x2="72" y2="60" stroke="var(--border-glow)" strokeWidth="1" strokeDasharray="3 3"/>
              <line x1="60" y1="25" x2="60" y2="48" stroke="var(--border-glow)" strokeWidth="1" strokeDasharray="3 3"/>
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
                <span className="spinner" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Agents collaborating…</span>
              </div>
              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Payments settling on Avalanche Fuji
              </div>
            </div>
          </div>
        ) : result ? (
          <>
            {/* Agent chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <div className="badge badge-blue" style={{ fontSize: '0.68rem', padding: '4px 10px' }}>
                ✅ Translator hired · 0.005 USDC · DeepL → Hindi
              </div>
              <div className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '4px 10px' }}>
                ✅ Data acquired · 0.002 USDC · ECB Rates + GNews
              </div>
            </div>

            {/* Result text */}
            <div
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '14px 16px',
                fontSize: '0.85rem',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-ui)',
                flex: 1,
              }}
            >
              {DEMO_RESULT_TEXT}
            </div>

            {/* Cost summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="badge badge-green" style={{ fontSize: '0.72rem', padding: '5px 12px' }}>
                Total: 0.007 USDC paid
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {/* Empty state illustration */}
            <svg width="100" height="70" viewBox="0 0 100 70" fill="none" style={{ opacity: 0.25 }}>
              <circle cx="15" cy="35" r="9" stroke="var(--accent-blue)" strokeWidth="1.2" strokeDasharray="2 2"/>
              <circle cx="85" cy="35" r="9" stroke="var(--accent-cyan)" strokeWidth="1.2" strokeDasharray="2 2"/>
              <circle cx="50" cy="12" r="9" stroke="var(--accent-purple)" strokeWidth="1.2" strokeDasharray="2 2"/>
              <circle cx="50" cy="55" r="11" stroke="var(--accent-green)" strokeWidth="1.5" strokeDasharray="2 2"/>
              <line x1="24" y1="35" x2="39" y2="55" stroke="var(--border-mid)" strokeWidth="1"/>
              <line x1="76" y1="35" x2="61" y2="55" stroke="var(--border-mid)" strokeWidth="1"/>
              <line x1="50" y1="21" x2="50" y2="44" stroke="var(--border-mid)" strokeWidth="1"/>
            </svg>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              Submit a task above to see the<br />autonomous agent result here.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
