'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Sweeping wavy neon lines in the background, matching the
 * DeLorean reference site's atmospheric, dark industrial vibe.
 */
export function AmbientWavyBackground() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="fixed inset-0 bg-[#0A0B0E] -z-10" />

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0A0B0E]">
      
      {/* Deep baseline shadow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_30%,#000000_100%)] z-[1]" />

      {/* SVG Neon Waves Container */}
      <div className="absolute w-[200vw] h-[200vh] -top-[50%] -left-[50%] opacity-40 mix-blend-screen"
        style={{ transform: 'rotate(-15deg)' }}
      >
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="15" result="blur1" />
              <feGaussianBlur stdDeviation="30" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="20%" stopColor="#FF2A1E" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="80%" stopColor="#9E150F" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Core sweeping wavy lines */}
          {[0, 1, 2, 3].map((i) => (
            <motion.path
              key={i}
              d={\`M 0,\${400 + i * 50} Q 250,\${300 + i * 100} 500,\${500 + i * 30} T 1000,\${400 + i * 80}\`}
              fill="none"
              stroke="url(#line-grad)"
              strokeWidth={i === 1 ? 6 : 3}
              filter="url(#neon-glow)"
              initial={{ pathLength: 0, opacity: 0, x: -500 }}
              animate={{
                pathLength: [0, 1, 1],
                opacity: [0, 0.8, 0],
                x: [0, 200, 400]
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "linear",
                delay: i * 2,
              }}
            />
          ))}
        </svg>
      </div>
      
      {/* Noise Grain Overlay over everything */}
      <div 
        className="absolute inset-0 z-[2] opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: \`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")\`
        }}
      />
    </div>
  )
}
