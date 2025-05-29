// mirrors `_optimalSwap(amountIn, reserveIn)` in Solidity
export function optimalSwap(amountIn: bigint, reserveIn: bigint) {
  // constants use BigInt to avoid precision loss
  const num1 = 3988000n
  const num2 = 3988009n
  const num3 = 1997n
  const den  = 1994n

  const a = reserveIn * (amountIn * num1 + reserveIn * num2)
  const sqrt = bigIntSqrt(a)           // helper below
  const toSwap = (sqrt - reserveIn * num3) / den
  return toSwap
}

// integer square-root for bigints
function bigIntSqrt(value: bigint) {
  if (value < 0n) throw new Error('neg')
  if (value < 2n) return value
  let x0 = value / 2n
  let x1 = (x0 + value / x0) / 2n
  while (x1 < x0) {
    x0 = x1
    x1 = (x0 + value / x0) / 2n
  }
  return x0
}

export function estimateLpMint({
  addA, addB, reserveA, reserveB, totalSupply
}: {
  addA: bigint; addB: bigint;
  reserveA: bigint; reserveB: bigint;
  totalSupply: bigint;
}) {
  const share = addA * totalSupply / reserveA
  const shareAlt = addB * totalSupply / reserveB
  return share < shareAlt ? share : shareAlt
}