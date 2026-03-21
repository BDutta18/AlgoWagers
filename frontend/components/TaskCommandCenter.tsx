'use client'

import { useState } from 'react'
import { Task } from '@/lib/mockData'
import { colors, spacing } from '@/lib/animations'

interface TaskCommandCenterProps {
  tasks: Task[]
  onExecute: (taskId: string) => void
  isExecuting: boolean
}

export function TaskCommandCenter({
  tasks,
  onExecute,
  isExecuting,
}: TaskCommandCenterProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '')
  const [commandInput, setCommandInput] = useState('')

  const handleExecute = () => {
    if (selectedTaskId && !isExecuting) {
      onExecute(selectedTaskId)
      setCommandInput('> Executing task...')
    }
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  return (
    <div
      style={{
        backgroundColor: colors.surfaceDark,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '8px',
        padding: spacing.lg,
      }}
    >
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: spacing.sm, fontWeight: 600 }}>
          TASK SELECTION
        </div>
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor:
                  selectedTaskId === task.id ? colors.accentPrimary : colors.surfaceInput,
                color:
                  selectedTaskId === task.id ? colors.void : colors.textSecondary,
                border: `1px solid ${selectedTaskId === task.id ? colors.accentPrimary : colors.borderSubtle}`,
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {task.name}
            </button>
          ))}
        </div>
      </div>

      {selectedTask && (
        <div style={{ marginBottom: spacing.lg }}>
          <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: spacing.sm }}>
            TASK DETAILS
          </div>
          <div
            style={{
              backgroundColor: colors.surfaceInput,
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: '6px',
              padding: spacing.md,
              fontSize: '0.75rem',
              color: colors.textSecondary,
              lineHeight: 1.6,
            }}
          >
            <div style={{ marginBottom: spacing.sm }}>
              <span style={{ color: colors.textMuted }}>Name:</span> {selectedTask.name}
            </div>
            <div style={{ marginBottom: spacing.sm }}>
              <span style={{ color: colors.textMuted }}>Description:</span> {selectedTask.description}
            </div>
            <div>
              <span style={{ color: colors.textMuted }}>Priority:</span>{' '}
              <span
                style={{
                  color:
                    selectedTask.priority === 'high'
                      ? colors.accentDanger
                      : selectedTask.priority === 'medium'
                        ? colors.accentWarning
                        : colors.accentSuccess,
                }}
              >
                {selectedTask.priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: spacing.sm, fontWeight: 600 }}>
          COMMAND INPUT
        </div>
        <input
          type="text"
          placeholder="Enter command or press Execute..."
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          style={{
            width: '100%',
            padding: spacing.md,
            backgroundColor: colors.surfaceInput,
            border: `1px solid ${colors.borderSubtle}`,
            borderRadius: '6px',
            color: colors.textPrimary,
            fontSize: '0.875rem',
            fontFamily: 'JetBrains Mono, monospace',
            marginBottom: spacing.md,
          }}
        />
      </div>

      <button
        onClick={handleExecute}
        disabled={isExecuting}
        style={{
          width: '100%',
          padding: `${spacing.md} ${spacing.lg}`,
          backgroundColor: isExecuting ? colors.textMuted : colors.accentPrimary,
          color: colors.void,
          border: 'none',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: isExecuting ? 'not-allowed' : 'pointer',
          opacity: isExecuting ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {isExecuting ? 'EXECUTING...' : 'EXECUTE TASK'}
      </button>
    </div>
  )
}
