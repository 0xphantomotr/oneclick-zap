import './globals.css'
import { Web3Providers } from '@/lib/wagmi'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  )
}