'use client'

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi'
import routerAbi from '@/abis/Univ2ZapRouter.json'
import erc20Abi  from '@/abis/ERC20.json'
import { ZAP_ROUTER } from '@/lib/constants'
import { toast }      from 'sonner'
// parseUnits is not used here if lpAmountWei is passed as bigint
// import { parseUnits } from 'viem' 
import { useState, useEffect } from 'react'
import { sepolia } from 'wagmi/chains'

// Define the arguments for the internal _zapOut function
interface ZapOutArgs {
  tokenA:  `0x${string}`;
  tokenB:  `0x${string}`;
  lpToken: `0x${string}`;
  lpAmountWei: bigint; // Expecting bigint
  tokenOut: `0x${string}`;
  slipBps: number; // Will be converted to BigInt in the function
  outMin: bigint;
  deadline: bigint;
  feeOnTransfer: boolean;
}

export function useZapOut() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync, isPending: isWriting } = useWriteContract()

  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const { isSuccess: mined, isError: failed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!hash) return
    if (mined)
      toast.success('Zap Out Tx Mined!', {
        action: {
          label: 'View',
          onClick: () => {
            const baseUrl = sepolia.blockExplorers.default.url
            window.open(`${baseUrl}/tx/${hash}`, '_blank')
          },
        },
      })
    if (failed) toast.error('Zap Out Tx Reverted') // Custom message
  }, [hash, mined, failed])

  // Internal function with the actual logic
  async function _zapOutInternal(args: ZapOutArgs) {
    if (!address)         throw new Error('Connect wallet first')
    if (!publicClient)    throw new Error('Client not ready, retry')

    // Log the addresses for debugging
    console.log('[useZapOut] Using addresses:', {
      lpToken: args.lpToken,
      tokenA: args.tokenA,
      tokenB: args.tokenB,
      tokenOut: args.tokenOut,
      zapRouter: ZAP_ROUTER
    });

    try {
    // Approval check for LP token
    const allowance = (await publicClient.readContract({
      address: args.lpToken,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address as `0x${string}`, ZAP_ROUTER],
    })) as bigint

      console.log('[useZapOut] Current allowance:', allowance.toString());
      console.log('[useZapOut] Required amount:', args.lpAmountWei.toString());

    if (allowance < args.lpAmountWei) {
      toast('Approving LP token for Zap Out…')
      const approveHash = await writeContractAsync({
        address: args.lpToken,
        abi: erc20Abi,
        functionName: 'approve',
        args: [ZAP_ROUTER, args.lpAmountWei],
      })
      await publicClient.waitForTransactionReceipt({ hash: approveHash })
      toast.success('LP Token Approved for Zap Out!')
    }

    // Execute Zap Out
      const loadingToastId = toast.loading('Submitting Zap Out transaction…')
    const txHash = await writeContractAsync({
      address: ZAP_ROUTER,
      abi: routerAbi,
      functionName: 'zapOutSingleToken',
      args: [
        args.tokenOut,
        args.tokenA,
        args.tokenB,
        args.lpAmountWei,
          BigInt(args.slipBps),
        args.outMin,
        args.deadline,
        args.feeOnTransfer
      ],
    })
      toast.dismiss(loadingToastId)
    setHash(txHash)
    } catch (error: unknown) {
      console.error('[useZapOut] Error in _zapOutInternal:', error);
      throw error;
    }
  }

  // Exposed function to be called from the UI
  return {
    zapOut: async (args: ZapOutArgs) => {
      // Reset hash before new transaction to ensure isConfirming behaves correctly
      setHash(undefined); 
      let loadingToastId;
      
      try {
        loadingToastId = toast.loading('Submitting Zap Out transaction…')
        await _zapOutInternal(args);
        toast.dismiss(loadingToastId); // Dismiss the loading toast
        toast.success('Tx sent. Waiting for confirmation…')
      } catch (e: unknown) {
        toast.dismiss(); // Dismiss any loading toasts
        if (e instanceof Error) {
          if ('shortMessage' in e) {
            toast.error(typeof e === 'object' && e !== null && 'shortMessage' in e 
              ? String(e.shortMessage) 
              : 'Transaction failed');
        } else {
          toast.error(e.message || 'Zap Out transaction failed or rejected.');
        }
        } else {
          toast.error('Zap Out transaction failed or rejected.');
        }
      }
    },
    isPending: isWriting, // True when writeContractAsync is active
    isConfirming: !!hash && !mined && !failed, // True after hash is set and before mined/failed
    hash,
    mined,
    failed,
  }
}