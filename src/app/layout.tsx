import './globals.css'
import { Web3Providers } from '@/lib/wagmi'
import { NavBar } from '@/components/nav-bar'
import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Web3Providers>
          <NavBar />
          {children}
        </Web3Providers>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}