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
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect } from 'react'
import { supportedPairs } from '@/data/pairs'
import { useZapIn } from '@/hooks/useZapIn'
import { useZapOut } from '@/hooks/useZapOut'
import { usePairData } from '@/hooks/usePairData'
import { optimalSwap, estimateLpMint } from '@/lib/optimalSwap'
import React from 'react'
import { parseUnits, formatUnits, getAddress } from 'viem'
import { toast } from 'sonner'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { useLPBalance } from '@/hooks/useLPBalance'

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

// Add this type definition after the existing ZapInPreviewResult type
type ZapOutPreviewResult = {
  lpAmountWei: bigint;
  tokenOutEstimate: bigint;
  tokenOutMinAfterSlippage: bigint;
  error?: string;
};

export default function Page() {
  const [direction, setDirection]   = useState<'in' | 'out'>('in')
  const [pairAddr,  setPairAddr]    = useState<string>(supportedPairs[0].address)
  const [amount,    setAmount]      = useState<string>('')
  const [zapOutToken, setZapOutToken] = useState<'tokenA' | 'tokenB'>('tokenA')

  const pair = supportedPairs.find(p => p.address === pairAddr)
  
  // Add balance hooks - MOVE THESE UP before they're used in any useMemo
  const formattedLpAddress = pair ? getAddress(pair.address) as `0x${string}` : undefined
  const formattedTokenAAddress = pair?.tokenA ? getAddress(pair.tokenA.address) as `0x${string}` : undefined
  const formattedTokenBAddress = pair?.tokenB ? getAddress(pair.tokenB.address) as `0x${string}` : undefined
  
  const { formattedBalance: lpBalance } = useLPBalance(formattedLpAddress)
  const { formattedBalance: tokenABalance } = useTokenBalance(formattedTokenAAddress, pair?.tokenA.decimals)
  const { formattedBalance: tokenBBalance } = useTokenBalance(formattedTokenBAddress, pair?.tokenB.decimals)

  // Add some debugging
  useEffect(() => {
    console.log('[Page] Balances:', {
      lpBalance,
      tokenABalance,
      tokenBBalance,
      lpAddress: formattedLpAddress,
      tokenAAddress: formattedTokenAAddress,
      tokenBAddress: formattedTokenBAddress
    });
  }, [lpBalance, tokenABalance, tokenBBalance, formattedLpAddress, formattedTokenAAddress, formattedTokenBAddress]);

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
      console.error('[Page] Pair data error:', pairDataError);
    }
    if (reserves) {
      console.log('[Page] Reserves loaded:', reserves);
    }
    if (totalSupply) {
      console.log('[Page] Total supply loaded:', totalSupply);
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
    } catch {
      // This catches errors primarily from parseUnits, e.g. too many decimals for the token
      return { error: "Invalid amount format for token." }
    }
  }, [pair, amount, reserves, tokenInDetails, tokenOutDetails, isLoadingPairData, pairDataError, totalSupply])

  // Now the zapOutPreview useMemo can access lpBalance
  const zapOutPreview: ZapOutPreviewResult | null = React.useMemo(() => {
    if (direction !== 'out' || isLoadingPairData || !pair || !amount || !reserves || pairDataError) return null;
    
    const amountN = parseFloat(amount);
    if (isNaN(amountN) || amountN <= 0) return null;

    try {
      const lpAmountWei = parseUnits(amount, 18);
      if (lpAmountWei <= 0n) return { 
        lpAmountWei: 0n, 
        tokenOutEstimate: 0n, 
        tokenOutMinAfterSlippage: 0n, 
        error: "Amount must be greater than zero." 
      };
      
      // Check if user has enough LP tokens
      if (lpBalance && parseFloat(amount) > parseFloat(lpBalance)) {
        return { 
          lpAmountWei, 
          tokenOutEstimate: 0n, 
          tokenOutMinAfterSlippage: 0n, 
          error: `Insufficient LP balance. You have ${lpBalance} ${pair.symbol}` 
        };
      }
      
      // Simplified estimation based on proportional share of reserves
      if (!totalSupply || totalSupply === 0n) {
        return { lpAmountWei, tokenOutEstimate: 0n, tokenOutMinAfterSlippage: 0n, error: "Cannot estimate: total supply is zero." };
      }
      
      // Calculate share of the pool
      const shareOfPool = (lpAmountWei * 10000n) / totalSupply;
      
      // Get the correct reserve based on selected output token
      const selectedTokenReserve = zapOutToken === 'tokenA' ? 
        (pair.tokenA.address.toLowerCase() < pair.tokenB.address.toLowerCase() ? reserves[0] : reserves[1]) : 
        (pair.tokenA.address.toLowerCase() < pair.tokenB.address.toLowerCase() ? reserves[1] : reserves[0]);
      
      // Estimate token out (simplified - in reality router has more complex logic with swaps)
      const tokenOutEstimate = (selectedTokenReserve * shareOfPool) / 10000n;
      
      // Apply slippage tolerance of 0.5%
      const tokenOutMinAfterSlippage = (tokenOutEstimate * (10000n - 50n)) / 10000n;
      
      return {
        lpAmountWei,
        tokenOutEstimate,
        tokenOutMinAfterSlippage,
        error: undefined
      };
    } catch {
      return { 
        lpAmountWei: 0n, 
        tokenOutEstimate: 0n, 
        tokenOutMinAfterSlippage: 0n, 
        error: "Error calculating preview." 
      };
    }
  }, [direction, pair, amount, reserves, totalSupply, isLoadingPairData, pairDataError, zapOutToken, lpBalance]);

  // Modify the renderPreview function to handle both Zap In and Zap Out
  const renderPreview = () => {
    const hasAmount = amount && parseFloat(amount) > 0;

    if (hasAmount && isLoadingPairData) {
        return <p className="text-sm text-muted-foreground">Loading pair data for preview...</p>;
    }

    if (hasAmount && !isLoadingPairData && pairDataError) {
      const errorMessage = pairDataError instanceof Error 
        ? pairDataError.message 
        : typeof pairDataError === 'object' && pairDataError !== null 
          ? ('shortMessage' in pairDataError 
            ? String((pairDataError as Record<string, unknown>).shortMessage)
            : "Unknown error")
          : "Unknown error loading pair data.";
        return <p className="text-sm text-red-500">Error: {errorMessage} Try changing pairs or check network.</p>;
    }
    
    if (direction === 'in') {
      // Check if user has enough tokens for zap in
      if (tokenInDetails && tokenABalance && parseFloat(tokenABalance) < 10) {
        return (
          <div className="text-sm">
            <p className="text-amber-500">Your {tokenInDetails.symbol} balance is low.</p>
            <p className="mt-1">
              <Link href="/faucet" className="text-blue-500 hover:underline">Get free test tokens from our faucet</Link>
            </p>
          </div>
        );
      }
      
      if (!preview && hasAmount) { 
          return <p className="text-sm text-muted-foreground">Calculating preview or invalid input...</p>;
      }
      
      if (!preview) { 
          return <p className="text-sm text-muted-foreground">Enter an amount to see preview.</p>;
      }

      if (preview.error) { 
        if (preview.error.includes("Amount must be greater than zero")) {
          return (
            <div className="text-sm text-red-500">
              <p>{preview.error}</p>
              <p className="mt-1">
                Need tokens? <Link href="/faucet" className="underline">Visit our faucet</Link>
              </p>
            </div>
          );
        }
        return <p className="text-sm text-red-500">{preview.error}</p>;
      }

      if (!tokenInDetails || !tokenOutDetails) { 
          return <p className="text-sm text-red-500">Token details missing.</p>
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
    } else {
      // Zap Out preview rendering
      if (!zapOutPreview && hasAmount) {
        return <p className="text-sm text-muted-foreground">Calculating preview or invalid input...</p>;
      }
      
      if (!zapOutPreview) {
        return <p className="text-sm text-muted-foreground">Enter an amount to see preview.</p>;
      }

      if (zapOutPreview.error) {
        if (zapOutPreview.error.includes("Insufficient LP balance")) {
          return (
            <div className="text-sm text-red-500">
              <p>{zapOutPreview.error}</p>
              <p className="mt-1">
                <Link href="/" className="text-blue-500 hover:underline" onClick={() => setDirection('in')}>
                  Zap in first to get LP tokens
                </Link>
              </p>
            </div>
          );
        }
        return <p className="text-sm text-red-500">{zapOutPreview.error}</p>;
      }

      const selectedToken = zapOutToken === 'tokenA' ? pair?.tokenA : pair?.tokenB;
      if (!selectedToken) {
        return <p className="text-sm text-red-500">Token details missing.</p>
      }
      
      return (
        <>
          <div className="flex justify-between mb-2">
            <span className="text-sm">Receive token:</span>
            <ToggleGroup
              type="single"
              value={zapOutToken}
              onValueChange={(v: 'tokenA' | 'tokenB') => setZapOutToken(v)}
              size="sm"
            >
              <ToggleGroupItem value="tokenA" size="sm">
                {pair?.tokenA.logo && (
                  <Image 
                    src={pair.tokenA.logo} 
                    width={16} 
                    height={16} 
                    className="inline mr-1" 
                    alt={`${pair.tokenA.symbol} logo`} 
                  />
                )}
                {pair?.tokenA.symbol}
              </ToggleGroupItem>
              <ToggleGroupItem value="tokenB" size="sm">
                {pair?.tokenB.logo && (
                  <Image 
                    src={pair.tokenB.logo} 
                    width={16} 
                    height={16} 
                    className="inline mr-1" 
                    alt={`${pair.tokenB.symbol} logo`} 
                  />
                )}
                {pair?.tokenB.symbol}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <p className="text-sm">
            Est. {selectedToken.symbol} to receive:&nbsp;
            <b>{formatUnits(zapOutPreview.tokenOutEstimate, selectedToken.decimals)}</b>
          </p>
          <p className="text-xs text-muted-foreground">
            Min. after slippage (0.5%):&nbsp;
            <b>{formatUnits(zapOutPreview.tokenOutMinAfterSlippage, selectedToken.decimals)}</b>
          </p>
        </>
      );
    }
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
              <Image 
                src={p.tokenA.logo || '/placeholder.png'} 
                width={16} 
                height={16} 
                className="inline mr-1" 
                alt={`${p.tokenA.symbol} logo`} 
              />
              <Image 
                src={p.tokenB.logo || '/placeholder.png'} 
                width={16} 
                height={16} 
                className="inline mr-1 -ml-2" 
                alt={`${p.tokenB.symbol} logo`} 
              />
              {p.symbol}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Add balance display */}
      <div className="flex justify-between text-sm">
        <span>
          {direction === 'in' 
            ? `Available: ${zapOutToken === 'tokenA' ? tokenABalance : tokenBBalance} ${zapOutToken === 'tokenA' ? pair?.tokenA.symbol : pair?.tokenB.symbol}`
            : `Available LP: ${lpBalance} ${pair?.symbol}`}
        </span>
        <button 
          className="text-blue-500 hover:underline"
          onClick={() => {
            if (direction === 'in') {
              setAmount(zapOutToken === 'tokenA' ? tokenABalance : tokenBBalance)
            } else {
              setAmount(lpBalance)
            }
          }}
        >
          Max
        </button>
      </div>

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
            (direction === 'out' && (!zapOutPreview || !!zapOutPreview.error)) ||
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
            if (!zapOutPreview || zapOutPreview.error) {
                toast.error("Cannot proceed with Zap Out: preview data is invalid or missing.");
                return;
            }
            
            // Use the selected token for zapping out
            const selectedTokenAddress = zapOutToken === 'tokenA' ? pair.tokenA.address : pair.tokenB.address;
            
            try {
              // Ensure all addresses are properly formatted with checksum
              const formattedTokenA = getAddress(pair.tokenA.address);
              const formattedTokenB = getAddress(pair.tokenB.address);
              const formattedLpToken = getAddress(pair.address);
              const formattedTokenOut = getAddress(selectedTokenAddress);

            await zapOut({
                tokenA: formattedTokenA as `0x${string}`,
                tokenB: formattedTokenB as `0x${string}`,
                lpToken: formattedLpToken as `0x${string}`,
                lpAmountWei: zapOutPreview.lpAmountWei,
                tokenOut: formattedTokenOut as `0x${string}`,
              slipBps: 50,
                outMin: zapOutPreview.tokenOutMinAfterSlippage,
                deadline: BigInt(Math.floor(Date.now() / 1_000) + 900),
              feeOnTransfer: false
            });
            } catch (error: unknown) {
              console.error("Error formatting addresses:", error);
              const errorMessage = error instanceof Error 
                ? error.message 
                : "Unknown error";
              toast.error(`Address formatting error: ${errorMessage}`);
            }
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