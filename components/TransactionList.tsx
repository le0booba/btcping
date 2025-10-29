import React from 'react';
import type { WatchedTransaction } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { TrashIcon } from './icons/TrashIcon';

interface TransactionListProps {
  transactions: WatchedTransaction[];
  selectedTxId: string | null;
  onSelectTransaction: (txid: string) => void;
  onRemoveTransaction: (txid: string) => void;
}

const TransactionItem: React.FC<{ 
  tx: WatchedTransaction; 
  isSelected: boolean; 
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void; 
}> = ({ tx, isSelected, onSelect, onRemove }) => {
  const statusIcon = () => {
    switch (tx.status) {
      case 'pending':
        return <LoadingSpinner className="h-5 w-5 text-gray-600" />;
      case 'unconfirmed':
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-white" />;
      default:
        return null;
    }
  };

  const statusText = () => {
    if (tx.status === 'confirmed') {
      return `${tx.confirmations} Confirmation${tx.confirmations > 1 ? 's' : ''}`;
    }
    return tx.status.charAt(0).toUpperCase() + tx.status.slice(1);
  };

  return (
    <li
      onClick={onSelect}
      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center border ${
        isSelected ? 'bg-gray-800 border-white' : 'bg-[#181818] hover:bg-gray-900 border-gray-800'
      }`}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-mono text-sm truncate text-gray-300">{tx.id}</p>
        <div className="flex items-center gap-2 text-xs mt-1">
          {statusIcon()}
          <span className={`${tx.status === 'confirmed' ? 'text-white' : 'text-gray-400'}`}>{statusText()}</span>
        </div>
      </div>
      <button 
        onClick={onRemove} 
        className="p-2 rounded-full hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
        aria-label={`Remove transaction ${tx.id}`}
        >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  );
};


const TransactionList: React.FC<TransactionListProps> = ({ transactions, selectedTxId, onSelectTransaction, onRemoveTransaction }) => {
  return (
    <div className="bg-[#111111] border border-gray-800 p-5 rounded-lg flex-grow">
      <h2 className="text-lg font-semibold mb-4 text-white">Watched Transactions</h2>
      {transactions.length > 0 ? (
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {transactions.map(tx => (
            <TransactionItem
              key={tx.id}
              tx={tx}
              isSelected={tx.id === selectedTxId}
              onSelect={() => onSelectTransaction(tx.id)}
              onRemove={(e) => {
                e.stopPropagation(); // Prevent selection when removing
                onRemoveTransaction(tx.id);
              }}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>No transactions are being watched.</p>
          <p className="text-sm">Add a TXID to begin.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;