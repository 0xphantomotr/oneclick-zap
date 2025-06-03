'use client'

import { useReadContract, useAccount } from 'wagmi'
import erc20Abi from '@/abis/ERC20.json'
import { formatUnits } from 'viem'
import { useState, useEffect } from 'react'

export function useTokenBalance(tokenAddress?: `0x${string}`, decimals = 18) {
  const { address: userAddress, isConnected } = useAccount()
  const [formattedBalance, setFormattedBalance] = useState<string>('0')

  const { data: balanceWei, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(tokenAddress && userAddress && isConnected),
      refetchInterval: 10_000, // Refetch every 10 seconds
    },
  })

  useEffect(() => {
    console.log('[useTokenBalance]', {
      tokenAddress,
      userAddress,
      isConnected,
      decimals,
      balanceWei: balanceWei ? balanceWei.toString() : null,
      error
    });

    if (balanceWei) {
      setFormattedBalance(formatUnits(balanceWei as bigint, decimals))
    } else {
      setFormattedBalance('0')
    }
  }, [balanceWei, decimals, tokenAddress, userAddress, isConnected, error])

  return {
    balance: balanceWei as bigint | undefined,
    formattedBalance,
    isLoading,
    error,
    refetch
  }
}
