'use client'
import { useReadContracts } from 'wagmi'
import pairAbi from '@/abis/IUniswapV2Pair.json'

export function usePairData(pair?: `0x${string}`) {
  const { data } = useReadContracts({
    contracts: pair
      ? [
          { address: pair, abi: pairAbi, functionName: 'getReserves' },
          { address: pair, abi: pairAbi, functionName: 'totalSupply' },
        ]
      : [],
    query: { enabled: !!pair, refetchInterval: 12_000 },
  })

  return {
    reserves: data?.[0]?.result as
      | readonly [bigint, bigint, bigint]
      | undefined,
    totalSupply: data?.[1]?.result as bigint | undefined,
  }
}
