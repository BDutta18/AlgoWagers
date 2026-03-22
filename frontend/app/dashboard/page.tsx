'use client'

import { motion } from 'framer-motion'
import { GlitchDissolveText } from '@/components/GlitchDissolveText'
import { MagneticButton } from '@/components/MagneticButton'
import { useState } from 'react'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'HISTORY' | 'PERFORMANCE'>('PORTFOLIO')

  const stats = [
    { label: 'AVAILABLE BALANCE', value: '4,520.00', unit: 'ALGO', color: 'text-white', accentColor: 'text-red-neon' },
    { label: 'ACTIVE STAKES', value: '1,200.00', unit: 'ALGO', color: 'text-white', accentColor: 'text-cyan-neon' },
    { label: 'NET PROFIT (LIFETIME)', value: '+850.00', unit: 'ALGO', color: 'text-cyan-neon', accentColor: 'text-white', trend: '↑' },
  ]

  const positions = [
    { market: 'BTC > $100k', position: 'YES', stake: '500', prob: '54%', payout: '925', roi: '+85%' },
    { market: 'TSLA Open Higher', position: 'NO', stake: '700', prob: '88%', payout: '795', roi: '+14%' },
  ]

  const history = [
    { market: 'ETH > $3,000', position: 'YES', result: 'WON', payout: '850', date: '2 days ago' },
    { market: 'NVDA Stock Rally', position: 'NO', result: 'LOST', payout: '-500', date: '5 days ago' },
  ]

  return (
    <div className="min-h-screen py-16 px-4 md:px-10">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <span className="text-cyan-neon text-sm tracking-[0.25em] font-mono uppercase">Your Account</span>
          <div className="flex items-center gap-4 mt-4">
            <h1 className="text-5xl md:text-6xl font-bold uppercase">USER DASHBOARD</h1>
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-neon/30 to-cyan-neon/30 border border-red-neon/40 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02, y: -4 }}
              className="glass-card border-white/20 hover:border-red-neon/50 group"
            >
              <p className="text-xs font-mono text-white/60 tracking-widest mb-4">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl md:text-5xl font-bold ${stat.color}`}>
                  {stat.trend && <span className="mr-2">{stat.trend}</span>}
                  {stat.value}
                </span>
                <span className={`text-lg md:text-xl font-bold ${stat.accentColor}`}>{stat.unit}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-6 mb-8 border-b border-white/10 flex-wrap"
        >
          {['PORTFOLIO', 'HISTORY', 'PERFORMANCE'].map((tab) => (
            <motion.button 
              key={tab}
              whileHover={{ scale: 1.05 }}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 font-bold tracking-widest uppercase text-sm transition-all duration-300 border-b-2 ${
                activeTab === tab 
                  ? 'text-red-neon border-b-red-neon' 
                  : 'text-white/50 border-b-transparent hover:text-white'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card border-white/20"
        >
          {activeTab === 'PORTFOLIO' && (
            <div className="p-6 md:p-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm md:text-base">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-4 text-white/60 font-mono text-xs uppercase tracking-widest">MARKET</th>
                      <th className="pb-4 text-white/60 font-mono text-xs uppercase tracking-widest">POSITION</th>
                      <th className="pb-4 text-white/60 font-mono text-xs uppercase tracking-widest">STAKE</th>
                      <th className="pb-4 text-white/60 font-mono text-xs uppercase tracking-widest">PROBABILITY</th>
                      <th className="pb-4 text-white/60 font-mono text-xs uppercase tracking-widest text-right">ROI</th>
                      <th className="pb-4 text-white/60 font-mono text-xs uppercase tracking-widest text-right">PAYOUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, i) => (
                      <motion.tr 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-6 text-white font-bold">{pos.market}</td>
                        <td className="py-6">
                          <span className={`px-3 py-1 rounded-md font-bold text-sm ${
                            pos.position === 'YES' 
                              ? 'bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30' 
                              : 'bg-red-neon/15 text-red-neon border border-red-neon/30'
                          }`}>
                            {pos.position}
                          </span>
                        </td>
                        <td className="py-6 font-mono">{pos.stake} ALGO</td>
                        <td className="py-6 font-mono">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-neon to-cyan-neon rounded-full"
                                style={{ width: pos.prob }}
                              />
                            </div>
                            <span className="text-white/70">{pos.prob}</span>
                          </div>
                        </td>
                        <td className="py-6 text-right font-bold text-cyan-neon">{pos.roi}</td>
                        <td className="py-6 text-right font-bold text-red-neon">{pos.payout} ALGO</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-10 pt-8 border-t border-white/10 flex gap-4"
              >
                <MagneticButton className="mech-btn mech-btn-red">
                  <span>CLOSE ALL POSITIONS</span>
                </MagneticButton>
                <MagneticButton className="mech-btn">
                  <span>ADJUST STAKES</span>
                </MagneticButton>
              </motion.div>
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="p-6 md:p-8">
              <div className="space-y-4">
                {history.map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/8 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-white mb-1">{h.market}</p>
                      <p className="text-sm text-white/60 font-mono">{h.date}</p>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className={`px-3 py-1 rounded-md font-bold text-sm border ${
                        h.position === 'YES' 
                          ? 'bg-cyan-neon/15 text-cyan-neon border-cyan-neon/30' 
                          : 'bg-red-neon/15 text-red-neon border-red-neon/30'
                      }`}>
                        {h.position}
                      </span>
                      <span className={`px-4 py-2 rounded-md font-bold ${
                        h.result === 'WON' 
                          ? 'bg-cyan-neon/15 text-cyan-neon' 
                          : 'bg-red-neon/15 text-red-neon'
                      }`}>
                        {h.result}
                      </span>
                      <span className={`text-lg font-bold min-w-[100px] text-right ${
                        h.payout.startsWith('+') ? 'text-cyan-neon' : 'text-red-neon'
                      }`}>
                        {h.payout} ALGO
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'PERFORMANCE' && (
            <div className="p-6 md:p-8 text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0 }}
                  className="p-6 bg-gradient-to-br from-cyan-neon/10 to-cyan-neon/5 rounded-lg border border-cyan-neon/30"
                >
                  <p className="text-white/70 font-mono text-sm mb-4">WIN RATE</p>
                  <p className="text-5xl font-bold text-cyan-neon">72.4%</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 bg-gradient-to-br from-gold-accent/10 to-gold-accent/5 rounded-lg border border-gold-accent/30"
                >
                  <p className="text-white/70 font-mono text-sm mb-4">AVG. ROI</p>
                  <p className="text-5xl font-bold text-gold-accent">+24.8%</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 bg-gradient-to-br from-red-neon/10 to-red-neon/5 rounded-lg border border-red-neon/30"
                >
                  <p className="text-white/70 font-mono text-sm mb-4">TOTAL TRADES</p>
                  <p className="text-5xl font-bold text-red-neon">42</p>
                </motion.div>
              </div>

              <p className="text-white/60 font-mono mb-8">
                Your performance is beating 87% of active traders. Keep it up!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
