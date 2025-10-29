
import React, { useState } from 'react';

interface TransactionInputProps {
  onAddTransaction: (txid: string) => void;
  disabled: boolean;
}

const TransactionInput: React.FC<TransactionInputProps> = ({ onAddTransaction, disabled }) => {
  const [txid, setTxid] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (txid.trim()) {
      setIsLoading(true);
      await onAddTransaction(txid.trim());
      setTxid('');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-gray-800 p-5 rounded-lg">
      <h2 className="text-lg font-semibold mb-3 text-white">Watch a New Transaction</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          placeholder={disabled ? "Please log in to watch a transaction" : "Enter Transaction ID (TXID)"}
          className="flex-grow bg-black border border-gray-700 rounded-md px-4 py-2 focus:ring-2 focus:ring-white focus:outline-none transition-shadow text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading || disabled}
        />
        <button
          type="submit"
          disabled={isLoading || !txid.trim() || disabled}
          className="bg-white text-black font-bold px-4 py-2 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Adding...' : 'Watch Transaction'}
        </button>
      </form>
    </div>
  );
};

export default TransactionInput;
