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
import { parseUnits } from 'viem'
import { useState, useEffect } from 'react'

export function useZapOut() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync, isPending: isWriting } = useWriteContract()

  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const { isSuccess, isError } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!hash) return
    if (isSuccess)
      toast.success('Tx mined!', {
        action: {
          label: 'View',
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank'),
        },
      })
    if (isError) toast.error('Tx reverted')
  }, [hash, isSuccess, isError])

  async function zapOut(args: {
    tokenA:  `0x${string}`
    tokenB:  `0x${string}`
    lpToken: `0x${string}`  // pair address
    amountLp: string        // human-readable
    tokenOut: `0x${string}` // which single token you want
    slipBps: number
  }) {
    if (!address)         return toast.error('Connect wallet first')
    if (!publicClient)    return toast.error('Client not ready, retry')

    const lpWei = parseUnits(args.amountLp, 18) // LP always 18-dec

    /* 1 — allowance */
    const allowance = (await publicClient.readContract({
      address: args.lpToken,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address as `0x${string}`, ZAP_ROUTER],
    })) as bigint

    if (allowance < lpWei) {
      toast('Approving LP token…')
      await writeContractAsync({
        address: args.lpToken,
        abi: erc20Abi,
        functionName: 'approve',
        args: [ZAP_ROUTER, lpWei],
      })
    }

    /* 2 — zap-out */
    toast.loading('Submitting zap-out…')
    const txHash = await writeContractAsync({
      address: ZAP_ROUTER,
      abi: routerAbi,
      functionName: 'zapOutSingleToken',
      args: [
        args.tokenA,
        args.tokenB,
        lpWei,
        args.tokenOut,
        BigInt(args.slipBps),
        0n,
        BigInt(Math.floor(Date.now() / 1_000) + 900),
        false
      ],
    })
    setHash(txHash)
    toast.success('Tx sent. Waiting…')
  }

  return { zapOut, isPending: isWriting }
}