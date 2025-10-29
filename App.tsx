import React, { useState } from 'react';
import Header from './components/Header';
import TransactionInput from './components/TransactionInput';
import TransactionList from './components/TransactionList';
import TransactionDetails from './components/TransactionDetails';
import { useBlockchain } from './hooks/useBlockchain';
import { XCircleIcon } from './components/icons/XCircleIcon';
import TelegramSettings from './components/TelegramSettings';
import FeeChart from './components/FeeChart';

function App() {
  const { stats, watchedTxs, addTransaction, removeTransaction, error, setError, sendTelegramNotification } = useBlockchain();
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const handleRemoveTransaction = (txid: string) => {
    if (selectedTxId === txid) {
      setSelectedTxId(null);
    }
    removeTransaction(txid);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header stats={stats} />
        
        {error && (
          <div className="relative bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg my-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-red-500/20">
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <TransactionInput onAddTransaction={addTransaction} />
            <TelegramSettings />
            <FeeChart />
            <TransactionList
              transactions={watchedTxs}
              selectedTxId={selectedTxId}
              onSelectTransaction={setSelectedTxId}
              onRemoveTransaction={handleRemoveTransaction}
            />
          </div>
          <div className="lg:col-span-2">
            <TransactionDetails 
              txId={selectedTxId} 
              blockHeight={stats.blockHeight} 
              sendTelegramNotification={sendTelegramNotification} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;