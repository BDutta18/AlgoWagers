'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

export function MagneticButton({
  children,
  onClick,
  className = '',
  disabled = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return
    const { clientX, clientY } = e
    const { height, width, left, top } = ref.current.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 }) // 20% pull strength
  }

  const reset = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onClick={onClick}
      disabled={disabled}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Target area padding to expand magnetic field beyond visible button */}
      <span className="absolute -inset-4 z-[-1]" />
      <motion.span 
        animate={{ x: position.x * 0.4, y: position.y * 0.4 }} 
        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      >
        {children}
      </motion.span>
    </motion.button>
  )
}
