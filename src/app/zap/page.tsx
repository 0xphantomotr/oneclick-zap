'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectTrigger, SelectItem, SelectContent } from '@/components/ui/select'
import { useState } from 'react'
import { supportedPairs } from '@/data/pairs'

export default function ZapPage() {
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [pairAddr, setPairAddr] = useState<string | undefined>()

  return (
    <section className="mx-auto max-w-md space-y-6 py-10">
      <h1 className="text-3xl font-bold text-center">Zap&nbsp;{direction}</h1>

      <ToggleGroup
        type="single"
        value={direction}
        onValueChange={(v: 'in' | 'out') => setDirection(v)}
        className="w-full justify-center"
      >
        <ToggleGroupItem value="in">Zap In</ToggleGroupItem>
        <ToggleGroupItem value="out">Zap Out</ToggleGroupItem>
      </ToggleGroup>

        <Select value={pairAddr} onValueChange={setPairAddr}>
        <SelectTrigger>{pairAddr ? supportedPairs.find(p => p.address === pairAddr)!.symbol : 'Choose pair'}</SelectTrigger>
        <SelectContent>
            {supportedPairs.map(p => (
            <SelectItem key={p.address} value={p.address}>
                <img src={p.tokenA.logo} className="inline h-4 w-4 mr-1" />
                <img src={p.tokenB.logo} className="inline h-4 w-4 mr-1 -ml-2" />
                {p.symbol}
            </SelectItem>
            ))}
        </SelectContent>
        </Select>

      <Input placeholder="Amount" />

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            You’ll receive an estimated … LP tokens
          </p>
        </CardContent>
      </Card>

      <Button className="w-full">Confirm</Button>
    </section>
  )
}