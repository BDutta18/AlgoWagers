'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Text that fragments into many small block slices on hover
 * similar to a PowerPoint slide dissolve transition, matching the
 * DeLorean "ALPHA 05" hover effect.
 */
export function GlitchDissolveText({ text, glowColor = '#FF2A1E', children }: { text?: string, glowColor?: string, children?: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false)
  
  // We'll split the text visually into a grid of small blocks.
  // When hovered, these blocks scatter, fade, and rotate out, revealing another layer.
  
  // Actually, a true slice/fragment effect is best achieved by
  // mapping the text multiple times with different clip-paths.
  const slices = 12
  
  return (
    <div 
      className="relative inline-block cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ filter: isHovered ? \`drop-shadow(0 0 40px \${glowColor})\` : 'none', transition: 'filter 0.5s' }}
    >
      {/* Base invisible text just for sizing */}
      <div className="opacity-0">{text || children}</div>

      {/* The Solid Text (fades/glitches out on hover) */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ 
          opacity: isHovered ? 0 : 1,
          scale: isHovered ? 1.05 : 1,
          filter: isHovered ? 'blur(4px)' : 'blur(0px)'
        }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{ color: glowColor }}
      >
        {text || children}
      </motion.div>

      {/* The Fragments layer (scatter in on hover) */}
      {Array.from({ length: slices }).map((_, i) => {
        // Create horizontal slice clip paths
        const heightPercent = 100 / slices
        const top = i * heightPercent
        const bottom = 100 - (i + 1) * heightPercent

        // Randomize scatter destination
        const scatterX = (Math.random() - 0.5) * 60
        const scatterY = (Math.random() - 0.5) * 40
        const rotate = (Math.random() - 0.5) * 15

        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{ 
              clipPath: \`inset(\${top}% 0 \${bottom}% 0)\`,
              color: '#FFFFFF',
              textShadow: \`0 0 20px \${glowColor}\`
            }}
            initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              x: isHovered ? scatterX : 0,
              y: isHovered ? scatterY : 0,
              rotate: isHovered ? rotate : 0,
              scale: isHovered ? 0.9 : 1,
            }}
            transition={{
              duration: 0.5,
              ease: [0.19, 1, 0.22, 1],
              delay: i * 0.015 // Stagger effect
            }}
          >
           {text || children}
          </motion.div>
        )
      })}
    </div>
  )
}
