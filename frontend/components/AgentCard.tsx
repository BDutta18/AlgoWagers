'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Agent } from '@/lib/mockData'

export function AgentCard({
  agent, active, onClick
}: {
  agent: Agent, active: boolean, onClick: () => void
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
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
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
        <div className="absolute inset-0 top-[30%] bg-gradient-to-t from-black via-[#000000AA] to-transparent z-[0] pointer-events-none mix-blend-multiply" />
        
        {active && <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#FF2A1E] z-[1] shadow-[0_0_15px_#FF2A1E]" />}

        <motion.div 
          className="flex justify-between items-start mb-4 relative z-[2]"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="flex flex-col">
            <span style={{ fontFamily: 'var(--font-logo)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>CREATOR</span>
            <span style={{ fontFamily: 'var(--font-logo)', fontSize: '0.75rem', color: '#FFF', letterSpacing: '0.15em' }}>{agent.creator}</span>
          </div>
          <svg viewBox="0 0 10 10" width="12" height="12" className="fill-white/60">
            <rect x="2" y="0" width="2" height="2"/><rect x="2" y="8" width="2" height="2"/><rect x="2" y="4" width="2" height="2"/>
          </svg>
        </motion.div>

        <motion.div className="relative z-[2]" style={{ transform: "translateZ(50px)" }}>
           <div style={{ 
            fontFamily: 'var(--font-body)',
            fontSize: '5.5rem',
            fontWeight: 200,
            lineHeight: 1,
            color: active ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
            textShadow: active ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
          }}>
            {agent.winRate}<span style={{fontSize: '2rem'}}>%</span>
          </div>
          <div className="flex gap-2 mt-2 ml-1">
            <div className="w-1.5 h-1.5 bg-[#FF2A1E] opacity-80 shadow-[0_0_5px_#FF2A1E]" />
            <div className="w-1 h-1 bg-[#FFFFFF] opacity-40 mt-[2px]" />
          </div>
        </motion.div>

        <motion.div className="mt-auto relative z-[2] pt-8" style={{ transform: "translateZ(20px)" }}>
          <div 
            className="inline-block font-[family-name:--font-mono] text-[0.6rem] uppercase tracking-[0.1em] pb-[4px] border-b border-solid mb-[8px] transition-colors duration-300"
            style={{
              borderColor: active ? '#FF2A1E' : 'rgba(255,255,255,0.4)',
              color: active ? '#FF2A1E' : 'rgba(255,255,255,0.6)'
            }}
          >
            PROFIT: {agent.profitALGO.toLocaleString()} ALGO | BETS: {agent.betsPlaced}
          </div>
          <div className="font-[family-name:--font-body] text-[1.1rem] font-bold text-white uppercase tracking-[0.05em] leading-tight">
            {agent.name}
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            background: `radial-gradient(circle at ${(x.get() + 0.5) * 100}% ${(y.get() + 0.5) * 100}%, rgba(255,42,30,0.12) 0%, transparent 50%)`,
            willChange: 'transform, opacity'
          }}
        />
      </div>
    </motion.div>
  )
}
