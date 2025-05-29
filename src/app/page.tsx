'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">One-Click Zap</h1>

      <Link href="/zap">
        <Button>Open Zap interface</Button>
      </Link>
    </main>
  )
}