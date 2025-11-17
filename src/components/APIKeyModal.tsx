
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { verifyApiKey } from '../services/geminiService';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APIKeyModal: React.FC<APIKeyModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey, t } = useSettings();
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSave = async () => {
    if (!localApiKey.trim()) {
      setError(t('apiKeyModal_error_empty'));
      return;
    }
    setError('');
    setIsVerifying(true);

    const isValid = await verifyApiKey(localApiKey);
    setIsVerifying(false);

    if (isValid) {
      setApiKey(localApiKey);
      onClose();
    } else {
      setError(t('apiKeyModal_error_invalid'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('apiKeyModal_title')}</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">{t('apiKeyModal_subtitle')}</p>
        
        <div className="mb-4">
          <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('apiKeyModal_input_label')}</label>
          <input
            id="api-key-input"
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="Enter your API Key here"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-rose-500 focus:border-rose-500 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {t('apiKeyModal_info_1')}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline font-semibold">
             {t('apiKeyModal_info_2')}
          </a>. {t('apiKeyModal_info_3')}
        </p>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isVerifying}
            className="px-6 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-slate-800 disabled:bg-rose-300 dark:disabled:bg-rose-800 disabled:cursor-wait"
          >
            {isVerifying ? t('verifying') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default APIKeyModal;