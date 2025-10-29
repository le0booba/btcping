import React, { useState, useEffect } from 'react';
import type { FeeRecommendation } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { TagIcon } from './icons/TagIcon';

const FeeChart: React.FC = () => {
  const [fees, setFees] = useState<FeeRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const response = await fetch('https://mempool.space/api/v1/fees/recommended');
        if (!response.ok) {
          throw new Error('Failed to fetch fee recommendations.');
        }
        const data: FeeRecommendation = await response.json();
        setFees(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFees();
    const intervalId = setInterval(fetchFees, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, []);

  const FeeBar = ({ priority, sats, color }: { priority: string; sats: number; color: string }) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{priority}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-white">{sats}</span>
        <span className="text-gray-500">sat/vB</span>
      </div>
    </div>
  );

  return (
    <div className="bg-[#111111] border border-gray-800 p-5 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <TagIcon className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-white">Recommended Fees</h2>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-24">
            <LoadingSpinner className="w-6 h-6 text-gray-500" />
        </div>
      ) : error ? (
        <div className="text-center text-red-400 text-sm h-24 flex items-center justify-center">
            <p>Could not load fee data.</p>
        </div>
      ) : fees ? (
        <div className="space-y-3">
          <FeeBar priority="High Priority" sats={fees.fastestFee} color="bg-green-500" />
          <FeeBar priority="Medium Priority" sats={fees.halfHourFee} color="bg-yellow-500" />
          <FeeBar priority="Low Priority" sats={fees.hourFee} color="bg-blue-500" />
          <FeeBar priority="No Priority" sats={fees.economyFee} color="bg-purple-500" />
        </div>
      ) : null}
    </div>
  );
};

export default FeeChart;
