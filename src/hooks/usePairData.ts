// oneclick-zap/src/hooks/usePairData.ts
'use client'
import { useReadContracts, useAccount } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import pairAbi from '@/abis/IUniswapV2Pair.json'
import { useEffect } from 'react'
import { getAddress } from 'viem'

export function usePairData(pairAddress?: `0x${string}`) {
  const { chain } = useAccount();
  const targetChainId = sepolia.id;
  
  // Properly format the address with checksum if provided
  const formattedAddress = pairAddress ? 
    getAddress(pairAddress) as `0x${string}` : undefined;
  
  const { data, isPending, error, status } = useReadContracts({
    contracts: formattedAddress
      ? [
          { address: formattedAddress, abi: pairAbi, functionName: 'getReserves', chainId: targetChainId },
          { address: formattedAddress, abi: pairAbi, functionName: 'totalSupply', chainId: targetChainId },
        ]
      : [],
    query: { 
        enabled: !!formattedAddress, 
        refetchInterval: 12_000 
    },
  })

  // For debugging
  useEffect(() => {
    if (formattedAddress) {
      console.log('[usePairData] Using formatted address:', formattedAddress);
      console.log('[usePairData] Original address:', pairAddress);
      console.log('[usePairData] On chainId:', targetChainId);
      console.log('[usePairData] Connected wallet chain:', chain);
      console.log('[usePairData] isLoading (isPending):', isPending);
      console.log('[usePairData] status:', status);
      console.log('[usePairData] error:', error);
      console.log('[usePairData] raw data:', data);
    }
  }, [formattedAddress, pairAddress, data, isPending, error, status, targetChainId, chain]);

  const reservesResult = data?.[0];
  const totalSupplyResult = data?.[1];

  return {
    reserves: reservesResult?.status === 'success' 
        ? reservesResult.result as readonly [bigint, bigint, bigint] 
        : undefined,
    totalSupply: totalSupplyResult?.status === 'success' 
        ? totalSupplyResult.result as bigint 
        : undefined,
    isLoading: isPending,
    error: error || data?.find(d => d.status === 'failure' && d.error instanceof Error)?.error,
  }
}