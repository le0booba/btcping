import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './icons/LoadingSpinner';

const TelegramSettings: React.FC = () => {
  const [chatId, setChatId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [notificationLevel, setNotificationLevel] = useState('first');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setChatId(data.chatId || '');
          setBotToken(data.botToken || '');
          setNotificationLevel(data.notificationLevel || 'first');
        } else if (response.status !== 404) {
           console.error('Failed to fetch settings');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, botToken, notificationLevel }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Dispatch a storage event so other components (like TransactionDetails) can react
      window.dispatchEvent(new Event('storage'));

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('idle');
      // Here you might want to show an error message to the user
    }
  };

  if (isLoading) {
    return (
        <div className="bg-[#111111] border border-gray-800 p-5 rounded-lg flex justify-center items-center h-56">
            <LoadingSpinner className="h-6 w-6 text-gray-500" />
        </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-gray-800 p-5 rounded-lg">
      <h2 className="text-lg font-semibold mb-1 text-white">Telegram Notifications</h2>
      <p className="text-xs text-gray-500 mb-4">Settings are saved securely and apply to all transactions.</p>
      <div className="space-y-3">
        <input 
          type="text" 
          placeholder="Telegram Chat ID" 
          className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-white focus:outline-none text-white"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Telegram Bot Token" 
          className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-white focus:outline-none text-white"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
        />
        <select
            id="notification-level"
            className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-white focus:outline-none text-white"
            value={notificationLevel}
            onChange={(e) => setNotificationLevel(e.target.value)}
        >
            <option value="first">First Confirmation Only</option>
            <option value="first_two">First & Second Confirmations</option>
            <option value="all">All Confirmations</option>
            <option value="none">Disable Notifications</option>
        </select>
        <button 
          className="w-full border border-gray-600 text-gray-300 text-sm font-bold px-4 py-2 rounded-md hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveSettings}
          disabled={!chatId.trim() || !botToken.trim() || saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default TelegramSettings;