import React, { useState, useEffect } from 'react';
import type { MempoolBlock } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { CubeIcon } from './icons/CubeIcon';

const NextBlocks: React.FC = () => {
  const [blocks, setBlocks] = useState<MempoolBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMempoolBlocks = async () => {
      try {
        const response = await fetch('https://mempool.space/api/v1/fees/mempool-blocks');
        if (!response.ok) {
          throw new Error('Failed to fetch mempool blocks');
        }
        const data: MempoolBlock[] = await response.json();
        setBlocks(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMempoolBlocks();
    const intervalId = setInterval(fetchMempoolBlocks, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-black p-4 rounded-lg flex items-center justify-center space-x-2">
        <LoadingSpinner className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500">Loading next blocks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black p-4 rounded-lg">
        <p className="text-sm text-center text-red-400">Could not load block data.</p>
      </div>
    );
  }
  
  return (
    <div>
        <h3 className="text-base font-bold text-white mb-2">Next Blocks</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {blocks.slice(0, 3).map((block, index) => (
            <div key={index} className="bg-black p-4 rounded-lg text-center">
            <p className="text-sm font-semibold text-gray-400">~{(index + 1) * 10} min</p>
            <div className="flex justify-center items-center gap-2 my-2">
                <CubeIcon className="w-5 h-5 text-gray-500" />
                <p className="text-xl font-bold text-white">{block.nTx.toLocaleString()}</p>
            </div>
            <p className="text-xs text-gray-600">transactions</p>
            </div>
        ))}
        </div>
    </div>
  );
};

export default NextBlocks;