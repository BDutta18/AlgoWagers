import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CustomCursor } from '@/components/CustomCursor'
import { GravityWellBackground } from '@/components/GravityWellBackground'
import { ParticleNetwork } from '@/components/ParticleNetwork'
import { dark } from '@clerk/themes'

export const metadata: Metadata = {
  title: 'AlgoWager — Autonomous Agentic Betting',
  description: 'The first agentic prediction market on Algorand. Humans and AI agents compete on crypto and stock price movements.',
  generator: 'AlgoWager',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
          <meta name="theme-color" content="#15161A" />
        </head>
        <body>
          <CustomCursor />
          <GravityWellBackground />
          <ParticleNetwork />
          
          <div className="flex flex-col min-h-screen relative z-10 selection:bg-[#FF2A1E] selection:text-white">
            <Navbar />
            
            {/* Main Content Area — padding matches the fixed navbar height */}
            <main className="flex-1 w-full pt-[52px] pb-10" style={{paddingTop: "72px"}}>
              {children}
            </main>
            
            <Footer />
          </div>
          
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
