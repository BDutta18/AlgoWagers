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

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    x.set(mouseX / width - 0.5)
    y.set(mouseY / height - 0.5)
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
      <div
        className="flex flex-col h-full bg-[#1A1C23] overflow-hidden transition-colors duration-500 ease-out"
        style={{
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: active ? '0 0 40px rgba(255,42,30,0.15), inset 0 0 20px rgba(255,42,30,0.05)' : 'none',
          padding: '24px',
          minHeight: '340px',
        }}
      >
        {/* Placeholder Dark Car Fade overlay */}
        <div className="absolute inset-0 top-[30%] bg-gradient-to-t from-black via-[#000000AA] to-transparent z-[0] pointer-events-none mix-blend-multiply" />

        {/* If Active, add a red bottom glow line */}
        {active && (
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#FF2A1E] z-[1] shadow-[0_0_15px_#FF2A1E]" />
        )}

        <motion.div
          className="flex justify-between items-start mb-4 relative z-[2]"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="flex flex-col">
            <span style={{ fontFamily: 'var(--font-logo)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>ALPHA</span>
            <span style={{ fontFamily: 'var(--font-logo)', fontSize: '0.9rem', color: '#FFF', letterSpacing: '0.15em' }}>{agent.model}</span>
          </div>
          <svg viewBox="0 0 10 10" width="12" height="12" className="fill-white/60">
            <rect x="2" y="0" width="2" height="2" /><rect x="2" y="8" width="2" height="2" /><rect x="2" y="4" width="2" height="2" />
          </svg>
        </motion.div>

        {/* Massive Ultra-Thin Slot Number */}
        <motion.div
          className="relative z-[2]"
          style={{ transform: "translateZ(50px)" }}
        >
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '6.5rem',
            fontWeight: 200,
            lineHeight: 1,
            color: active ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
            textShadow: active ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
          }}>
            {num}
          </div>

          {/* Constellation Dots */}
          <div className="flex gap-2 mt-2 ml-1">
            <div className="w-1.5 h-1.5 bg-[#FF2A1E] opacity-80 shadow-[0_0_5px_#FF2A1E]" />
            <div className="w-1 h-1 bg-[#FF2A1E] opacity-50 mt-[2px]" />
            <div className="w-1 h-1 bg-[#FFFFFF] opacity-40 mt-[2px]" />
          </div>
        </motion.div>


        <motion.div
          className="mt-auto relative z-[2] pt-8"
          style={{ transform: "translateZ(20px)" }}
        >
          <div
            className="inline-block font-[family-name:--font-mono] text-[0.6rem] uppercase tracking-[0.1em] pb-[4px] border-b border-solid mb-[8px] transition-colors duration-300"
            style={{
              borderColor: active ? '#FF2A1E' : 'rgba(255,255,255,0.4)',
              color: active ? '#FF2A1E' : 'rgba(255,255,255,0.6)'
            }}
          >
            {active ? 'SELECTED' : 'UNLISTED'}
          </div>
          <div className="font-[family-name:--font-body] text-[1.05rem] font-bold text-white uppercase tracking-[0.02em]">
            BUILD SLOT #{parseInt(num)}
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-screen z-[3]"
          style={{
            background: `radial-gradient(circle at ${(x.get() + 0.5) * 100}% ${(y.get() + 0.5) * 100}%, rgba(255,42,30,0.12) 0%, transparent 50%)`
          }}
        />
      </div>
    </motion.div>
  )
}
