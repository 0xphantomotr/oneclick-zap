'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function NavBar() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="font-bold text-xl">OneClick Zap</div>
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/docs">
                <Button variant="ghost">Documentation</Button>
              </Link>
            </li>
          </ul>
      </nav>
      </div>
    </header>
  )
}