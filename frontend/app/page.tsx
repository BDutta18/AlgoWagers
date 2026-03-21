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

export default function Home() {
  const [selectedAgentId] = useState<string>(MOCK_AGENTS[0].id)
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [isDesktop, setIsDesktop] = useState(true)

  const { events, isRunning, togglePlayback } = useTerminalEvents(true)
  const { isExecuting, lastResult, executeTask } = useTaskExecution()

  useEffect(() => {
    const initialAudits = Array.from({ length: 8 }, (_, i) => generateAuditEntry(i))
    setAuditEntries(initialAudits)
  }, [])

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setAuditEntries(prev => {
        const newEntry = generateAuditEntry(prev.length)
        return [newEntry, ...prev].slice(0, 12)
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Fixed Top Nav */}
      <TopNavBar />

      {/* Body — sits between TopNav (60px) and BottomBar (34px) */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          marginTop: 60,
          marginBottom: 34,
          overflow: 'hidden',
          height: 'calc(100vh - 60px - 34px)',
        }}
      >
        {/* Left Sidebar */}
        {isDesktop && (
          <LeftSidebar
            agents={MOCK_AGENTS}
            selectedAgentId={selectedAgentId}
          />
        )}

        {/* Center Content */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: isDesktop ? '1fr 300px' : '1fr',
            gap: 0,
          }}
        >
          {/* Main scrollable column */}
          <div
            style={{
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              borderRight: '1px solid var(--border-subtle)',
            }}
          >
            <div className="fade-in-up" style={{ animationDelay: '0.05s' }}>
              <TaskCommandCenter
                tasks={MOCK_TASKS}
                onExecute={executeTask}
                isExecuting={isExecuting}
              />
            </div>

            <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
              <ResultWindow
                result={lastResult}
                isExecuting={isExecuting}
              />
            </div>

            <div className="fade-in-up" style={{ animationDelay: '0.15s' }}>
              <AuditTrailPanel entries={auditEntries} />
            </div>
          </div>

          {/* Right Panel — Terminal */}
          {isDesktop && (
            <div
              className="fade-in-up"
              style={{
                padding: '16px 14px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animationDelay: '0.08s',
              }}
            >
              <RightPanel
                events={events}
                isRunning={isRunning}
                onTogglePlayback={togglePlayback}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <BottomStatusBar />
    </div>
  )
}
