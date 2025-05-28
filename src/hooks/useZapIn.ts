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
import { useEffect, useState } from 'react'

const ZERO = '0x0000000000000000000000000000000000000000'

export function useZapIn() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync, isPending: isWriting } = useWriteContract()

  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const { isSuccess: mined, isError: failed } =
    useWaitForTransactionReceipt({ hash })

  /* toast when tx mines or reverts */
  useEffect(() => {
    if (!hash) return
    if (mined)
      toast.success('Tx mined!', {
        action: {
          label: 'View',
          onClick: () =>
            window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank'),
        },
      })
    if (failed) toast.error('Tx reverted')
  }, [hash, mined, failed])

  async function zapIn(args: {
    tokenIn: `0x${string}`
    tokenA:  `0x${string}`
    tokenB:  `0x${string}`
    amount:  string
    slipBps: number
  }) {
    if (!address)   return toast.error('Connect wallet first')
    if (!publicClient) return toast.error('Client not ready, please retry')

    const amountWei = parseUnits(args.amount, 18) 

    /* 1 — approve if needed */
    if (args.tokenIn !== ZERO) {
      const allowance = (await publicClient.readContract({
        address: args.tokenIn,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, ZAP_ROUTER],
      })) as bigint

      if (allowance < amountWei) {
        toast('Approving token…')
        await writeContractAsync({
          address: args.tokenIn,
          abi: erc20Abi,
          functionName: 'approve',
          args: [ZAP_ROUTER, amountWei],
        })
      }
    }

    /* 2 — zap-in */
    toast.loading('Submitting zap…')
    const txHash = await writeContractAsync({
      address: ZAP_ROUTER,
      abi: routerAbi,
      functionName: 'zapInSingleToken',
      args: [
        args.tokenIn,
        args.tokenA,
        args.tokenB,
        amountWei,
        BigInt(args.slipBps),
        BigInt(Math.floor(Date.now() / 1_000) + 900),
      ],
      value: args.tokenIn === ZERO ? amountWei : 0n,
    })
    setHash(txHash)
    toast.success('Tx sent. Waiting…')
  }

  return { zapIn, isPending: isWriting }
}
