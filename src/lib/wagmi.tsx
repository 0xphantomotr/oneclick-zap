'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { WagmiProvider, http } from 'wagmi'
import { mainnet, sepolia} from 'wagmi/chains'
import {
  RainbowKitProvider,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const config = getDefaultConfig({
  appName: 'One-Click Zap (Sepolia)',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [sepolia],
  transports: { [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL) },
})

const queryClient = new QueryClient()

export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
