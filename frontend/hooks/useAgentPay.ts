'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TerminalEvent,
  generateTerminalEvent,
  MOCK_AGENTS,
} from '@/lib/mockData'

export function useTerminalEvents(autoPlay: boolean = true) {
  const [events, setEvents] = useState<TerminalEvent[]>([])
  const [isRunning, setIsRunning] = useState(autoPlay)

  useEffect(() => {
    // Initialize with first 4 events
    const initialEvents = Array.from({ length: 4 }, (_, i) =>
      generateTerminalEvent(i, MOCK_AGENTS.map((a) => a.id))
    )
    setEvents(initialEvents)
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setEvents((prev) => {
        const newEvent = generateTerminalEvent(
          prev.length,
          MOCK_AGENTS.map((a) => a.id)
        )
        // Keep only last 20 events
        const updated = [newEvent, ...prev].slice(0, 20)
        return updated
      })
    }, 2500) // New event every 2.5 seconds

    return () => clearInterval(interval)
  }, [isRunning])

  const togglePlayback = useCallback(() => {
    setIsRunning((prev) => !prev)
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return { events, isRunning, togglePlayback, clearEvents }
}

export function useTaskExecution() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [lastResult, setLastResult] = useState<{
    agentName: string
    taskName: string
    cost: string
    duration: string
  } | null>(null)

  const executeTask = useCallback(async () => {
    setIsExecuting(true)

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

    const agent = MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)]
    const taskNames = [
      'Web Data Extraction',
      'Sentiment Analysis',
      'Code Review',
      'API Integration',
      'Document Processing',
    ]
    const taskName = taskNames[Math.floor(Math.random() * taskNames.length)]
    const cost = (Math.random() * 0.01 + 0.001).toFixed(4)
    const duration = Math.floor(Math.random() * 5000 + 1000)

    setLastResult({
      agentName: agent.name,
      taskName,
      cost,
      duration: `${(duration / 1000).toFixed(2)}s`,
    })

    setIsExecuting(false)
  }, [])

  const reset = useCallback(() => {
    setLastResult(null)
  }, [])

  return {
    isExecuting,
    lastResult,
    executeTask,
    reset,
  }
}
