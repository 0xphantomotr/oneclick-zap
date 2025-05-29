'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function NavBar() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Link href="/" className="font-bold text-lg">
        One-Click Zap
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/zap" className="hover:underline">
          Zap
        </Link>
        <ConnectButton chainStatus="icon" showBalance={false} />
      </nav>
    </header>
  )
}