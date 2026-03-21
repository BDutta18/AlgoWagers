// Mock data generators for demo
export interface Agent {
  id: string
  name: string
  model: string
  status: 'active' | 'idle' | 'processing'
  hourlyRate: number
}

export interface Task {
  id: string
  name: string
  description: string
  priority: 'low' | 'medium' | 'high'
}

export interface ExecutionResult {
  agentId: string
  agentName: string
  taskId: string
  result: string
  cost: number
  duration: number
  timestamp: string
}

export interface TerminalEvent {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'event'
  message: string
  timestamp: string
  details?: string
}

export interface AuditEntry {
  id: string
  txHash: string
  agentName: string
  taskName: string
  amount: string
  status: 'completed' | 'pending' | 'failed'
  timestamp: string
}

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-001',
    name: 'DataExtract Pro',
    model: 'claude-opus',
    status: 'active',
    hourlyRate: 0.050,
  },
  {
    id: 'agent-002',
    name: 'SentimentAnalyzer',
    model: 'gpt-4-turbo',
    status: 'idle',
    hourlyRate: 0.035,
  },
  {
    id: 'agent-003',
    name: 'CodeReviewer',
    model: 'claude-3-sonnet',
    status: 'active',
    hourlyRate: 0.075,
  },
]

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-001',
    name: 'Web Scraping',
    description: 'Extract structured data from website',
    priority: 'high',
  },
  {
    id: 'task-002',
    name: 'Sentiment Analysis',
    description: 'Analyze social media sentiment',
    priority: 'medium',
  },
  {
    id: 'task-003',
    name: 'Code Audit',
    description: 'Review smart contract security',
    priority: 'high',
  },
]

export function generateTerminalEvent(
  index: number,
  _agentIds: string[]
): TerminalEvent {
  const eventTypes = ['info', 'success', 'payment', 'event'] as const
  const type = eventTypes[index % eventTypes.length]
  const timestamp = new Date(Date.now() - (5 - index) * 60000).toISOString()

  const messages: Record<string, string[]> = {
    info: [
      '[INIT] AgentPay network initialized...',
      '[SYNC] Blockchain state synced with 847 validators',
      '[LOAD] Agent registry fetched: 3 active agents found',
      '[CONFIG] Payment channel opened with 0.5 ETH escrow',
    ],
    success: [
      '[SUCCESS] DataExtract Pro completed task in 2.3s',
      '[EXEC] Task 0x3a2f executed successfully',
      '[VERIFY] Merkle proof validated on-chain',
      '[SETTLE] Payment of 0.0047 ETH processed',
    ],
    payment: [
      '[PAYMENT] Transferring 0.0032 ETH to agent-001',
      '[ATOMIC] Atomic swap executed: USDC → ETH',
      '[GAS] Transaction gas: 42,000 gwei',
      '[CONFIRM] 12 block confirmations achieved',
    ],
    event: [
      '[EVENT] New agent registered: 0xaf2D...',
      '[MONITOR] Network latency: 145ms',
      '[UPDATE] Agent performance: +2.3% efficiency',
      '[ALERT] Coordinator checksum verified',
    ],
  }

  const msg = messages[type][index % messages[type].length]

  return {
    id: `event-${index}`,
    type,
    message: msg,
    timestamp,
    details: `Block height: ${8342000 + index}`,
  }
}

export function generateAuditEntry(index: number): AuditEntry {
  const statuses = ['completed', 'pending', 'completed'] as const
  const status = statuses[index % statuses.length]
  const timestamp = new Date(Date.now() - (10 - index) * 2 * 60000).toISOString()

  const txHashes = [
    '0x7a2f8c9d3e1b5a6f9c2d8e1a3f7b9c5e2a8d1f3b7c9e2a5f8b1c3d6e9f2a4',
    '0x5e9c2b1a7f3d8c6a2b5e9f1d3a8c7b2e5a9f1c4d7e2a9b5c1f4d7a2e5b8c9',
    '0x2a1c9b8f5e3d7a6c1b4e9f2d8a3c7b5e1f4a8d2c6b9e3a7f1c5d8b2e6a9c3',
    '0x8d3f2a7c1b9e6d5a2c8f1b4e7a3f9c2d5e8b1a4c7d2f9b5e1a6c3f8d2b7e4',
    '0x1b7e5c3a9d2f6b8e1a4c7f2d5b9e3a6c1f8d2b5a7e9c3f6d1a4b8c2e5f7a9',
  ]

  return {
    id: `audit-${index}`,
    txHash: txHashes[index % txHashes.length],
    agentName: MOCK_AGENTS[index % MOCK_AGENTS.length].name,
    taskName: MOCK_TASKS[index % MOCK_TASKS.length].name,
    amount: (Math.random() * 0.01 + 0.001).toFixed(4),
    status,
    timestamp,
  }
}

export function getRandomAgent(): Agent {
  return MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)]
}

export function getRandomTask(): Task {
  return MOCK_TASKS[Math.floor(Math.random() * MOCK_TASKS.length)]
}
