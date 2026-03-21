'use client'

import { useState, useEffect } from 'react'
import { TopNavBar } from '@/components/TopNavBar'
import { LeftSidebar } from '@/components/LeftSidebar'
import { BottomStatusBar } from '@/components/BottomStatusBar'
import { TaskCommandCenter } from '@/components/TaskCommandCenter'
import { ResultWindow } from '@/components/ResultWindow'
import { AuditTrailPanel } from '@/components/AuditTrailPanel'
import { RightPanel } from '@/components/RightPanel'
import { useTerminalEvents, useTaskExecution } from '@/hooks/useAgentPay'
import {
  MOCK_AGENTS,
  MOCK_TASKS,
  generateAuditEntry,
  AuditEntry,
} from '@/lib/mockData'
import { colors, spacing } from '@/lib/animations'

export default function Home() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(MOCK_AGENTS[0].id)
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDesktop, setIsDesktop] = useState(true)

  const { events, isRunning, togglePlayback, clearEvents } = useTerminalEvents(true)
  const { isExecuting, lastResult, executeTask, reset } = useTaskExecution()

  // Initialize audit entries
  useEffect(() => {
    const initialAudits = Array.from({ length: 8 }, (_, i) =>
      generateAuditEntry(i)
    )
    setAuditEntries(initialAudits)
  }, [])

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Simulate periodic audit updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAuditEntries((prev) => {
        const newEntry = generateAuditEntry(prev.length)
        return [newEntry, ...prev].slice(0, 10)
      })
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const handleTaskExecute = async (taskId: string) => {
    await executeTask()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: colors.void,
        color: colors.textPrimary,
        overflow: 'hidden',
      }}
    >
      {/* Top Navigation */}
      <TopNavBar />

      {/* Main Content Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop && sidebarOpen ? '280px 1fr' : '1fr',
          gridTemplateRows: '1fr auto',
          flex: 1,
          overflow: 'hidden',
          transition: 'grid-template-columns 0.3s ease',
        }}
      >
        {/* Left Sidebar - Desktop Only */}
        {isDesktop && sidebarOpen && (
          <LeftSidebar
            agents={MOCK_AGENTS}
            selectedAgentId={selectedAgentId}
          />
        )}

        {/* Center Content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '1fr 320px' : '1fr',
            gridTemplateRows: isDesktop ? '1fr auto' : 'auto auto auto',
            gap: spacing.lg,
            padding: spacing.lg,
            overflowY: 'auto',
          }}
        >
          {/* Main Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            {/* Task Command Center */}
            <TaskCommandCenter
              tasks={MOCK_TASKS}
              onExecute={handleTaskExecute}
              isExecuting={isExecuting}
            />

            {/* Audit Trail */}
            <AuditTrailPanel entries={auditEntries} />
          </div>

          {/* Right Panel - Terminal */}
          <div
            style={{
              gridColumn: isDesktop ? '2' : '1',
              gridRow: isDesktop ? '1 / 3' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: isDesktop ? '400px' : '300px',
            }}
          >
            <RightPanel
              events={events}
              isRunning={isRunning}
              onTogglePlayback={togglePlayback}
            />
          </div>

          {/* Result Window */}
          {isDesktop && (
            <ResultWindow
              result={lastResult}
              isExecuting={isExecuting}
            />
          )}
        </div>

        {/* Result Window - Mobile */}
        {!isDesktop && (
          <div
            style={{
              gridColumn: '1',
              padding: spacing.lg,
              borderTop: `1px solid ${colors.borderSubtle}`,
            }}
          >
            <ResultWindow
              result={lastResult}
              isExecuting={isExecuting}
            />
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <BottomStatusBar />
    </div>
  )
}
