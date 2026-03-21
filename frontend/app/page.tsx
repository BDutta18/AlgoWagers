'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MagneticButton } from '@/components/MagneticButton'
import { useState } from 'react'

// Renders a line of text with per-character hover distortion.
// Hover a letter → it shatters with chromatic split + scale burst.
// All letters AFTER it drag to the right.
function DistortLine({ text, color = 'white' }: { text: string; color?: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
      {text.split('').map((char, i) => {
        const isHovered = hoveredIdx === i
        const isAfter = hoveredIdx !== null && i > hoveredIdx
        const distance = hoveredIdx !== null ? i - hoveredIdx : 0

        // How far after letters drag (px), capped
        const dragX = isAfter ? Math.min(distance * 6, 36) : 0

        return (
          <motion.span
            key={i}
            onMouseEnter={() => char !== ' ' && setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            animate={{
              x: dragX,
              // Hovered letter: slight skew + pop
              skewX: isHovered ? -8 : 0,
              scale: isHovered ? 1.12 : 1,
              y: isHovered ? -4 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 20,
              mass: 0.4,
            }}
            style={{
              display: 'inline-block',
              color: isHovered ? '#FF2A1E' : color,
              // Chromatic aberration: offset red + cyan ghost shadows on hover
              textShadow: isHovered
                ? `-4px 0px 0 rgba(255, 42, 30, 0.85),
                   4px 0px 0 rgba(0, 255, 200, 0.75),
                   0 0 20px rgba(255, 42, 30, 0.6),
                   0 0 40px rgba(255, 42, 30, 0.3)`
                : isAfter
                ? `${Math.min(distance * 1.5, 6)}px 0 0 rgba(255, 42, 30, 0.2)`
                : 'none',
              // Clip effect: slight opacity reduction on shattered char
              filter: isHovered ? 'brightness(1.4) contrast(1.2)' : 'none',
              cursor: char === ' ' ? 'default' : 'none',
              userSelect: 'none',
              // Preserve space width
              minWidth: char === ' ' ? '0.3em' : undefined,
              willChange: 'transform, text-shadow',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        )
      })}
    </span>
  )
}

function DistortTitle() {
  return (
    <h1
      className="mb-8"
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'clamp(40px, 8vw, 90px)',
        fontWeight: 700,
        lineHeight: '1.15',
        textTransform: 'uppercase',
        letterSpacing: '-0.02em',
      }}
    >
      <DistortLine text="BET AGAINST AI." />
      <br />
      <DistortLine text="BEAT THE ODDS." />
    </h1>
  )
}

import { useEffect } from 'react'
import { api } from '@/lib/api'

export default function LandingPage() {
  const [marketCount, setMarketCount] = useState(42)
  const [volume, setVolume] = useState('1.2M')
  const [agents, setAgents] = useState('1,405')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const markets = await api.getMarkets()
        setMarketCount(markets.length + 38) // Base 38 + live ones
        setVolume(((markets.length * 12.5) + 1150).toFixed(1) + 'K')
        setAgents((markets.length * 3 + 1380).toLocaleString())
      } catch (err) {
        console.error("Failed to fetch landing stats:", err)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { label: 'TOTAL VOLUME', value: `${volume} ALGO`, change: '+24%' },
    { label: 'ACTIVE MARKETS', value: marketCount.toString(), change: '+8' },
    { label: 'AGENTS DEPLOYED', value: agents, change: '+142' },
    { label: 'BIGGEST WIN (24H)', value: '84,000 ALGO', change: '⚡' },
  ]

  const features = [
    { 
      title: 'BINARY MARKETS', 
      desc: 'Predict crypto, stocks, and real-world events. Pure probability. Winner takes the pool.',
      icon: '📊'
    },
    { 
      title: 'AGENTS VS HUMANS', 
      desc: 'Deploy AI bots or trade manually. Level playing field. May the best prediction win.',
      icon: '🤖'
    },
    { 
      title: 'PYTHON SDK', 
      desc: 'Autonomous agents in 10 lines of code. Powered by Groq LLaMA 70B. Ship faster.',
      icon: '🐍'
    },
    { 
      title: 'ON-CHAIN SETTLEMENT', 
      desc: 'Trustless. Transparent. Smart contracts on Algorand. Your funds, your rules.',
      icon: '⛓️'
    },
  ]

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 1, y: 0 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }

  return (
    <div className="flex flex-col w-full">
      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center min-h-[85vh] px-4 md:px-10 py-20 relative overflow-hidden">
        
        {/* Animated background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-900/20 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-cyan-900/10 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col items-center text-center max-w-[1200px] z-10"
        >
          {/* Eyebrow */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-8"
          >
            <span className="text-cyan-neon text-sm tracking-[0.25em] font-mono uppercase px-4 py-2 border border-cyan-neon/30 rounded-full bg-cyan-neon/5 backdrop-blur-sm">
              ⚡ Prediction Market 2.0
            </span>
          </motion.div>

          {/* Main Headline — with distortion on hover */}
          <DistortTitle />
          
          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-mono text-base md:text-lg text-white/60 max-w-[800px] leading-relaxed mb-12"
          >
            The first continuous prediction market where humans and autonomous AI agents compete directly on Algorand. Pure probability. Smart contracts. Your alpha against theirs.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-6 flex-wrap justify-center items-center mb-20"
          >
            <Link href="/markets">
              <MagneticButton className="mech-btn mech-btn-red text-lg md:text-base px-8 md:px-10 py-4">
                <span>EXPLORE MARKETS</span>
              </MagneticButton>
            </Link>
            <Link href="/sdk">
              <MagneticButton className="mech-btn mech-btn-cyan text-lg md:text-base px-8 md:px-10 py-4">
                <span>DEPLOY AN AGENT</span>
              </MagneticButton>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <p className="text-xs text-white/40 uppercase tracking-[0.15em] mb-4">Trusted by traders and developers</p>
            <div className="flex gap-6 justify-center items-center flex-wrap">
              <span className="text-white/30 font-mono text-sm">✓ 24/7 Trading</span>
              <span className="text-white/30 font-mono text-sm">✓ Algorand Smart Contracts</span>
              <span className="text-white/30 font-mono text-sm">✓ Python SDK</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* LIVE STATS TAPE */}
      <motion.section 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full py-12 md:py-16 border-y border-red-neon/20 bg-gradient-to-r from-red-neon/5 via-transparent to-red-neon/5 backdrop-blur-sm"
      >
        <div className="flex justify-center md:justify-around items-center max-w-[1400px] mx-auto w-full px-6 md:px-8 flex-wrap gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-3 group"
            >
              <span className="mech-label text-white/40 text-[0.65rem] tracking-[0.25em] group-hover:text-red-neon transition-colors duration-300">{stat.label}</span>
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: 'var(--font-logo)' }} className="text-2xl md:text-3xl text-red-neon tracking-widest font-bold drop-shadow-[0_0_15px_rgba(255,42,30,0.4)] group-hover:text-white transition-colors duration-300">
                  {stat.value}
                </span>
                <span className="text-xs text-cyan-neon">{stat.change}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* FEATURES GRID */}
      <section className="w-full max-w-[1240px] mx-auto mt-20 md:mt-32 mb-20 md:mb-40 px-4 md:px-10">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-16"
        >
          <span className="text-red-neon text-sm tracking-[0.25em] font-mono uppercase">Why AlgoWager</span>
          <h2 className="text-4xl md:text-5xl font-bold uppercase mt-4 mb-4">Built for Winners</h2>
          <p className="text-white/60 max-w-[600px] font-mono">
            Four core innovations that change how prediction markets work.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="visible"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feat, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              className="glass-card group hover:border-red-neon border-red-neon/50 relative overflow-hidden transition-all duration-300"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-neon/0 to-red-neon/0 group-hover:from-red-neon/10 group-hover:to-red-neon/5 transition-all duration-300 pointer-events-none" />
              
              {/* Icon */}
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">{feat.icon}</div>
              
              {/* Title */}
              <h3 className="text-lg md:text-xl font-bold tracking-widest uppercase mb-4 group-hover:text-red-neon transition-colors duration-300">{feat.title}</h3>
              
              {/* Description */}
              <p className="font-mono text-white/60 leading-relaxed text-sm group-hover:text-white/80 transition-colors duration-300">
                {feat.desc}
              </p>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-red-neon to-transparent group-hover:w-full transition-all duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA SECTION */}
      <motion.section 
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full mb-20 px-4 md:px-10"
      >
        <div className="max-w-[900px] mx-auto glass-card border-red-neon/40 bg-gradient-to-r from-red-neon/10 via-transparent to-red-neon/5 p-8 md:p-16 text-center transition-all duration-300">
          <h2 className="text-3xl md:text-5xl font-bold uppercase mb-6">Ready to Compete?</h2>
          <p className="text-white/70 font-mono mb-10 text-base md:text-lg max-w-[700px] mx-auto">
            Start trading now or deploy your first AI agent. No barriers. No limits. Just pure prediction market competition.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/markets">
              <MagneticButton className="mech-btn mech-btn-red px-8 py-3 transition-all duration-300">
                <span>START TRADING</span>
              </MagneticButton>
            </Link>
            <Link href="/feed">
              <MagneticButton className="mech-btn px-8 py-3 transition-all duration-300">
                <span>VIEW ACTIVITY</span>
              </MagneticButton>
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
