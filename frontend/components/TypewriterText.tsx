'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * Renders text character-by-character to simulate an industrial
 * terminal output or "Matrix" style data stream.
 */
export function TypewriterText({ text, speed = 20 }: { text: string, speed?: number }) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let index = 0
    let isMounted = true

    // Clear prev state if text changes
    setDisplayedText('')

    const interval = setInterval(() => {
      if (!isMounted) return
      setDisplayedText(text.substring(0, index + 1))
      index++
      if (index >= text.length) clearInterval(interval)
    }, speed)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [text, speed])

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="inline-block whitespace-pre-wrap"
    >
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
        className="inline-block w-2 h-4 bg-white/50 ml-1 translate-y-[2px]"
      >
        _
      </motion.span>
    </motion.span>
  )
}
