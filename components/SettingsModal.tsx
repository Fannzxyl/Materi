
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { verifyApiKey } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey, language, setLanguage, t } = useSettings();
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  
  useEffect(() => {
    setLocalApiKey(apiKey || '');
    setVerificationError('');
  }, [apiKey, isOpen]);

  const handleSave = async () => {
    setVerificationError('');
    // Only verify if the key has actually changed
    if (localApiKey.trim() !== (apiKey || '').trim()) {
      // If the user clears the key, just save it as empty and close.
      if (!localApiKey.trim()) {
        setApiKey('');
        onClose();
        return;
      }
      
      setIsVerifying(true);
      const isValid = await verifyApiKey(localApiKey);
      setIsVerifying(false);
      
      if (isValid) {
        setApiKey(localApiKey);
        onClose();
      } else {
        setVerificationError(t('apiKeyModal_error_invalid'));
      }
    } else {
      // If key hasn't changed, just close
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('settingsModal_title')}</h2>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-500/10"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('settingsModal_language_label')}</h3>
                <div className="flex space-x-2">
                    {(['id', 'en', 'ja'] as const).map(lang => (
                        <button 
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 border ${language === lang ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 border-slate-300 dark:border-slate-600'}`}
                        >
                            {lang === 'id' ? 'Indonesia' : lang === 'en' ? 'English' : '日本語'}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                 <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('settingsModal_apiKey_label')}</h3>
                 <input
                    type="password"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="Enter your API Key"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-rose-500 focus:border-rose-500 transition-colors bg-white/50 dark:bg-slate-700/50 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
                />
                {verificationError && <p className="text-red-500 text-xs mt-1">{verificationError}</p>}
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {t('apiKeyModal_info_1')}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline font-semibold">
                        {t('apiKeyModal_info_2')}
                    </a>.
                </p>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isVerifying}
            className="px-6 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-slate-800 disabled:bg-rose-300 dark:disabled:bg-rose-800 disabled:cursor-wait"
          >
            {isVerifying ? t('verifying') : t('save_and_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;