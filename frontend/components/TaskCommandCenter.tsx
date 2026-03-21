'use client'

import { useState } from 'react'
import { Task } from '@/lib/mockData'

interface TaskCommandCenterProps {
  tasks: Task[]
  onExecute: (taskId: string) => void
  isExecuting: boolean
}

export function TaskCommandCenter({ tasks, onExecute, isExecuting }: TaskCommandCenterProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '')
  const [taskText, setTaskText] = useState('')
  const [contentText, setContentText] = useState('')
  const [activeToggles, setActiveToggles] = useState({ translation: true, rates: true, news: false })

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  const handleExecute = () => {
    if (!isExecuting && selectedTaskId) {
      onExecute(selectedTaskId)
    }
  }

  const priorityColor =
    selectedTask?.priority === 'high' ? 'var(--accent-red)' :
    selectedTask?.priority === 'medium' ? 'var(--accent-amber)' :
    'var(--accent-green)'

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
        ...(isExecuting ? {
          borderColor: 'rgba(59, 130, 246, 0.35)',
          boxShadow: '0 0 40px rgba(59,130,246,0.12)',
        } : {}),
      }}
    >
      {/* Animated top-border gradient bar */}
      <div
        style={{
          height: 2,
          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple), var(--accent-cyan))',
          backgroundSize: '200% 100%',
          animation: isExecuting ? 'gradient-logo 1.5s linear infinite' : 'none',
          opacity: isExecuting ? 1 : 0.4,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Loading progress bar */}
      {isExecuting && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: '100%' }} />
        </div>
      )}

      <div style={{ padding: '18px 20px 20px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Task Orchestrator
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Autonomous multi-agent execution engine
            </div>
          </div>
          <div className="badge badge-purple">
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <circle cx="4.5" cy="4.5" r="4.5" fill="var(--accent-purple)" opacity="0.4"/>
              <circle cx="4.5" cy="4.5" r="2" fill="var(--accent-purple)"/>
            </svg>
            Claude 3.5 Sonnet
          </div>
        </div>

        {/* Task selector tabs */}
        <div style={{ marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Select Task Type</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tasks.map((task) => {
              const isActive = selectedTaskId === task.id
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{
                    padding: '7px 14px',
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    border: `1px solid ${isActive ? 'rgba(59,130,246,0.4)' : 'var(--border-subtle)'}`,
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    fontFamily: 'var(--font-ui)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {task.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Task details strip */}
        {selectedTask && (
          <div
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flex: 1 }}>
              {selectedTask.description}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: priorityColor,
                border: `1px solid ${priorityColor}`,
                borderRadius: 4,
                padding: '2px 7px',
                flexShrink: 0,
              }}
            >
              {selectedTask.priority.toUpperCase()}
            </span>
          </div>
        )}

        {/* Toggle pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {([ 
            { key: 'translation', label: '🌐 Translation', cls: 'badge-blue' },
            { key: 'rates',       label: '📈 Live Rates',  cls: 'badge-cyan' },
            { key: 'news',        label: '📰 News Feed',   cls: 'badge-purple' },
          ] as { key: keyof typeof activeToggles; label: string; cls: string }[]).map(({ key, label, cls }) => (
            <button
              key={key}
              onClick={() => setActiveToggles(prev => ({ ...prev, [key]: !prev[key] }))}
              className={`badge ${activeToggles[key] ? cls : ''}`}
              style={{
                cursor: 'pointer',
                background: activeToggles[key] ? undefined : 'rgba(255,255,255,0.03)',
                borderColor: activeToggles[key] ? undefined : 'var(--border-subtle)',
                color: activeToggles[key] ? undefined : 'var(--text-muted)',
                padding: '5px 12px',
                fontSize: '0.73rem',
                transition: 'all 0.18s ease',
                border: '1px solid',
                borderRadius: 100,
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Task instructions input */}
        <input
          type="text"
          placeholder="e.g. Translate this paragraph to Hindi and include today's USD to INR rate"
          value={taskText}
          onChange={e => setTaskText(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        {/* Content textarea */}
        <textarea
          placeholder="Paste the paragraph or article text here..."
          value={contentText}
          onChange={e => setContentText(e.target.value)}
          rows={4}
          style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
        />

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-blue">Translation: 0.005 USDC</span>
            <span className="badge badge-cyan">Data: 0.002 USDC</span>
          </div>

          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="btn btn-primary"
            style={{ minWidth: 148, fontSize: '0.8rem' }}
          >
            {isExecuting ? (
              <>
                <span className="spinner" />
                Agents Working…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <polygon points="2,1 12,6.5 2,12" fill="white" opacity="0.9"/>
                </svg>
                Execute Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
