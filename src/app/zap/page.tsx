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
import { usePairData } from '@/hooks/usePairData'
import { optimalSwap, estimateLpMint } from '@/lib/optimalSwap'
import React from 'react'
import { parseUnits } from 'viem'

export default function ZapPage() {
  const [direction, setDirection]   = useState<'in' | 'out'>('in')
  const [pairAddr,  setPairAddr]    = useState<string>()
  const [amount,    setAmount]      = useState<string>('')

  const pair = supportedPairs.find(p => p.address === pairAddr)
  const { zapIn,  isPending: inPending  } = useZapIn()
  const { zapOut, isPending: outPending } = useZapOut()
  const isPendingCombined =
    direction === 'in' ? inPending : outPending

  const { reserves, totalSupply } = usePairData(pair?.address as `0x${string}`)

  const preview = React.useMemo(() => {
    if (!pair || !amount || !reserves || !totalSupply) return null

    const decimalsA = pair.tokenA.decimals
    const amtWei = parseUnits(amount, decimalsA)
    const toSwap = optimalSwap(amtWei, reserves[0])
    const addA   = amtWei - toSwap

    // ΔY = (ΔX * 997 * R1) / (R0*1000 + ΔX*997)
    const swapOut =
      (toSwap * 997n * reserves[1]) /
      (reserves[0] * 1000n + toSwap * 997n)

    const lpMint = estimateLpMint({
      addA,
      addB: swapOut,
      reserveA: reserves[0],
      reserveB: reserves[1],
      totalSupply,
    })

    return { toSwap, swapOut, lpMint }
  }, [pair, amount, reserves, totalSupply])


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
        <CardContent className="py-4 space-y-1">
          {preview ? (
            <>
              <p className="text-sm">
                Optimal swap:&nbsp;
                <b>{Number(preview.toSwap) / 1e18}</b>&nbsp;{pair?.tokenA.symbol}
              </p>
              <p className="text-sm">
                Est. LP tokens:&nbsp;
                <b>{Number(preview.lpMint) / 1e18}</b>
              </p>
              <p className="text-xs text-muted-foreground">
                Min after slippage&nbsp;(0.5 %):&nbsp;
                {Number((preview.lpMint * 995n) / 1000n) / 1e18}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              You’ll receive an estimated … LP tokens
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirm button */}
      <Button
        disabled={!pair || !amount || isPendingCombined}
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
        {isPendingCombined ? 'Confirming…' : direction === 'in' ? 'Zap In' : 'Zap Out'}
      </Button>
    </section>
  )
}
