'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { MagneticButton } from './MagneticButton'

export function Navbar() {
  const { isSignedIn, isLoaded, user } = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const pathname = usePathname()

  const handleLuteConnect = async () => {
    try {
      // 🛡️ Dynamic import to prevent "window is not defined" during SSR
      const { default: LuteConnect } = await import('lute-connect')
      const lute = new LuteConnect('AlgoWager')
      const addresses = await lute.connect('testnet-v1.0')
      if (addresses.length > 0) {
        setWalletAddress(addresses[0])
        console.log('Wallet connected:', addresses[0])
        sessionStorage.setItem('luteWalletAddress', addresses[0])
      }
    } catch (err: any) {
      console.error('Lute connection failed:', err)
      alert(`Lute connection failed: ${err.message || 'Check console'}`)
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem('luteWalletAddress')
    if (stored) setWalletAddress(stored)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'MARKETS', path: '/markets' },
    { name: 'AGENTS', path: '/agents' },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{ zIndex: 100 }}
        className={`fixed top-0 left-0 w-full transition-all duration-500 ${
          scrolled ? 'py-3 bg-black/40 backdrop-blur-xl border-b border-white/5' : 'py-6 bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className="group cursor-none flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-[#FF2A1E] flex items-center justify-center font-logo text-lg md:text-xl text-[#FF2A1E] group-hover:bg-[#FF2A1E] group-hover:text-black transition-all duration-300">
              A
            </div>
            <span className="font-logo text-xl md:text-2xl tracking-[0.2em] text-white">
              ALGO<span className="text-[#FF2A1E]">WAGER</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.name}
                href={link.path}
                className="cursor-none relative font-logo text-[0.7rem] tracking-[0.2em] text-white/50 hover:text-white transition-colors py-2"
              >
                {link.name}
                {pathname === link.path && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 w-full h-[1px] bg-[#FF2A1E]"
                  />
                )}
              </Link>
            ))}

            <Link
              href="/sdk"
              className="cursor-none"
              style={{
                fontFamily: 'var(--font-logo)',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                color: pathname === '/sdk' ? '#00FFC8' : 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 999,
                padding: '5px 14px',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = '#00FFC8'
                el.style.color = '#00FFC8'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255,255,255,0.12)'
                el.style.color = pathname === '/sdk' ? '#00FFC8' : 'rgba(255,255,255,0.4)'
              }}
            >
              SDK
            </Link>

            {isSignedIn && (
              <Link
                href="/profile"
                className="cursor-none"
                style={{
                  fontFamily: 'var(--font-logo)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  color: pathname === '/profile' ? '#FF2A1E' : 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,100,100,0.1)',
                  borderRadius: 999,
                  padding: '5px 14px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                PROFILE
              </Link>
            )}

            <div className="flex items-center gap-4 ml-2 pl-4 border-l border-white/10">
              {/* STAGE 1: CONNECT WALLET */}
              {!walletAddress && (
                <MagneticButton 
                  onClick={handleLuteConnect}
                  className="mech-btn mech-btn-red text-[0.7rem] px-[18px] py-[8px]"
                >
                  <span>CONNECT LUTE</span>
                </MagneticButton>
              )}

              {/* STAGE 2: SIGN IN (ONLY AFTER WALLET) */}
              {walletAddress && !isSignedIn && isLoaded && (
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-white/30 truncate max-w-[80px]">
                    {walletAddress.slice(0, 6)}...
                  </span>
                  <SignInButton mode="modal">
                    <button className="mech-btn mech-btn-cyan text-[0.7rem] px-[18px] py-[8px]">
                      SYNC PROFILE
                    </button>
                  </SignInButton>
                </div>
              )}

              {/* STAGE 3: LOGGED IN PROFILE */}
              {isSignedIn && (
                <div className="flex items-center gap-4">
                  {walletAddress && (
                    <span className="text-[10px] font-mono text-green-neon truncate max-w-[80px]">
                      {walletAddress.slice(0, 6)}...
                    </span>
                  )}
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8 border border-red-neon/30 grayscale hover:grayscale-0 transition-all",
                      }
                    }} 
                  />
                </div>
              )}
            </div>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden cursor-none flex flex-col justify-center items-center"
            style={{ width: 40, height: 40, gap: 6, background: 'none', border: 'none', padding: 0 }}
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span
              style={{
                display: 'block',
                width: 24,
                height: 1.5,
                background: 'white',
                transformOrigin: 'center',
                transition: 'transform 0.3s, opacity 0.3s',
                transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              }}
            />
            <span
              style={{
                display: 'block',
                width: 24,
                height: 1.5,
                background: 'white',
                transition: 'opacity 0.3s',
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: 'block',
                width: 24,
                height: 1.5,
                background: 'white',
                transformOrigin: 'center',
                transition: 'transform 0.3s, opacity 0.3s',
                transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 199,
              background: 'rgba(10, 11, 15, 0.98)',
              backdropFilter: 'blur(30px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 40,
            }}
          >
            {[...navLinks, { name: 'SDK', path: '/sdk' }].map((link, i) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  href={link.path}
                  style={{
                    fontFamily: 'var(--font-logo)',
                    fontSize: '2rem',
                    letterSpacing: '0.15em',
                    color: pathname === link.path ? '#FF2A1E' : 'white',
                    textDecoration: 'none',
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}

            {isSignedIn && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  href="/profile"
                  style={{
                    fontFamily: 'var(--font-logo)',
                    fontSize: '2rem',
                    letterSpacing: '0.15em',
                    color: pathname === '/profile' ? '#FF2A1E' : 'white',
                    textDecoration: 'none',
                    opacity: 0.6
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  PROFILE
                </Link>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center gap-8 w-full px-12"
            >
              {/* STAGE 1: CONNECT WALLET */}
              {!walletAddress && (
                <MagneticButton 
                  onClick={handleLuteConnect}
                  className="mech-btn mech-btn-red text-[0.9rem] px-10 py-[14px]"
                >
                  <span>CONNECT LUTE</span>
                </MagneticButton>
              )}

              {/* STAGE 2: SIGN IN (ONLY AFTER WALLET) */}
              {walletAddress && !isSignedIn && isLoaded && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="text-xs font-mono text-white/30 bg-white/5 px-4 py-2 rounded border border-white/10 mb-2">
                    WALLET: {walletAddress.slice(0, 12)}...{walletAddress.slice(-8)}
                  </div>
                  <SignInButton mode="modal">
                    <button className="mech-btn mech-btn-cyan text-[0.9rem] px-10 py-[14px] w-full">
                      SYNC PROFILE
                    </button>
                  </SignInButton>
                </div>
              )}

              {/* STAGE 3: LOGGED IN PROFILE */}
              {isSignedIn && (
                <div className="flex flex-col items-center gap-6">
                  {walletAddress && (
                    <div className="text-xs font-mono text-green-neon bg-green-neon/5 px-4 py-2 rounded border border-green-neon/20">
                      CONNECTED: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                  )}
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-16 h-16 border-2 border-red-neon/30 grayscale hover:grayscale-0",
                      }
                    }} 
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
