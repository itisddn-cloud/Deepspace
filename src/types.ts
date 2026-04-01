export interface Asset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  color: string;
  price: number; // Mock price in USD
  networks: string[];
}

export interface SwapData {
  txId: string;
  fromAsset: Asset;
  toAsset: Asset;
  fromAmount: string;
  toAmount: string;
  receivingAddress: string;
  fromNetwork: string;
  toNetwork: string;
}

export interface Transaction extends SwapData {
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

export type AppStep = 'swap' | 'deposit' | 'pending' | 'history';
