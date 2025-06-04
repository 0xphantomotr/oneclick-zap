'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DocumentationPage() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">OneClick Zap Documentation</h1>
        <Link href="/">
          <Button variant="outline">Back to App</Button>
        </Link>
      </div>

      <div className="prose prose-slate max-w-none">
        <section id="overview" className="mb-10">
          <h2 className="text-3xl font-bold mb-4">Overview</h2>
          <p className="mb-4">
            OneClick Zap is a modern web application that simplifies the process of providing and removing liquidity on Uniswap V2 pools. 
            It provides an intuitive interface for users to &quot;zap&quot; into or out of liquidity pools using a single token, 
            eliminating the need to manually balance token pairs or perform multiple transactions.
          </p>
          <p>
            The application interacts with the <code>Univ2ZapRouter</code> smart contract to handle the complex swap and liquidity operations 
            behind the scenes, making DeFi more accessible to users of all experience levels.
          </p>
        </section>

        <section id="key-features" className="mb-10">
          <h2 className="text-3xl font-bold mb-4">Key Features</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Single Token Zap-In:</strong> Add liquidity to a Uniswap V2 pair using just one token (ETH or ERC20)
              <ul className="list-circle pl-6 mt-1">
                <li>Automatically calculates the optimal swap amount to maximize LP tokens received</li>
                <li>Handles all necessary token approvals and transactions</li>
              </ul>
            </li>
            <li>
              <strong>Single Token Zap-Out:</strong> Remove liquidity and receive a single token of your choice
              <ul className="list-circle pl-6 mt-1">
                <li>Withdraws both tokens from the pair and swaps one into your desired output token</li>
                <li>Simplifies the exit process from liquidity positions</li>
              </ul>
            </li>
            <li>
              <strong>Real-time Previews:</strong> See exactly what you&apos;ll receive before confirming any transaction
              <ul className="list-circle pl-6 mt-1">
                <li>Estimated LP tokens for zap-in operations</li>
                <li>Estimated token amounts for zap-out operations</li>
              </ul>
            </li>
            <li>
              <strong>Balance Tracking:</strong> Displays your token balances to help you make informed decisions
            </li>
            <li>
              <strong>Slippage Protection:</strong> Built-in 0.5% slippage tolerance to protect your transactions
            </li>
          </ul>
        </section>

        <section id="how-it-works" className="mb-10">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          
          <h3 className="text-2xl font-semibold mt-6 mb-3">Zap In Process</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Select Pair:</strong> Choose the liquidity pool you want to provide liquidity to</li>
            <li><strong>Choose Input Token:</strong> Select which token you want to use (currently supports using tokenA)</li>
            <li><strong>Enter Amount:</strong> Specify how much of the token you want to contribute</li>
            <li><strong>Review Preview:</strong> See the optimal swap amount and estimated LP tokens you&apos;ll receive</li>
            <li><strong>Confirm Transaction:</strong> Approve token usage if needed, then confirm the zap-in transaction</li>
          </ol>
          <p className="mt-4">
            The application will:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Calculate the optimal amount to swap to balance the pair ratio</li>
            <li>Perform the necessary swap</li>
            <li>Add liquidity to the pool</li>
            <li>Return LP tokens to your wallet</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6 mb-3">Zap Out Process</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Select Pair:</strong> Choose the liquidity pool you want to exit</li>
            <li><strong>Choose Output Token:</strong> Select which token you want to receive (tokenA or tokenB)</li>
            <li><strong>Enter LP Amount:</strong> Specify how many LP tokens you want to redeem</li>
            <li><strong>Review Preview:</strong> See the estimated amount of tokens you&apos;ll receive</li>
            <li><strong>Confirm Transaction:</strong> Approve LP token usage if needed, then confirm the zap-out transaction</li>
          </ol>
          <p className="mt-4">
            The application will:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Remove liquidity from the pool</li>
            <li>Swap one token for the other as needed</li>
            <li>Send the combined amount to your wallet</li>
          </ul>
        </section>

        <section id="mathematical-approach" className="mb-10">
          <h2 className="text-3xl font-bold mb-4">Mathematical Approach</h2>
          
          <h3 className="text-2xl font-semibold mt-6 mb-3">Optimal Swap Calculation</h3>
          <p className="mb-4">
            The application uses the following formula to calculate the optimal swap amount:
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto mb-4">
            <code>toSwap = (sqrt(reserveIn * (amountIn * 3988000 + reserveIn * 3988009)) - reserveIn * 1997) / 1994</code>
          </div>
          <p>
            This formula ensures that after the swap, the ratio of your remaining input token to the received swap token 
            will match the updated pool ratio, maximizing the LP tokens you receive.
          </p>

          <h3 className="text-2xl font-semibold mt-6 mb-3">LP Token Estimation</h3>
          <p className="mb-4">
            For estimating LP tokens minted:
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto mb-4">
            <code>
              share = min(<br />
              &nbsp;&nbsp;(addedAmountA * totalSupply) / reserveA,<br />
              &nbsp;&nbsp;(addedAmountB * totalSupply) / reserveB<br />
              )
            </code>
          </div>
          <p>
            Where:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><code>addedAmountA</code> and <code>addedAmountB</code> are the amounts of tokens being added to the pool</li>
            <li><code>reserveA</code> and <code>reserveB</code> are the current reserves in the pool</li>
            <li><code>totalSupply</code> is the current total supply of LP tokens</li>
          </ul>
        </section>

        <section id="faq" className="mb-10">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">What is &quot;zapping&quot; into a liquidity pool?</h3>
              <p>
                &quot;Zapping&quot; refers to the process of entering or exiting a liquidity pool using a single token instead of 
                the traditional method that requires balanced amounts of both tokens in the pair. OneClick Zap handles 
                all the necessary swaps and liquidity operations in a single transaction.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Why would I use OneClick Zap instead of adding liquidity directly?</h3>
              <p>
                OneClick Zap simplifies the process by requiring only one token and handling all the necessary swaps 
                automatically. This saves time and potentially reduces gas costs compared to performing multiple 
                transactions manually.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">How is the optimal swap amount calculated?</h3>
              <p>
                The optimal swap amount is calculated using a mathematical formula derived from the Uniswap V2 constant 
                product formula, accounting for the 0.3% swap fee. This calculation aims to maximize the amount of LP 
                tokens you receive by finding the ideal balance between the two tokens in the pair.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Is there a fee for using OneClick Zap?</h3>
              <p>
                OneClick Zap itself doesn&apos;t charge any additional fees beyond the standard Uniswap 0.3% swap fee and 
                network gas costs. The application is designed to be as cost-efficient as possible.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">What networks are supported?</h3>
              <p>
                Currently, OneClick Zap is deployed on the Sepolia testnet. Support for additional networks is planned 
                for future releases.
              </p>
            </div>
          </div>
        </section>

        <section id="technical-details" className="mb-10">
          <h2 className="text-3xl font-bold mb-4">Technical Details</h2>
          
          <h3 className="text-2xl font-semibold mt-6 mb-3">Smart Contract</h3>
          <p className="mb-4">
            OneClick Zap interacts with the <code>Univ2ZapRouter</code> smart contract, which is designed to simplify 
            liquidity provision and removal on Uniswap V2. The contract handles the necessary swaps and liquidity 
            operations, aiming to maximize the LP tokens received by the user.
          </p>
          <p>
            The contract is deployed at: <code>0xe42986E893d87E9160EaD9b598E67d52FBCECb12</code> on Sepolia testnet.
          </p>

          <h3 className="text-2xl font-semibold mt-6 mb-3">Technical Stack</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Frontend:</strong> Next.js 14 with App Router, React, TypeScript</li>
            <li><strong>Styling:</strong> Tailwind CSS with shadcn/ui components</li>
            <li><strong>Web3 Integration:</strong> wagmi, viem, RainbowKit</li>
            <li><strong>Smart Contract Interaction:</strong> Univ2ZapRouter (Solidity)</li>
            <li><strong>State Management:</strong> React hooks and context</li>
            <li><strong>Deployment:</strong> Vercel (frontend), Sepolia testnet (smart contracts)</li>
          </ul>
        </section>

        <section id="disclaimer" className="mb-10">
          <h2 className="text-3xl font-bold mb-4">Disclaimer</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
            <p className="mb-2">
              This is experimental software and is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
            </p>
            <p className="mb-2">
              Interacting with DeFi protocols carries inherent risks. Always do your own research and exercise caution.
            </p>
            <p>
              The authors are not responsible for any losses incurred while using this application.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            © 2025 OneClick Zap. All rights reserved.
          </p>
          <Link href="/">
            <Button variant="outline">Back to App</Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 