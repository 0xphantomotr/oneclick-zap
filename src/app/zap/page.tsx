'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectTrigger, SelectItem, SelectContent } from '@/components/ui/select'
import { useState } from 'react'

export default function ZapPage() {
  const [direction, setDirection] = useState<'in' | 'out'>('in')

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

      <Select>
        <SelectTrigger>Choose pair</SelectTrigger>
        <SelectContent>
          <SelectItem value="eth-usdc">ETH / USDC</SelectItem>
          <SelectItem value="weth-dai">WETH / DAI</SelectItem>
          {/* later: map on-chain pairs */}
        </SelectContent>
      </Select>

      <Input placeholder="Amount" />

      <Card>
        <CardContent className="py-4">
          {/* live summary coming soon */}
          <p className="text-sm text-muted-foreground">
            You’ll receive an estimated … LP tokens
          </p>
        </CardContent>
      </Card>

      <Button className="w-full">Confirm</Button>
    </section>
  )
}