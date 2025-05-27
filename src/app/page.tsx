'use client'

import { Button } from '@/components/ui/button'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">One-Click Zap</h1>
      <ConnectButton chainStatus="icon" showBalance={false} />
      <Button variant="secondary">coming soon…</Button>
    </main>
  )
}