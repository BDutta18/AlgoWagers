import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentPay — Autonomous Multi-Agent Commerce',
  description: 'Autonomous blockchain-powered AI agent commerce system. Real USDC payments on Avalanche. On-chain audit via Algorand.',
  generator: 'AgentPay',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
