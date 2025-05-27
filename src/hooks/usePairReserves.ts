// src/hooks/usePairReserves.ts
'use client'

import { useReadContract } from 'wagmi'
import pairAbi from '@/abis/IUniswapV2Pair.json'

export function usePairReserves(pair?: `0x${string}`) {
  const { data, error, isPending } = useReadContract({
    address: pair,
    abi: pairAbi,
    functionName: 'getReserves',
    query: {
      enabled: Boolean(pair),
      refetchInterval: 12_000,
    },
  })

  const reserves = data as readonly [bigint, bigint, bigint] | undefined

  return {
    reserve0: reserves?.[0],
    reserve1: reserves?.[1],
    isLoading: isPending,
    error,
  }
}
