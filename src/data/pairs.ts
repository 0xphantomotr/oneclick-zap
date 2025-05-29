export type Address = `0x${string}`

export const supportedPairs = [
  {
    address: '0xd7A2e3353a6991f84ee2D36B797cd339dBd168A4' as Address,
    symbol: 'TDAI / TUSDC',
    tokenA: {
      address: '0x910dc45Db5d5793D01E4FdaDb436e1725c46B106' as Address,
      symbol: 'TDAI',
      decimals: 18,
      logo: '/tokens/tdai.svg',
    },
    tokenB: {
      address: '0xd3d3572D189E29F29b3A8814b2066EdaB802d0f1' as Address,
      symbol: 'TUSDC',
      decimals: 6,
      logo: '/tokens/tusdc.svg',
    },
  },
] as const
