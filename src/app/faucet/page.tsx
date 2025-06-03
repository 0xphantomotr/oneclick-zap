'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { supportedPairs } from '@/data/pairs'
import { useTokenBalance } from '@/hooks/useTokenBalance'

// Faucet contract ABI - simplified for our specific faucet
const faucetAbi = [
  {
    "inputs": [],
    "name": "requestTDAI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestTUSDC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "address", "name": "token", "type": "address"}],
    "name": "canRequestToken",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "address", "name": "token", "type": "address"}],
    "name": "timeUntilNextRequest",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TDAI",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TUSDC",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Your deployed faucet contract address
const FAUCET_ADDRESS = '0x6372F002f27141778Dd761e8F9185590Ce4b078c' as `0x${string}`;

export default function FaucetPage() {
  const { address, isConnected } = useAccount()
  const [isRequestingTDAI, setIsRequestingTDAI] = useState(false)
  const [isRequestingTUSDC, setIsRequestingTUSDC] = useState(false)
  
  // Get tokens from the first pair
  const pair = supportedPairs[0]
  const tokenA = pair?.tokenA
  const tokenB = pair?.tokenB
  
  // Get token addresses from faucet contract
  const { data: tdaiAddress } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: faucetAbi,
    functionName: 'TDAI',
  })
  
  const { data: tusdcAddress } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: faucetAbi,
    functionName: 'TUSDC',
  })
  
  // Get token balances
  const { formattedBalance: tokenABalance, refetch: refetchTokenA } = 
    useTokenBalance(tokenA?.address as `0x${string}`, tokenA?.decimals)
  const { formattedBalance: tokenBBalance, refetch: refetchTokenB } = 
    useTokenBalance(tokenB?.address as `0x${string}`, tokenB?.decimals)
  
  // Check if user can request tokens
  const { data: canRequestTDAI, refetch: refetchCanRequestTDAI } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: faucetAbi,
    functionName: 'canRequestToken',
    args: address && tdaiAddress ? [address, tdaiAddress] : undefined,
    query: {
      enabled: isConnected && !!address && !!tdaiAddress
    }
  })
  
  const { data: canRequestTUSDC, refetch: refetchCanRequestTUSDC } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: faucetAbi,
    functionName: 'canRequestToken',
    args: address && tusdcAddress ? [address, tusdcAddress] : undefined,
    query: {
      enabled: isConnected && !!address && !!tusdcAddress
    }
  })
  
  // Get time until next request
  const { data: timeUntilNextTDAI, refetch: refetchTimeTDAI } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: faucetAbi,
    functionName: 'timeUntilNextRequest',
    args: address && tdaiAddress ? [address, tdaiAddress] : undefined,
    query: {
      enabled: isConnected && !!address && !!tdaiAddress
    }
  })
  
  const { data: timeUntilNextTUSDC, refetch: refetchTimeTUSDC } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: faucetAbi,
    functionName: 'timeUntilNextRequest',
    args: address && tusdcAddress ? [address, tusdcAddress] : undefined,
    query: {
      enabled: isConnected && !!address && !!tusdcAddress
    }
  })
  
  const { writeContractAsync } = useWriteContract()
  
  // Update cooldown timers
  useEffect(() => {
    if (!isConnected || !address) return;
    
    const interval = setInterval(() => {
      refetchCanRequestTDAI();
      refetchCanRequestTUSDC();
      refetchTimeTDAI();
      refetchTimeTUSDC();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isConnected, address, refetchCanRequestTDAI, refetchCanRequestTUSDC, refetchTimeTDAI, refetchTimeTUSDC]);
  
  // Format time remaining
  const formatTimeRemaining = (seconds: bigint | undefined) => {
    if (!seconds || seconds === 0n) return "Available now";
    
    const totalSeconds = Number(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };
  
  const requestTDAI = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsRequestingTDAI(true);
      
      // Call the faucet contract
      await writeContractAsync({
        address: FAUCET_ADDRESS,
        abi: faucetAbi,
        functionName: 'requestTDAI',
      });
      
      toast.success(`Successfully requested TDAI!`);
      
      // Refetch balances and cooldowns after a short delay
      setTimeout(() => {
        refetchTokenA();
        refetchCanRequestTDAI();
        refetchTimeTDAI();
      }, 3000);
    } catch (error) {
      console.error("Error requesting TDAI:", error);
      toast.error(`Failed to request TDAI. Try again later.`);
    } finally {
      setIsRequestingTDAI(false);
    }
  };
  
  const requestTUSDC = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsRequestingTUSDC(true);
      
      // Call the faucet contract
      await writeContractAsync({
        address: FAUCET_ADDRESS,
        abi: faucetAbi,
        functionName: 'requestTUSDC',
      });
      
      toast.success(`Successfully requested TUSDC!`);
      
      // Refetch balances and cooldowns after a short delay
      setTimeout(() => {
        refetchTokenB();
        refetchCanRequestTUSDC();
        refetchTimeTUSDC();
      }, 3000);
    } catch (error) {
      console.error("Error requesting TUSDC:", error);
      toast.error(`Failed to request TUSDC. Try again later.`);
    } finally {
      setIsRequestingTUSDC(false);
    }
  };
  
  return (
    <section className="mx-auto max-w-md space-y-6 py-10">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Test Token Faucet</h1>
        <p className="text-muted-foreground">
          Get test tokens to try OneClick Zap on Sepolia testnet
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Tokens</CardTitle>
          <CardDescription>
            Request test tokens to use with the OneClick Zap application.
            Each request gives you 100 tokens. Limited to one request per token per day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* TDAI */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {tokenA?.logo && (
                <Image 
                  src={tokenA.logo} 
                  width={32} 
                  height={32} 
                  className="rounded-full" 
                  alt={`${tokenA.symbol} logo`}
                />
              )}
              <div>
                <h3 className="font-medium">{tokenA?.symbol}</h3>
                <p className="text-sm text-muted-foreground">Balance: {tokenABalance}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeRemaining(timeUntilNextTDAI)}
                </p>
              </div>
            </div>
            <Button 
              onClick={requestTDAI}
              disabled={!isConnected || isRequestingTDAI || !canRequestTDAI}
              size="sm"
            >
              {isRequestingTDAI ? 'Requesting...' : `Get ${tokenA?.symbol}`}
            </Button>
          </div>
          
          {/* TUSDC */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {tokenB?.logo && (
                <Image 
                  src={tokenB.logo} 
                  width={32} 
                  height={32} 
                  className="rounded-full" 
                  alt={`${tokenB.symbol} logo`}
                />
              )}
              <div>
                <h3 className="font-medium">{tokenB?.symbol}</h3>
                <p className="text-sm text-muted-foreground">Balance: {tokenBBalance}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeRemaining(timeUntilNextTUSDC)}
                </p>
              </div>
            </div>
            <Button 
              onClick={requestTUSDC}
              disabled={!isConnected || isRequestingTUSDC || !canRequestTUSDC}
              size="sm"
            >
              {isRequestingTUSDC ? 'Requesting...' : `Get ${tokenB?.symbol}`}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">How to use the faucet</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Connect your wallet using the button in the top right</li>
          <li>Click the "Get [Token]" button for each token you want</li>
          <li>Approve the transaction in your wallet</li>
          <li>Wait for confirmation (this may take a few seconds)</li>
          <li>Once you have tokens, return to the main app to try zapping!</li>
        </ol>
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Note: These are test tokens on Sepolia testnet and have no real value.</p>
        <p className="mt-1">
          <Link href="/docs" className="text-blue-500 hover:underline">
            Learn more about OneClick Zap
          </Link>
        </p>
      </div>
    </section>
  );
} 