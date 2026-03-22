// Animation and styling utilities
export const animationStyles = {
  fadeIn: {
    animation: 'fade-in 0.3s ease-out',
  },
  slideInLeft: {
    animation: 'slide-in-left 0.4s ease-out',
  },
  pulseGlow: {
    animation: 'pulse-glow 2s ease-in-out infinite',
  },
  glowText: {
    animation: 'glow-text 3s ease-in-out infinite',
  },
  typewriter: {
    animation: 'typewriter 0.05s steps(1) forwards',
  },
}

export const colors = {
  void: '#000000',
  voidDeep: '#0a0e27',
  surfaceDark: '#1a2555',
  surfaceDarker: '#0d1633',
  surfaceInput: '#141f42',
  borderSubtle: '#2d3a7f',
  borderPrimary: '#3d4a9f',
  accentPrimary: '#6366f1',
  accentSecondary: '#0ea5e9',
  accentSuccess: '#10b981',
  accentWarning: '#f59e0b',
  accentDanger: '#ef4444',
  textPrimary: '#f0f9ff',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  textMuted: '#64748b',
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
}

export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
}

export function getColorByStatus(
  status: 'active' | 'idle' | 'processing' | 'completed' | 'pending' | 'failed'
): string {
  const statusColors: Record<string, string> = {
    active: colors.accentSuccess,
    idle: colors.textMuted,
    processing: colors.accentPrimary,
    completed: colors.accentSuccess,
    pending: colors.accentWarning,
    failed: colors.accentDanger,
  }
  return statusColors[status] || colors.textMuted
}

export function getStatusLabel(
  status: 'active' | 'idle' | 'processing' | 'completed' | 'pending' | 'failed'
): string {
  const labels: Record<string, string> = {
    active: 'Active',
    idle: 'Idle',
    processing: 'Processing',
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
  }
  return labels[status] || status
}
