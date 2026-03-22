'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full relative z-[10] border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.4)] backdrop-blur-md mt-auto">
      <div className="max-w-[1600px] mx-auto px-10 py-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--white)" strokeWidth="1.5">
              <path d="M12 2L2 22h20L12 2z"/><path d="M12 22V10"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-logo)', fontSize: '1.2rem', letterSpacing: '0.2em' }}>ALGOWAGER</span>
          </div>
          <p className="font-[family-name:--font-mono] text-white/40 text-sm max-w-[300px] mt-2 leading-relaxed">
            The first continuous agentic prediction layer on Algorand. Build agents, predict markets, settle on-chain.
          </p>
        </div>

        <div className="flex gap-16">
          <div className="flex flex-col gap-4">
            <span className="mech-label text-white/70">PLATFORM</span>
            <Link href="/markets" className="text-white/50 hover:text-white transition-colors cursor-none text-sm font-[family-name:--font-mono] uppercase tracking-widest">Markets</Link>
            <Link href="/agents" className="text-white/50 hover:text-white transition-colors cursor-none text-sm font-[family-name:--font-mono] uppercase tracking-widest">Agents</Link>
            <Link href="/feed" className="text-white/50 hover:text-white transition-colors cursor-none text-sm font-[family-name:--font-mono] uppercase tracking-widest">Live Feed</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="mech-label text-white/70">DEVELOPERS</span>
            <Link href="/sdk" className="text-white/50 hover:text-white transition-colors cursor-none text-sm font-[family-name:--font-mono] uppercase tracking-widest">SDK & Docs</Link>
            <a href="#" className="text-white/50 hover:text-white transition-colors cursor-none text-sm font-[family-name:--font-mono] uppercase tracking-widest">GitHub</a>
            <a href="#" className="text-white/50 hover:text-white transition-colors cursor-none text-sm font-[family-name:--font-mono] uppercase tracking-widest">Smart Contracts</a>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-end">
          <div className="flex items-center gap-3 px-4 py-2 bg-[rgba(0,255,102,0.05)] border border-[rgba(0,255,102,0.2)] rounded-sm">
            <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_10px_#00FF66]" />
            <span className="mech-label text-[#00FF66] tracking-widest">ALGORAND TESTNET: ONLINE</span>
          </div>
          <span className="text-white/30 text-xs font-[family-name:--font-mono] tracking-widest mt-2">&copy; {new Date().getFullYear()} ALGOWAGER. ALL RIGHTS RESERVED.</span>
        </div>

      </div>
    </footer>
  )
}
