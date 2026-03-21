'use client'

import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { GlitchDissolveText } from "@/components/GlitchDissolveText"
import { useEffect, useState } from "react"

// ── Types ────────────────────────────────────────────────────────────
interface AlgoAccount {
  amount: number
  'min-balance': number
  'total-created-apps': number
  'total-assets-opted-in': number
}
interface AlgoTxn {
  id: string
  'round-time': number
  'tx-type': string
  sender: string
  'payment-transaction'?: { amount: number; receiver: string }
}

const ALGOS = (micro: number) => (micro / 1_000_000).toFixed(4)
const ALGOD = 'https://testnet-api.algonode.cloud'
const INDEXER = 'https://testnet-idx.algonode.cloud'

async function fetchAccountInfo(address: string): Promise<AlgoAccount | null> {
  try {
    const res = await fetch(`${ALGOD}/v2/accounts/${address}`)
    return res.ok ? res.json() : null
  } catch { return null }
}
async function fetchTransactions(address: string): Promise<AlgoTxn[]> {
  try {
    const res = await fetch(`${INDEXER}/v2/accounts/${address}/transactions?limit=6`)
    if (!res.ok) return []
    const data = await res.json()
    return data.transactions ?? []
  } catch { return [] }
}

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [accountInfo, setAccountInfo] = useState<AlgoAccount | null>(null)
  const [transactions, setTransactions] = useState<AlgoTxn[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('luteWalletAddress')
    if (stored) setWalletAddress(stored)
  }, [])

  useEffect(() => {
    if (!walletAddress) return
    setLoading(true)
    Promise.all([
      fetchAccountInfo(walletAddress),
      fetchTransactions(walletAddress),
    ]).then(([acct, txns]) => {
      setAccountInfo(acct)
      setTransactions(txns)
    }).finally(() => setLoading(false))
  }, [walletAddress])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40 animate-pulse font-mono tracking-widest text-lg">
          LOADING SECURE PROFILE...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-bold uppercase mb-4">
          USER <GlitchDissolveText text="PROFILE" glowColor="#FF2A1E" />
        </h1>
        <p className="text-white/60 font-mono tracking-wider max-w-2xl">
          COMMAND CENTER FOR ACCOUNT {user.id.toUpperCase()}. 
          TRACK YOUR WAGERS, REWARDS, AND AGENT PERFORMANCE.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border-red-neon/30 p-8 flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full border-2 border-red-neon p-1 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={user.imageUrl} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-500" 
            />
          </div>
          <h2 className="text-2xl font-bold mb-1">{user.fullName || user.username || "ANONYMOUS"}</h2>
          <p className="text-white/40 font-mono text-xs mb-6 uppercase tracking-widest">{user.primaryEmailAddress?.emailAddress}</p>
          
          <div className="w-full space-y-4 pt-6 border-t border-white/10">
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-white/40">STATUS:</span>
              <span className="text-green-neon">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-white/40">TIER:</span>
              <span className="text-red-neon font-bold uppercase">
                {accountInfo && accountInfo.amount > 10_000_000 ? 'PROPHET' : 'INITIATE'}
              </span>
            </div>
            <div className="flex flex-col items-start text-sm font-mono mt-4 pt-4 border-t border-white/5">
              <span className="text-white/40 text-[10px] mb-2">LINKED WALLET:</span>
              {walletAddress ? (
                <>
                  <span className="text-cyan-neon text-xs break-all text-left leading-relaxed">
                    {walletAddress}
                  </span>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-neon animate-pulse" />
                    <span className="text-[10px] text-green-neon">CONNECTED · TESTNET</span>
                  </div>
                </>
              ) : (
                <span className="text-white/20 text-xs italic">Not connected (Use Navbar)</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="lg:col-span-2 space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card border-cyan-neon/20 p-6">
              <span className="mech-label text-cyan-neon mb-2 block">TOTAL BALANCE</span>
              {loading ? (
                <div className="h-10 w-32 bg-white/10 animate-pulse rounded" />
              ) : (
                <p className="text-4xl font-bold">
                  {accountInfo ? ALGOS(accountInfo.amount) : '—'} <span className="text-sm text-white/40 font-normal">ALGO</span>
                </p>
              )}
            </div>
            <div className="glass-card border-[#FFC857]/20 p-6">
              <span className="mech-label text-[#FFC857] mb-2 block flex items-center gap-2">
                APPS & ASSETS
              </span>
              {loading ? (
                <div className="h-10 w-24 bg-white/10 animate-pulse rounded" />
              ) : (
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold">{accountInfo?.['total-created-apps'] ?? '—'}</p>
                  <p className="text-sm text-white/40 mb-1">APPS</p>
                  <p className="text-4xl font-bold ml-2 text-white/70">{accountInfo?.['total-assets-opted-in'] ?? '—'}</p>
                  <p className="text-sm text-white/30 mb-1">ASSETS</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card border-white/10 p-8">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h3 className="text-sm font-mono text-white/60 uppercase tracking-[0.2em]">
                RECENT ACTIVITY (TESTNET)
              </h3>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                   <div key={i} className="flex justify-between items-center group">
                     <div className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full bg-white/10 animate-pulse" />
                       <div>
                         <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                         <div className="h-3 w-20 bg-white/5 rounded mt-2 animate-pulse" />
                       </div>
                     </div>
                   </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-white/30 font-mono text-sm text-center py-6">
                {walletAddress ? 'No testnet transactions found.' : 'Connect a wallet to view activity.'}
              </p>
            ) : (
              <div className="space-y-6">
                {transactions.map((txn) => {
                  const isPay = txn['tx-type'] === 'pay'
                  const payAmt = txn['payment-transaction']?.amount
                  const isSender = txn.sender === walletAddress
                  const date = new Date(txn['round-time'] * 1000)
                  const timeStr = date.toLocaleString('en-US', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                  const typeColor = txn['tx-type'] === 'pay' ? 'bg-cyan-neon'
                    : txn['tx-type'] === 'axfer' ? 'bg-[#FFC857]' : 'bg-red-neon'

                  return (
                    <div key={txn.id} className="flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${typeColor}`} />
                        <div>
                          <p className="font-bold text-sm tracking-wide text-white/80">
                            {txn['tx-type'].toUpperCase()} <span className="text-white/30 font-mono text-xs ml-2">{txn.id.slice(0,10)}...</span>
                          </p>
                          <p className="text-xs text-white/40 font-mono uppercase mt-1">
                            {timeStr}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isPay && payAmt !== undefined ? (
                           <p className={`font-bold ${isSender ? 'text-red-neon' : 'text-green-neon'}`}>
                             {isSender ? '−' : '+'}{ALGOS(payAmt)} ALGO
                           </p>
                        ) : (
                           <p className="text-white/30 font-mono">—</p>
                        )}
                        <p className="text-[10px] text-white/30 font-mono tracking-tighter mt-1">
                          FROM: {txn.sender === walletAddress ? 'YOU' : `${txn.sender.slice(0,6)}...`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
