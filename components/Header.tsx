import React from 'react';
import type { BlockchainStats } from '../types';
import { BtcIcon } from './icons/BtcIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface HeaderProps {
  stats: BlockchainStats;
}

const Header: React.FC<HeaderProps> = ({ stats }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <BtcIcon className="h-10 w-10 text-white" />
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">BTC Transaction Tracker</h1>
            <p className="text-gray-500 text-sm">Real-time Bitcoin transaction monitoring</p>
        </div>
      </div>
      <div className="flex items-center gap-4 bg-[#111111] border border-gray-800 px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Current Block:</span>
            {stats.blockHeight ? (
                <span className="font-mono font-bold text-white">{stats.blockHeight.toLocaleString()}</span>
            ) : (
                <LoadingSpinner className="h-5 w-5 text-white" />
            )}
        </div>
        <div className="border-l border-gray-800 h-6"></div>
         <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Next Block:</span>
            <span className="font-mono font-bold text-white">~10 min</span>
        </div>
      </div>
    </header>
  );
};

export default Header;