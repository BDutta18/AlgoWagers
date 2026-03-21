'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'

/**
 * 3D Tilt Card Component for the DeLorean Build Slots.
 * Follows the mouse movement to cast a 3D parallax effect on the slot card.
 */
export function AgentSlotCard({
  agent, num, active, onClick
}: {
  agent: { name: string, id: string, model: string }, num: string, active: boolean, onClick: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Motion values for the 3D tilt
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth the raw mouse values to give it heavy physical mass
  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  // Map the mouse position to a rotation (-10deg to 10deg)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Calculate mouse position relative to center of card (-0.5 to 0.5)
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ ease: [0.23, 1, 0.32, 1] }}
      className="relative cursor-pointer"
    >
      {/* The actual Card container */}
      <div 
        className="flex flex-col h-full bg-[#1A1C23] transition-colors duration-500 ease-out"
        style={{
          border: active ? '1px solid #FF2A1E' : '1px solid rgba(255,255,255,0.05)',
          boxShadow: active ? '0 0 30px rgba(255,42,30,0.35), inset 0 0 20px rgba(255,42,30,0.1)' : 'none',
          padding: '24px',
          minHeight: '320px',
        }}
      >
        {/* Floating elements inside the 3D card */}
        <motion.div 
          className="flex justify-between items-start mb-5"
          style={{ transform: "translateZ(30px)" }} // Pop out in 3D
        >
          <div className="flex flex-col gap-[2px]">
            <span className="font-[family-name:--font-mono] text-[0.65rem] tracking-[0.25em] uppercase text-white/40">AGENT MODEL</span>
            <span className="font-[family-name:--font-logo] text-[0.8rem] tracking-[0.2em]">{agent.model}</span>
          </div>
          <svg viewBox="0 0 10 10" width="10" height="10" className="fill-white/70">
            <rect x="0" y="0" width="4" height="4"/><rect x="6" y="6" width="4" height="4"/>
          </svg>
        </motion.div>

        {/* Massive Slot Number */}
        <motion.div 
          className="font-[family-name:--font-body] text-white/70 font-light leading-none"
          style={{ 
            fontSize: '5rem',
            transform: "translateZ(50px)", // Pop out further
            color: active ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            textShadow: active ? '0 0 20px rgba(255,255,255,0.5)' : 'none',
          }}
        >
          {num}
        </motion.div>

        {/* Bottom Status Block */}
        <motion.div 
          className="mt-auto pt-[30px]"
          style={{ transform: "translateZ(20px)" }}
        >
          <div 
            className="inline-block font-[family-name:--font-mono] text-[0.65rem] uppercase tracking-[0.15em] pb-[2px] border-b-2 mb-[6px] transition-colors duration-300"
            style={{
              borderColor: active ? '#FF2A1E' : 'rgba(255,255,255,0.4)',
              color: active ? '#FF2A1E' : 'rgba(255,255,255,0.7)'
            }}
          >
            {active ? 'SELECTED' : 'UNLISTED'}
          </div>
          <div className="font-[family-name:--font-body] text-[1.2rem] font-bold uppercase tracking-[0.05em]">
            {agent.name}
          </div>
        </motion.div>
        
        {/* Internal Glow Overlay triggered on hover using framer-motion */}
        <motion.div 
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{
            background: \`radial-gradient(circle at \${(x.get() + 0.5) * 100}% \${(y.get() + 0.5) * 100}%, rgba(255,42,30,0.1) 0%, transparent 60%)\`
          }}
        />
      </div>
    </motion.div>
  )
}
