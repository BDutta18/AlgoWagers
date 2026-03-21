'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Step {
  title: string
  desc: string
}

interface HowToBannerProps {
  title: string
  steps: Step[]
}

export function HowToBanner({ title, steps }: HowToBannerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="px-6 md:px-10 mb-8">
      <div className={`glass-card border-cyan-neon/30 overflow-hidden transition-all duration-500 ${isOpen ? 'p-8' : 'p-4 flex items-center justify-between'}`}>
        {!isOpen ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-cyan-neon/20 flex items-center justify-center border border-cyan-neon/40 animate-pulse">
                <span className="text-cyan-neon text-xs font-bold">?</span>
              </div>
              <p className="font-mono text-xs tracking-widest text-white/60 uppercase">
                New here? <span className="text-cyan-neon font-bold">Learn how to interact</span> with the neural marketplace.
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(true)}
              className="text-[10px] font-mono text-cyan-neon border border-cyan-neon/30 px-3 py-1 rounded hover:bg-cyan-neon/10 transition-all uppercase tracking-widest"
            >
              Initialize Guide
            </button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
              <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-cyan-neon">{title} GUIDE</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="relative pl-8">
                  <div className="absolute left-0 top-0 text-3xl font-bold text-white/5 font-logo leading-none">{i + 1}</div>
                  <h3 className="font-bold text-red-neon text-sm uppercase tracking-widest mb-2">{step.title}</h3>
                  <p className="text-xs text-white/60 font-mono leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="mech-btn mech-btn-cyan text-[10px] px-6 py-2"
              >
                <span>UNDERSTOOD</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
