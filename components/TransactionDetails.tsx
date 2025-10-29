import React, { useState, useEffect, useCallback } from 'react';
import type { ApiTransaction } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import NextBlocks from './NextBlocks';

interface TransactionDetailsProps {
  txId: string | null;
  blockHeight: number | null;
  sendTelegramNotification: (message: string) => Promise<void>;
}

const satsToBtc = (sats: number) => (sats / 100_000_000).toFixed(8);

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


const TransactionDetails: React.FC<TransactionDetailsProps> = ({ txId, blockHeight, sendTelegramNotification }) => {
  const [transaction, setTransaction] = useState<ApiTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTelegramConfigured, setIsTelegramConfigured] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'sending' | 'sent' | null>(null);
  const [countdown, setCountdown] = useState(600);
  
  useEffect(() => {
    const checkTelegramConfig = () => {
      const chatId = localStorage.getItem('telegramChatId');
      const botToken = localStorage.getItem('telegramBotToken');
      setIsTelegramConfigured(!!chatId && !!botToken);
    };
    checkTelegramConfig();
    
    // Listen for storage changes to update button state
    window.addEventListener('storage', checkTelegramConfig);
    return () => window.removeEventListener('storage', checkTelegramConfig);
  }, []);

  const fetchDetails = useCallback(async () => {
    if (!txId) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setTransaction(null);
    try {
      const response = await fetch(`https://mempool.space/api/tx/${txId}`);
      if (!response.ok) throw new Error('Failed to fetch transaction details.');
      const data = await response.json();
      setTransaction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [txId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    setCountdown(600); // Reset timer on transaction change

    if (transaction && !transaction.status.confirmed) {
      const intervalId = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 600));
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [txId, transaction?.status.confirmed]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy text: ', err));
  };

  const handleSendNow = async () => {
    if (!transaction) return;
    setNotificationStatus('sending');
    const isConfirmed = transaction.status.confirmed;
    const confirmations = transaction.status.block_height && blockHeight ? blockHeight - transaction.status.block_height + 1 : 0;
    const totalOutput = transaction.vout.reduce((sum, o) => sum + o.value, 0);

    const message = `
*Manual Transaction Update* 🔔

*ID:* \`${transaction.txid}\`
*Status:* ${isConfirmed ? '✅ Confirmed' : '⏳ Unconfirmed'}
*Confirmations:* ${confirmations > 0 ? confirmations.toLocaleString() : '0'}
*Block:* ${transaction.status.block_height?.toLocaleString() || 'Mempool'}
*Fee:* ${satsToBtc(transaction.fee)} BTC
*Total Output:* ${satsToBtc(totalOutput)} BTC
    `.trim();

    await sendTelegramNotification(message);
    setNotificationStatus('sent');
    setTimeout(() => setNotificationStatus(null), 3000);
  };

  if (!txId) {
    return (
      <div className="h-full flex items-center justify-center bg-[#111111] border border-gray-800 rounded-lg p-5">
        <p className="text-gray-600">Select a transaction to see details</p>
      </div>
    );
  }

  if (isLoading && !transaction) {
    return (
      <div className="h-full flex items-center justify-center bg-[#111111] border border-gray-800 rounded-lg p-5">
        <LoadingSpinner className="h-8 w-8 text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#111111] border border-gray-800 rounded-lg p-5">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!transaction) return null;
  
  const confirmations = transaction.status.confirmed && transaction.status.block_height && blockHeight ? blockHeight - transaction.status.block_height + 1 : 0;
  const isConfirmed = confirmations > 0;
  const totalOutput = transaction.vout.reduce((sum, o) => sum + o.value, 0);

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-6 shadow-lg space-y-6 max-h-[85vh] overflow-y-auto">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-bold text-white">Transaction Details</h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm text-gray-500 break-all">
              {transaction.txid}
              <ClipboardIcon className="h-4 w-4 text-gray-600 hover:text-white cursor-pointer flex-shrink-0" onClick={() => copyToClipboard(transaction.txid)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-300 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={handleSendNow}
              disabled={!isTelegramConfigured || notificationStatus === 'sending'}
              title={!isTelegramConfigured ? "Configure Telegram settings first" : "Send current details via Telegram"}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {notificationStatus === 'sending' ? 'Sending...' : (notificationStatus === 'sent' ? 'Sent!' : 'Send Now')}
            </button>
            <button 
              onClick={fetchDetails} 
              disabled={isLoading} 
              className="p-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh transaction details"
            >
                <ArrowPathIcon className={`h-5 w-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      {!isConfirmed && <NextBlocks />}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-black p-3 rounded-md">
              <p className="text-gray-500 text-xs">Status</p>
              <p className={`font-bold text-lg ${isConfirmed ? 'text-white' : 'text-gray-400'}`}>{isConfirmed ? "Confirmed" : "Unconfirmed"}</p>
          </div>
          <div className="bg-black p-3 rounded-md">
              <p className="text-gray-500 text-xs">Confirmations</p>
              <p className="font-bold text-lg text-white">{confirmations > 0 ? confirmations.toLocaleString() : "0"}</p>
          </div>
          {!isConfirmed && (
            <div className="bg-black p-3 rounded-md">
                <p className="text-gray-500 text-xs">Next Block In</p>
                <p className="font-bold text-lg font-mono text-white">{formatTime(countdown)}</p>
            </div>
          )}
           <div className="bg-black p-3 rounded-md">
              <p className="text-gray-500 text-xs">Block</p>
              <p className="font-bold text-lg text-white">{transaction.status.block_height?.toLocaleString() || 'Mempool'}</p>
          </div>
           <div className="bg-black p-3 rounded-md">
              <p className="text-gray-500 text-xs">Fee (BTC)</p>
              <p className="font-bold text-lg font-mono text-white">{satsToBtc(transaction.fee)}</p>
          </div>
           <div className="bg-black p-3 rounded-md">
              <p className="text-gray-500 text-xs">Total Output (BTC)</p>
              <p className="font-bold text-lg font-mono text-white">{satsToBtc(totalOutput)}</p>
          </div>
          <div className="bg-black p-3 rounded-md">
              <p className="text-gray-500 text-xs">Size</p>
              <p className="font-bold text-lg text-white">{transaction.size.toLocaleString()} vB</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <h3 className="font-semibold text-white mb-2">Inputs ({transaction.vin.length})</h3>
              <ul className="space-y-2 text-xs">
                  {transaction.vin.map((input, index) => (
                      <li key={index} className="bg-black p-3 rounded-md">
                        {input.is_coinbase ? (
                          <p className="text-gray-500">Coinbase (New Coins)</p>
                        ) : (
                          <>
                            <p className="font-mono break-all text-gray-400">{input.prevout?.scriptpubkey_address || 'Unknown Input'}</p>
                            <p className="text-white">{satsToBtc(input.prevout?.value || 0)} BTC</p>
                          </>
                        )}
                      </li>
                  ))}
              </ul>
          </div>
          <div>
              <h3 className="font-semibold text-white mb-2">Outputs ({transaction.vout.length})</h3>
              <ul className="space-y-2 text-xs">
                  {transaction.vout.map((output, index) => (
                      <li key={index} className="bg-black p-3 rounded-md">
                          <p className="font-mono break-all text-gray-400">{output.scriptpubkey_address || 'Unknown Output'}</p>
                          <p className="font-semibold text-white">
                              {satsToBtc(output.value)} BTC
                          </p>
                      </li>
                  ))}
              </ul>
          </div>
      </div>
    </div>
  );
};

export default TransactionDetails;