'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { WagmiProvider, http } from 'wagmi'
import { mainnet, sepolia /* remove holesky if it errors */ } from 'wagmi/chains'
import {
  RainbowKitProvider,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

/** ⚠️  Put this in `.env.local` (public key is fine for client) */
const config = getDefaultConfig({
  appName: 'One-Click Zap',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, sepolia /*, holesky*/],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    // [holesky.id]: http(),
  },
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
