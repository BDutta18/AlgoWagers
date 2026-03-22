'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

/**
 * Awwwards-style Custom Magnetic Cursor
 * Hides the default cursor and replaces it with a neon red dot that
 * expands into a hollow magnetic ring when hovering over interactables.
 */
export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  // Spring physics for smooth trailing
  const springX = useSpring(cursorX, { stiffness: 500, damping: 28 })
  const springY = useSpring(cursorY, { stiffness: 500, damping: 28 })

  useEffect(() => {
    // Hide default cursor across the app
    document.body.style.cursor = 'none'
    
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16) // center the 32px cursor
      cursorY.set(e.clientY - 16)
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if we are hovering a clickable element
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        window.getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      document.body.style.cursor = 'auto'
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [cursorX, cursorY])

  return (
    <>
      {/* The main trailing ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] mix-blend-screen"
        style={{
          x: springX,
          y: springY,
          border: isHovering ? '2px solid #FF2A1E' : '0px solid transparent',
          backgroundColor: isHovering ? 'transparent' : '#FF2A1E',
          boxShadow: '0 0 15px rgba(255,42,30,0.5)',
        }}
        animate={{
          scale: isHovering ? 1.5 : 0.3, // Expands on hover
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      
      {/* The exact center dot (always follows perfectly) */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-white pointer-events-none z-[10000] mix-blend-screen"
        style={{
          x: useTransform(cursorX, x => x + 12), // offset to align with center of 32px ring
          y: useTransform(cursorY, y => y + 12),
          opacity: isHovering ? 0 : 1
        }}
      />
    </>
  )
}
