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
import { useEffect, useState } from 'react'
import { sepolia } from 'wagmi/chains'

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
          onClick: () => {
            const baseUrl = sepolia.blockExplorers.default.url
            window.open(`${baseUrl}/tx/${hash}`, '_blank')
          },
        },
      })
    if (failed) toast.error('Tx reverted')
  }, [hash, mined, failed])

  async function zapIn(args: {
    tokenIn: `0x${string}`
    tokenA:  `0x${string}`
    tokenB:  `0x${string}`
    amountWei: bigint
    slipBps: number
    lpMin: bigint
  }) {
    if (!address)   return toast.error('Connect wallet first')
    if (!publicClient) return toast.error('Client not ready, please retry')

    /* 1 — approve if needed */
    if (args.tokenIn !== ZERO) {
      const allowance = (await publicClient.readContract({
        address: args.tokenIn,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, ZAP_ROUTER],
      })) as bigint

      if (allowance < args.amountWei) {
        toast('Approving token…')
        const approveHash = await writeContractAsync({
          address: args.tokenIn,
          abi: erc20Abi,
          functionName: 'approve',
          args: [ZAP_ROUTER, args.amountWei],
        })

        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }
    }

    /* 2 — zap-in */
    const loadingToastId = toast.loading('Submitting zap…')
    const txHash = await writeContractAsync({
      address: ZAP_ROUTER,
      abi: routerAbi,
      functionName: 'zapInSingleToken',
      args: [
        args.tokenIn,
        args.tokenA,
        args.tokenB,
        args.amountWei,
        BigInt(args.slipBps),
        args.lpMin,
        BigInt(Math.floor(Date.now() / 1_000) + 900),
        false
      ],
      value: args.tokenIn === ZERO ? args.amountWei : 0n,
    })
    toast.dismiss(loadingToastId)
    setHash(txHash)
  }

  return {
    zapIn: async (args: Parameters<typeof zapIn>[0]) => {
      try {
        await zapIn(args);
        if (hash) {
          toast.success('Tx sent. Waiting for confirmation…')
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (typeof error === 'object' && error !== null && 'shortMessage' in error) {
            toast.error(String(error.shortMessage));
          } else {
            toast.error('Transaction failed');
          }
        } else {
          toast.error('Transaction failed');
        }
      }
    },
    isPending: isWriting,
    isConfirming: !!hash && !mined && !failed,
    hash,
    mined,
    failed
  }
}
