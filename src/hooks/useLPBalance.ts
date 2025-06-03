'use client'

import { useReadContract, useAccount } from 'wagmi'
import erc20Abi from '@/abis/ERC20.json'
import { formatUnits } from 'viem'
import { useState, useEffect } from 'react'

export function useLPBalance(lpTokenAddress?: `0x${string}`) {
  const { address: userAddress, isConnected } = useAccount()
  const [formattedBalance, setFormattedBalance] = useState<string>('0')

  const { data: balanceWei, isLoading, error, refetch } = useReadContract({
    address: lpTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(lpTokenAddress && userAddress && isConnected),
      refetchInterval: 10_000, // Refetch every 10 seconds
    },
  })

  useEffect(() => {
    console.log('[useLPBalance]', {
      lpTokenAddress,
      userAddress,
      isConnected,
      balanceWei: balanceWei ? balanceWei.toString() : null,
      error
    });

    if (balanceWei) {
      // LP tokens typically have 18 decimals
      setFormattedBalance(formatUnits(balanceWei as bigint, 18))
    } else {
      setFormattedBalance('0')
    }
  }, [balanceWei, lpTokenAddress, userAddress, isConnected, error])

  return {
    balance: balanceWei as bigint | undefined,
    formattedBalance,
    isLoading,
    error,
    refetch
  }
} 