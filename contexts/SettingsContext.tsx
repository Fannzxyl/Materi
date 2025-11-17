
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import translations from '../translations';

type Language = 'id' | 'en' | 'ja';

interface SettingsContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('google_api_key');
    } catch {
      return null;
    }
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem('app_language');
      return (savedLang && ['id', 'en', 'ja'].includes(savedLang)) ? (savedLang as Language) : 'id';
    } catch {
      return 'id';
    }
  });

  useEffect(() => {
    try {
      if (apiKey) {
        localStorage.setItem('google_api_key', apiKey);
      } else {
        localStorage.removeItem('google_api_key');
      }
    } catch (error) {
      console.error("Could not save API key to local storage", error);
    }
  }, [apiKey]);
  
  useEffect(() => {
    try {
      localStorage.setItem('app_language', language);
      document.documentElement.lang = language;
    } catch (error) {
      console.error("Could not save language to local storage", error);
    }
  }, [language]);

  const setApiKey = (key: string) => setApiKeyState(key);
  const setLanguage = (lang: Language) => setLanguageState(lang);

  const t = useMemo(() => (key: string, options?: Record<string, string | number>): string => {
    const langTranslations = translations[language] || translations.id;
    let translation = langTranslations[key] || key;
    
    if (options) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{{${optionKey}}}`, String(options[optionKey]));
      });
    }

    return translation;
  }, [language]);

  const value = { apiKey, setApiKey, language, setLanguage, t };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
