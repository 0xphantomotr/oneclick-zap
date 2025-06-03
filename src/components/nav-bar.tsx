'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function NavBar() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="font-bold text-xl">OneClick Zap</div>
        </Link>
        
        <div className="flex items-center gap-4">
          <nav>
            <ul className="flex space-x-2">
              <li>
                <Link href="/docs">
                  <Button variant="ghost" size="sm">Docs</Button>
                </Link>
              </li>
              <li>
                <Link href="/faucet">
                  <Button variant="ghost" size="sm">Get Tokens</Button>
                </Link>
              </li>
            </ul>
          </nav>
          
          <ConnectButton 
            showBalance={false}
            chainStatus="icon"
          />
        </div>
      </div>
    </header>
  )
}