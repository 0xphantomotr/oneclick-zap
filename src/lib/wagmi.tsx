'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { WagmiProvider, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import {
  RainbowKitProvider,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

// Log the environment variables to be sure
const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

console.log('[wagmi.tsx] NEXT_PUBLIC_SEPOLIA_RPC_URL:', rpcUrl);
console.log('[wagmi.tsx] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:', walletConnectProjectId);

if (!rpcUrl) {
  console.error("[wagmi.tsx] CRITICAL ERROR: NEXT_PUBLIC_SEPOLIA_RPC_URL is not defined! Check your .env.local file in the 'oneclick-zap' project.");
  alert("CRITICAL ERROR: Application is not configured correctly. RPC URL is missing. Check console.");
}
if (!walletConnectProjectId) {
  console.warn("[wagmi.tsx] WARNING: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined. WalletConnect might not work as expected.");
}

const config = getDefaultConfig({
  appName: 'One-Click Zap (Sepolia)',
  projectId: walletConnectProjectId!,
  chains: [sepolia],
  transports: { [sepolia.id]: http(rpcUrl) },
  ssr: true
})

const queryClient = new QueryClient()

export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider
      config={config}
      reconnectOnMount={true} // Enable reconnection on page refresh
    >
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
