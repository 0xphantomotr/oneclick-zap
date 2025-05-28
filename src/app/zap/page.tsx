'use client'

import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
} from '@/components/ui/select'

import { useState } from 'react'
import { supportedPairs } from '@/data/pairs'
import { useZapIn } from '@/hooks/useZapIn'
import { useZapOut } from '@/hooks/useZapOut'

export default function ZapPage() {
  const [direction, setDirection]   = useState<'in' | 'out'>('in')
  const [pairAddr,  setPairAddr]    = useState<string>()
  const [amount,    setAmount]      = useState<string>('')

  const pair = supportedPairs.find(p => p.address === pairAddr)
  const { zapIn, isPending } = useZapIn()
  const { zapOut, isPending: outPending } = useZapOut()

  return (
    <section className="mx-auto max-w-md space-y-6 py-10">
      <h1 className="text-3xl font-bold text-center">
        Zap&nbsp;{direction}
      </h1>

      {/* In / Out toggle */}
      <ToggleGroup
        type="single"
        value={direction}
        onValueChange={(v: 'in' | 'out') => setDirection(v)}
        className="w-full justify-center"
      >
        <ToggleGroupItem value="in">Zap In</ToggleGroupItem>
        <ToggleGroupItem value="out">Zap Out</ToggleGroupItem>
      </ToggleGroup>

      {/* Pair select */}
      <Select value={pairAddr} onValueChange={setPairAddr}>
        <SelectTrigger>
          {pair ? pair.symbol : 'Choose pair'}
        </SelectTrigger>
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

      {/* Amount input */}
      <Input
        placeholder={direction === 'in' ? 'Token amount' : 'LP amount'}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* Summary stub */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            You’ll receive an estimated … LP tokens
          </p>
        </CardContent>
      </Card>

      {/* Confirm button */}
      <Button
        disabled={!pair || !amount || isPending}
        onClick={() => {
          if (!pair) return
          if (direction === 'in') {
            zapIn({
              tokenIn: pair.tokenA.address,   // assumes input = tokenA
              tokenA:  pair.tokenA.address,
              tokenB:  pair.tokenB.address,
              amount,
              slipBps: 50,
            })
          } else {
            zapOut({
              tokenA:  pair.tokenA.address,
              tokenB:  pair.tokenB.address,
              lpToken: pair.address,
              amountLp: amount,
              tokenOut: pair.tokenA.address,  // default: get tokenA back
              slipBps: 50,
            })
          }
        }}
      >
        {isPending ? 'Confirming…' : direction === 'in' ? 'Zap In' : 'Zap Out'}
      </Button>
    </section>
  )
}
