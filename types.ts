// For the general stats in the header
export interface BlockchainStats {
  blockHeight: number | null;
}

// Represents a transaction in the "Watched" list
export interface WatchedTransaction {
  id: string; // The transaction hash
  status: 'pending' | 'unconfirmed' | 'confirmed';
  confirmations: number;
  blockHeight: number | null; // The block height where it was confirmed
}

// Detailed structure from mempool.space API
export interface ApiTransaction {
  txid: string;
  version: number;
  locktime: number;
  size: number;
  weight: number;
  fee: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address?: string; // May not always exist
      value: number;
    } | null; // For coinbase tx
    scriptsig: string;
    scriptsig_asm: string;
    witness?: string[];
    is_coinbase: boolean;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  }>;
  status: {
    confirmed: boolean;
    block_height: number | null;
    block_hash: string | null;
    block_time: number | null;
  };
}

// Represents a block in the mempool
export interface MempoolBlock {
  blockSize: number;
  blockVSize: number;
  nTx: number;
  totalFee: number;
  feeRange: number[];
}

// Represents the fee recommendation from mempool.space API
export interface FeeRecommendation {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}