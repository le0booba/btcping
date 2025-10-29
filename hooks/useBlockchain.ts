

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BlockchainStats, WatchedTransaction, ApiTransaction } from '../types';

const API_BASE_URL = 'https://mempool.space/api';
const WEBSOCKET_URL = 'wss://mempool.space/api/v1/ws';

export function useBlockchain(isLoggedIn: boolean) {
  const [stats, setStats] = useState<BlockchainStats>({ blockHeight: null });
  const [watchedTxs, setWatchedTxs] = useState<Map<string, WatchedTransaction>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const watchedTxsRef = useRef(watchedTxs);
  watchedTxsRef.current = watchedTxs;
  
  useEffect(() => {
    const loadInitialTransactions = async () => {
        if (!isLoggedIn) {
            setWatchedTxs(new Map());
            setIsDataLoaded(true);
            return;
        }
      try {
        const response = await fetch('/api/transactions');
        if (response.status === 401) { // Not logged in
            setIsDataLoaded(true);
            return;
        }
        if (!response.ok) {
          throw new Error('Could not fetch watched transactions.');
        }
        const txs: WatchedTransaction[] = await response.json();
        setWatchedTxs(new Map(txs.map(tx => [tx.id, tx])));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadInitialTransactions();
  }, [isLoggedIn]);
  
  const sendTelegramNotification = useCallback(async (message: string) => {
    try {
        // First, get the credentials from our secure backend
        const credsResponse = await fetch('/api/settings');
        if(!credsResponse.ok) {
            // Silently fail if settings are not configured on the backend
            if (credsResponse.status === 404 || credsResponse.status === 401) return;
            throw new Error('Could not retrieve Telegram settings.');
        }
        const { chatId, botToken } = await credsResponse.json();

        if (!chatId || !botToken) return;

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.description || 'Telegram API request failed');
        }
    } catch (err) {
        console.error('Failed to send Telegram notification:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Telegram notification failed: ${errorMessage}. Check settings.`);
    }
  }, [setError]);

  const fetchTransaction = useCallback(async (txid: string): Promise<ApiTransaction | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tx/${txid}`);
      if (!response.ok) throw new Error('Transaction not found or API error.');
      return await response.json();
    } catch (err) {
      console.error(`Failed to fetch transaction ${txid}:`, err);
      setError(`Failed to fetch transaction ${txid}. Please check the ID and try again.`);
      return null;
    }
  }, []);
  
  const updateWatchedTx = useCallback((txid: string, updates: Partial<WatchedTransaction>) => {
    setWatchedTxs(prev => {
        const newMap = new Map(prev);
        const existingTx = newMap.get(txid);
        if (existingTx) {
            const updatedTx: WatchedTransaction = { ...existingTx, ...updates };
            newMap.set(txid, updatedTx);
        }
        return newMap;
    });
  }, []);

  const checkConfirmations = useCallback(async (currentBlockHeight: number) => {
    if (!isLoggedIn) return;

    const res = await fetch('/api/settings');
    let notificationLevel = 'first';
    if (res.ok) {
        const settings = await res.json();
        notificationLevel = settings.notificationLevel || 'first';
    }

    for (const [txid, tx] of watchedTxsRef.current.entries()) {
      if (tx.status !== 'confirmed') {
        const fullTx = await fetchTransaction(txid);
        if (fullTx && fullTx.status.confirmed && fullTx.status.block_height) {
          const newConfirmations = currentBlockHeight - fullTx.status.block_height + 1;

          if (newConfirmations === 1 && ['first', 'first_two', 'all'].includes(notificationLevel)) {
              const message = `✅ *Transaction Confirmed!*\n\n*ID:* \`${txid}\`\n*Block:* ${fullTx.status.block_height.toLocaleString()}`;
              sendTelegramNotification(message);
          }

          updateWatchedTx(txid, {
            status: 'confirmed',
            confirmations: newConfirmations,
            block_height: fullTx.status.block_height,
          });
        }
      } else if (tx.block_height) {
        const newConfirmations = currentBlockHeight - tx.block_height + 1;
        if (newConfirmations > tx.confirmations) {
            let shouldNotify = false;
            switch (notificationLevel) {
                case 'first_two':
                    if (newConfirmations === 2) shouldNotify = true;
                    break;
                case 'all':
                    shouldNotify = true;
                    break;
            }

            if (shouldNotify) {
                const message = `➕ *New Confirmation!*\n\n*ID:* \`${txid}\`\n*Total Confirmations:* ${newConfirmations}`;
                sendTelegramNotification(message);
            }
            
            updateWatchedTx(txid, { confirmations: newConfirmations });
        }
      }
    }
  }, [fetchTransaction, updateWatchedTx, sendTelegramNotification, isLoggedIn]);


  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/blocks/tip/height`);
        if (!response.ok) throw new Error('API request for latest block failed');
        const height = parseInt(await response.text(), 10);
        setStats({ blockHeight: height });
        await checkConfirmations(height);
      } catch (err) {
        console.error("Failed to fetch initial block height:", err);
        setError("Failed to load initial blockchain data.");
      }
    };
    fetchInitialData();

    const ws = new WebSocket(WEBSOCKET_URL);
    ws.onopen = () => ws.send(JSON.stringify({ action: 'want', data: ['blocks'] }));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.block) {
        const newBlockHeight = data.block.height;
        setStats({ blockHeight: newBlockHeight });
        checkConfirmations(newBlockHeight);
      }
    };
    ws.onerror = () => setError("WebSocket connection error.");
    
    return () => ws.close();
  }, [checkConfirmations, isDataLoaded]);

  const addTransaction = async (txid: string) => {
    if (!isLoggedIn) {
        setError("Please log in to watch transactions.");
        return;
    }
    setError(null);
    if (!txid || txid.length !== 64 || !/^[a-fA-F0-9]+$/.test(txid)) {
        setError("Invalid transaction ID format.");
        return;
    }
    if (watchedTxs.has(txid)) {
        setError("This transaction is already being watched.");
        return;
    }

    const pendingTx: WatchedTransaction = { id: txid, status: 'pending', confirmations: 0, block_height: null };
    setWatchedTxs(prev => new Map(prev).set(txid, pendingTx));

    const txData = await fetchTransaction(txid);
    if (txData) {
        const confirmations = txData.status.confirmed && txData.status.block_height && stats.blockHeight
            ? stats.blockHeight - txData.status.block_height + 1
            : 0;

        const newTx: WatchedTransaction = {
            id: txid,
            status: confirmations > 0 ? 'confirmed' : 'unconfirmed',
            confirmations,
            block_height: txData.status.block_height,
        };
        
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTx),
            });
            if (!response.ok) throw new Error('Failed to save transaction.');
            updateWatchedTx(txid, newTx);
            if (confirmations > 0) {
              const settingsRes = await fetch('/api/settings');
              let notificationLevel = 'first';
              if (settingsRes.ok) {
                  const settings = await settingsRes.json();
                  notificationLevel = settings.notificationLevel || 'first';
              }
              
              if (notificationLevel !== 'none') {
                const message = `ℹ️ *Now watching a confirmed transaction.*\n\n*ID:* \`${txid}\`\n*Confirmations:* ${confirmations}`;
                sendTelegramNotification(message);
              }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setWatchedTxs(prev => {
                const newMap = new Map(prev);
                newMap.delete(txid);
                return newMap;
            });
        }
    } else {
        setWatchedTxs(prev => {
            const newMap = new Map(prev);
            newMap.delete(txid);
            return newMap;
        });
    }
  };

  const removeTransaction = async (txid: string) => {
    if (!isLoggedIn) return;
    const originalTxs = new Map(watchedTxs);
    setWatchedTxs(prev => {
        const newMap = new Map(prev);
        newMap.delete(txid);
        return newMap;
    });

    try {
        const response = await fetch(`/api/transactions?txid=${txid}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Failed to remove transaction from database.');
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setWatchedTxs(originalTxs);
    }
  };

  return { stats, watchedTxs: Array.from(watchedTxs.values()), addTransaction, removeTransaction, error, setError, sendTelegramNotification };
}