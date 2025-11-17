import React, { useState, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onTextSubmit: (text: string) => void;
  isApiKeySet: boolean;
  openSettings: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onTextSubmit, isApiKeySet, openSettings }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf');
  const [textInput, setTextInput] = useState('');
  const { t } = useSettings();

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isApiKeySet) setIsDragging(true);
  }, [isApiKeySet]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isApiKeySet && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload, isApiKeySet]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isApiKeySet && e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const TabButton: React.FC<{ tab: 'pdf' | 'text'; children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 text-sm font-semibold transition-colors duration-200 border-b-2 ${
        activeTab === tab
          ? 'text-rose-500 border-rose-500'
          : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            Nihongo Sensei AI
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
            {t('fileUpload_subtitle')}
        </p>

        <div className="glass-panel rounded-t-2xl flex justify-center border-b-0">
            <TabButton tab="pdf">{t('fileUpload_tab_pdf')}</TabButton>
            <TabButton tab="text">{t('fileUpload_tab_text')}</TabButton>
        </div>

        {activeTab === 'pdf' && (
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`glass-panel relative p-8 border-2 border-t-0 border-dashed rounded-b-2xl rounded-tr-2xl transition-all duration-300 ${isDragging ? 'border-rose-500 bg-rose-500/10' : 'border-transparent'}`}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={!isApiKeySet}
                />
                <div className="flex flex-col items-center justify-center space-y-4 text-slate-500 dark:text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="font-semibold">
                        <label htmlFor="file-upload" className={`font-semibold ${isApiKeySet ? 'text-rose-500 hover:text-rose-600 cursor-pointer' : 'text-slate-400 dark:text-slate-500'}`}>{t('fileUpload_select')}</label> {t('fileUpload_orDrag')}
                    </p>
                    <p className="text-sm">{t('fileUpload_pdfOnly')}</p>
                </div>
            </div>
        )}
        
        {activeTab === 'text' && (
            <div className="glass-panel p-8 border-2 border-t-0 border-dashed border-transparent rounded-b-2xl rounded-tr-2xl">
                <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t('fileUpload_text_placeholder')}
                    className="w-full h-40 p-4 border rounded-xl text-sm bg-white/60 dark:bg-slate-800/60 border-slate-300 dark:border-slate-600 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                    disabled={!isApiKeySet}
                    aria-label={t('fileUpload_text_placeholder')}
                />
                <button
                    onClick={() => onTextSubmit(textInput)}
                    disabled={!isApiKeySet || !textInput.trim()}
                    className="mt-4 px-8 py-3 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-all duration-200 disabled:bg-slate-300 disabled:dark:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {t('fileUpload_text_button')}
                </button>
            </div>
        )}

        {!isApiKeySet && (
            <div className="mt-4 text-center">
                <p className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg text-sm">
                    {t('fileUpload_apiKeyNeeded_1')}
                    <button onClick={openSettings} className="font-bold underline hover:text-amber-800 dark:hover:text-amber-300 mx-1">
                        {t('fileUpload_apiKeyNeeded_2')}
                    </button>
                    {t('fileUpload_apiKeyNeeded_3')}
                </p>
            </div>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            {t('fileUpload_disclaimer')}
        </p>
    </div>
  );
};

export default FileUpload;