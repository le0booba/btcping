

import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';

type NotificationLevel = 'first' | 'first_two' | 'all' | 'none';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface TelegramSettingsProps {
    disabled: boolean;
}

const levelOptions: { value: NotificationLevel; label: string; description: string }[] = [
  { value: 'first', label: 'First Confirmation', description: 'Notify when a transaction gets its first confirmation.' },
  { value: 'first_two', label: 'First Two Confirmations', description: 'Notify on the first and second confirmations.' },
  { value: 'all', label: 'All Confirmations', description: 'Notify on every new confirmation (can be noisy).' },
  { value: 'none', label: 'Disable Notifications', description: 'No automatic notifications will be sent via Telegram.' },
];

const TelegramSettings: React.FC<TelegramSettingsProps> = ({ disabled }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState<NotificationLevel>('first');
  const [initialLevel, setInitialLevel] = useState<NotificationLevel>('first');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const checkSettings = useCallback(async () => {
    if (disabled) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setIsConfigured(!!(data.chatId && data.botToken));
        setCurrentLevel(data.notificationLevel || 'first');
        setInitialLevel(data.notificationLevel || 'first');
      } else {
        setIsConfigured(false);
      }
    } catch (error) {
      console.error('Error checking Telegram settings:', error);
      setIsConfigured(false);
    } finally {
      setIsLoading(false);
    }
  }, [disabled]);

  useEffect(() => {
    checkSettings();
  }, [checkSettings]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationLevel: currentLevel }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      setSaveStatus('saved');
      setInitialLevel(currentLevel);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
    } finally {
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  if (disabled && !isLoading) {
    return (
      <div className="bg-[#111111] border border-gray-800 p-5 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-white">Telegram Notifications</h2>
        <div className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-md text-center">
            <LockClosedIcon className="h-5 w-5 text-gray-500" />
            <p className="text-sm text-gray-500">Please log in to configure notifications.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[#111111] border border-gray-800 p-5 rounded-lg flex justify-center items-center min-h-[160px]">
        <LoadingSpinner className="h-6 w-6 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-gray-800 p-5 rounded-lg">
      <h2 className="text-lg font-semibold mb-3 text-white">Telegram Notifications</h2>
      {!isConfigured ? (
        <div className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-md">
          <XCircleIcon className="h-6 w-6 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-yellow-300">Configuration Needed</p>
            <p className="text-sm text-yellow-500">Telegram environment variables are not set on the server.</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 bg-black p-3 rounded-md mb-4">
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-white">Notifications Active</p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-400 mb-2">Notification Level</legend>
            {levelOptions.map(({ value, label, description }) => (
              <label key={value} htmlFor={value} className="flex items-start gap-3 p-3 bg-black rounded-md cursor-pointer hover:bg-gray-900 transition-colors">
                <input
                  type="radio"
                  id={value}
                  name="notificationLevel"
                  value={value}
                  checked={currentLevel === value}
                  onChange={() => setCurrentLevel(value)}
                  className="mt-1 h-4 w-4 text-white bg-gray-700 border-gray-600 focus:ring-white focus:ring-2"
                />
                <div>
                  <span className="font-medium text-white">{label}</span>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
              </label>
            ))}
          </fieldset>
          
          <div className="mt-4 flex justify-end items-center gap-4">
              {saveStatus === 'saved' && <p className="text-sm text-green-500">Saved!</p>}
              {saveStatus === 'error' && <p className="text-sm text-red-500">Error!</p>}
              <button
                onClick={handleSave}
                disabled={currentLevel === initialLevel || saveStatus === 'saving'}
                className="bg-white text-black font-bold px-4 py-2 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              >
                {saveStatus === 'saving' ? <LoadingSpinner className="h-5 w-5"/> : 'Save'}
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramSettings;