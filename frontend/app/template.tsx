'use client'

import { motion } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
      animate={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
      style={{ width: '100%', minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}
