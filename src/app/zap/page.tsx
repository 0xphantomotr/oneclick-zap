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
import { parseUnits, formatUnits, getAddress } from 'viem'
import { toast } from 'sonner'

// Define a type for the preview result to make it cleaner
type ZapInPreviewSuccess = {
  amountWei: bigint;
  toSwap: bigint;
  receivedFromSwap: bigint;
  lpMint: bigint;
  lpMinAfterSlippage: bigint;
  error?: undefined;
}
type ZapInPreviewError = {
    error: string;
    amountWei?: undefined; // Ensure other properties are not expected on error
    toSwap?: undefined;
    receivedFromSwap?: undefined;
    lpMint?: undefined;
    lpMinAfterSlippage?: undefined;
}
type ZapInPreviewResult = ZapInPreviewSuccess | ZapInPreviewError;


export default function ZapPage() {
  const [direction, setDirection]   = useState<'in' | 'out'>('in')
  const [pairAddr,  setPairAddr]    = useState<string>(supportedPairs[0].address)
  const [amount,    setAmount]      = useState<string>('')

  const pair = supportedPairs.find(p => p.address === pairAddr)
  const { zapIn, isPending: zapInSubmitPending, isConfirming: zapInConfirming, failed: zapInFailed } = useZapIn()
  const { zapOut, isPending: zapOutSubmitPending, isConfirming: zapOutConfirming, failed: zapOutFailed } = useZapOut()

  const isSubmitting = direction === 'in' ? zapInSubmitPending : zapOutSubmitPending;
  const isConfirming = direction === 'in' ? zapInConfirming : zapOutConfirming;
  const isFailed = direction === 'in' ? zapInFailed : zapOutFailed;
  const isPendingCombined = isSubmitting || isConfirming;

  // Use the usePairData hook with proper address formatting
  const formattedPairAddress = pair ? getAddress(pair.address) as `0x${string}` : undefined;
  const { reserves, totalSupply, isLoading: isLoadingPairData, error: pairDataError } = usePairData(formattedPairAddress);

  // Log any pair data errors for debugging
  React.useEffect(() => {
    if (pairDataError) {
      console.error('[ZapPage] Pair data error:', pairDataError);
    }
    if (reserves) {
      console.log('[ZapPage] Reserves loaded:', reserves);
    }
    if (totalSupply) {
      console.log('[ZapPage] Total supply loaded:', totalSupply);
    }
  }, [reserves, totalSupply, pairDataError]);

  const tokenInDetails = pair?.tokenA
  const tokenOutDetails = pair?.tokenB

  const preview: ZapInPreviewResult | null = React.useMemo(() => {
    // If still loading, or essential data is missing, or there was an error fetching pair data, return null for preview.
    if (isLoadingPairData || !pair || !amount || !reserves || !tokenInDetails || !tokenOutDetails || pairDataError) return null
    
    const amountN = parseFloat(amount)
    if (isNaN(amountN) || amountN <= 0) return null

    try {
      const amtWei = parseUnits(amount, tokenInDetails.decimals)
      if (amtWei <= 0n) return { error: "Amount must be greater than zero." };
      const tokenA_addr_lower = pair.tokenA.address.toLowerCase();
      const tokenB_addr_lower = pair.tokenB.address.toLowerCase();
      const currentReserves = reserves; 
      if (!currentReserves) return { error: "Reserves not loaded for preview."};

      const reserveIn = tokenA_addr_lower < tokenB_addr_lower ? currentReserves[0] : currentReserves[1]
      const reserveOut = tokenA_addr_lower < tokenB_addr_lower ? currentReserves[1] : currentReserves[0]
      if (reserveIn <= 0n || reserveOut <= 0n) return { error: "Pair reserves are zero or invalid."}
      const toSwap = optimalSwap(amtWei, reserveIn)
      if (toSwap < 0n || toSwap > amtWei) return { error: "Optimal swap calculation error." }
      const tokenInRemaining = amtWei - toSwap;
      let receivedFromSwap = 0n;
      if (toSwap > 0n) {
        receivedFromSwap = (toSwap * 997n * reserveOut) / (reserveIn * 1000n + toSwap * 997n)
      } else if (toSwap === 0n && tokenInRemaining === amtWei) {
        receivedFromSwap = 0n;
      }
      if (tokenInRemaining === 0n && receivedFromSwap === 0n && toSwap > 0n) {
        return { error: "Swap would result in zero output of the other token." }
      }
      const currentTotalSupply = totalSupply;
      if(!currentTotalSupply) return {error: "Total supply not loaded for preview."}

      const lpMint = estimateLpMint({
        addA: tokenInRemaining, addB: receivedFromSwap,
        reserveA: reserveIn, reserveB: reserveOut, totalSupply: currentTotalSupply,
      })
      if (lpMint < 0n) return { error: "Estimated LP minted is negative."}
      const lpMinAfterSlippage = (lpMint * (10000n - 50n)) / 10000n
      return {
        amountWei: amtWei, toSwap, receivedFromSwap, lpMint, lpMinAfterSlippage,
      }
    } catch (e) {
      // This catches errors primarily from parseUnits, e.g. too many decimals for the token
      return { error: "Invalid amount format for token." }
    }
  }, [pair, amount, reserves, tokenInDetails, tokenOutDetails, isLoadingPairData, pairDataError])

  // Helper function for rendering preview content
  const renderPreview = () => {
    const hasAmount = amount && parseFloat(amount) > 0;

    if (direction === 'out') {
      return (
        <p className="text-sm text-muted-foreground">
          Zap Out preview coming soon...
        </p>
      );
    }

    if (hasAmount && isLoadingPairData) {
        return <p className="text-sm text-muted-foreground">Loading pair data for preview...</p>;
    }

    if (hasAmount && !isLoadingPairData && pairDataError) {
        // Display the actual error message if available
        const errorMessage = (pairDataError as any)?.shortMessage || (pairDataError as any)?.message || "Unknown error loading pair data.";
        return <p className="text-sm text-red-500">Error: {errorMessage} Try changing pairs or check network.</p>;
    }
    
    if (!preview && hasAmount) { 
        return <p className="text-sm text-muted-foreground">Calculating preview or invalid input...</p>;
    }
    
    if (!preview) { 
      return (
        <p className="text-sm text-muted-foreground">
          Enter an amount to see preview.
        </p>
      );
    }

    if (preview.error) { 
      return <p className="text-sm text-red-500">{preview.error}</p>;
    }

    if (!tokenInDetails || !tokenOutDetails) { 
        return <p className="text-sm text-red-500">Token details missing.</p>; 
    }
    
    return (
      <>
        <p className="text-sm">
          Optimal to swap:&nbsp;
          <b>{formatUnits(preview.toSwap!, tokenInDetails.decimals)}</b> {tokenInDetails.symbol} for ~<b>{formatUnits(preview.receivedFromSwap!, tokenOutDetails.decimals)}</b> {tokenOutDetails.symbol}
        </p>
        <p className="text-sm">
          Est. LP tokens received:&nbsp;
          <b>{formatUnits(preview.lpMint!, 18)}</b>
        </p>
        <p className="text-xs text-muted-foreground">
          Min. LP after slippage (0.5%):&nbsp;
          <b>{formatUnits(preview.lpMinAfterSlippage!, 18)}</b>
        </p>
      </>
    );
  };

  return (
    <section className="mx-auto max-w-md space-y-6 py-10">
      <h1 className="text-3xl font-bold text-center">
        Zap {direction === 'in' ? 'In' : 'Out'}
        {pair && tokenInDetails && direction === 'in' ? ` with ${tokenInDetails.symbol}` : ''}
        {pair && tokenInDetails && direction === 'out' ? ` LP of ${pair.symbol}` : ''}
      </h1>

      <ToggleGroup
        type="single"
        value={direction}
        onValueChange={(v: 'in' | 'out') => {
            setDirection(v);
            setAmount(''); 
        }}
        className="w-full justify-center"
      >
        <ToggleGroupItem value="in">Zap In</ToggleGroupItem>
        <ToggleGroupItem value="out">Zap Out</ToggleGroupItem>
      </ToggleGroup>

      <Select value={pairAddr} onValueChange={v => { setPairAddr(v); setAmount(''); }}>
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

      <Input
        placeholder={
            direction === 'in' 
            ? `Amount of ${tokenInDetails?.symbol || 'token'}` 
            : `Amount of ${pair?.symbol || 'LP token'}`
        }
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        type="number"
        step="any"
        min="0"
      />

      <Card>
        <CardContent className="py-4 space-y-1">
          {renderPreview()}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        disabled={
            !pair || 
            !amount || 
            parseFloat(amount) <= 0 ||
            isLoadingPairData || 
            pairDataError != null || 
            (direction === 'in' && (!preview || !!preview.error)) || 
            isPendingCombined
        }
        onClick={async () => {
          if (!pair || !tokenInDetails) return;

          if (direction === 'in') {
            if (!preview || preview.error || !preview.amountWei || preview.lpMinAfterSlippage === undefined) {
                toast.error("Cannot proceed with Zap In: preview data is invalid or missing.");
                return;
            }
            zapIn({
              tokenIn: tokenInDetails.address,
              tokenA:  pair.tokenA.address,
              tokenB:  pair.tokenB.address,
              amountWei: preview.amountWei,
              slipBps: 50,
              lpMin: preview.lpMinAfterSlippage,
            })
          } else { 
            if (parseFloat(amount) <= 0) {
                toast.error("LP amount must be positive.");
                return;
            }
            const lpAmountWei = parseUnits(amount, 18);
            const deadline = BigInt(Math.floor(Date.now() / 1_000) + 900);
            const tempOutMin = 1n; 

            await zapOut({
              tokenA:  pair.tokenA.address,
              tokenB:  pair.tokenB.address,
              lpToken: pair.address,
              lpAmountWei: lpAmountWei,
              tokenOut: pair.tokenA.address,
              slipBps: 50,
              outMin: tempOutMin,
              deadline: deadline,
              feeOnTransfer: false
            });
          }
        }}
      >
        {isSubmitting ? 'Confirm in wallet...' : isConfirming ? `Zapping (Confirming ${direction})...` : isFailed ? `Zap ${direction} Failed (Retry?)` : `Zap ${direction.charAt(0).toUpperCase() + direction.slice(1)}`}
      </Button>
      {isFailed && (
         <p className="text-xs text-red-500 text-center">Transaction failed. Please check console or Etherscan for details.</p>
      )}
    </section>
  )
}
