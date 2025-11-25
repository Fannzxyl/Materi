import React, { useState, useEffect } from 'react';
import { generateInitialLearningData, generateSpecificLessons, generateLessonFromText } from './services/geminiService';
import { LearningData } from './types';
import FileUpload from './components/FileUpload';
import LoadingSpinner from './components/LoadingSpinner';
import LessonView from './components/LessonView';
import { useSettings } from './contexts/SettingsContext';
import APIKeyModal from './components/APIKeyModal';
import SettingsModal from './components/SettingsModal';

const LEARNING_DATA_KEY = 'nihongo_learningData';

const ErrorToast: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <div className="fixed top-6 right-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center animate-bounce">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    <span className="block sm:inline">{message}</span>
    <button onClick={onDismiss} className="ml-4 -mr-1 p-1 rounded-full hover:bg-red-200 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  </div>
);

function App() {
  const { apiKey, setApiKey, language, t } = useSettings();
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExtending, setIsExtending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      // If Env Var is present, we are good.
      if (process.env.API_KEY) {
        setApiKey(process.env.API_KEY);
        return;
      }

      const key = localStorage.getItem('google_api_key');
      if (!key) {
        // Use aistudio.hasSelectedApiKey if it exists
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
           const hasKey = await window.aistudio.hasSelectedApiKey();
           if (!hasKey) {
                setIsApiKeyModalOpen(true);
           } else {
             // If aistudio has key, we might not have it in localStorage yet
             // but we can proceed.
             if (apiKey === null) setApiKey(''); // Set a dummy value to satisfy checks
           }
        } else {
            setIsApiKeyModalOpen(true);
        }
      } else {
        if(apiKey === null) setApiKey(key);
      }
    };

    checkApiKey();

    try {
      const savedData = localStorage.getItem(LEARNING_DATA_KEY);
      if (savedData) {
        setLearningData(JSON.parse(savedData));
      }
    } catch (e) {
      console.error("Failed to load learning data from storage", e);
      localStorage.removeItem(LEARNING_DATA_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []); // Run only once on mount

  const isReady = (): boolean => {
    if (process.env.API_KEY) return true;
    if (apiKey) return true;
    if (window.aistudio) return true; // Assume true if aistudio is present, handled by service
    return false;
  }

  const handleFileUpload = async (file: File) => {
    if (!isReady()) {
        setError(t('error_no_api_key'));
        setIsApiKeyModalOpen(true);
        return;
    }
    setIsLoading(true);
    setError(null);
    setLearningData(null);
    setUploadedFile(file); // Keep track of the file for loading more lessons
    try {
      const data = await generateInitialLearningData(file, language);
      setLearningData(data);
      localStorage.setItem(LEARNING_DATA_KEY, JSON.stringify(data));
    } catch (err: any) {
      setError(t(err.message) || t('error_unknown'));
      setUploadedFile(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTextSubmit = async (text: string) => {
    if (!isReady()) {
        setError(t('error_no_api_key'));
        setIsApiKeyModalOpen(true);
        return;
    }
    setIsLoading(true);
    setError(null);
    setLearningData(null);
    setUploadedFile(null); // This is a text-based lesson, so no file to load more from
    try {
      const lesson = await generateLessonFromText(text, language);
       const data: LearningData = {
          pelajaran: [lesson],
          // A text-based lesson is standalone, so the index only contains itself.
          lessonIndex: [{ nomorPelajaran: lesson.nomorPelajaran, judul: lesson.judul }]
      };
      setLearningData(data);
      // Not saving to localStorage to keep it as a temporary session
    } catch (err: any) {
      setError(t(err.message) || t('error_unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!uploadedFile || !learningData || isExtending || !isReady()) return;

    setIsExtending(true);
    setError(null);
    try {
        const processedLessonNumbers = new Set(learningData.pelajaran.map(p => p.nomorPelajaran));
        const lessonsToFetch = learningData.lessonIndex
            .filter(item => !processedLessonNumbers.has(item.nomorPelajaran))
            .slice(0, 5);

      if (lessonsToFetch.length > 0) {
        const newLessons = await generateSpecificLessons(uploadedFile, lessonsToFetch, language);
        if (newLessons && newLessons.length > 0) {
            const updatedData = {
              ...learningData,
              pelajaran: [...learningData.pelajaran, ...newLessons].sort((a,b) => a.nomorPelajaran - b.nomorPelajaran),
            };
            setLearningData(updatedData);
            localStorage.setItem(LEARNING_DATA_KEY, JSON.stringify(updatedData));
        }
      }
    } catch (err: any) {
      setError(t(err.message) || t('error_unknown'));
    } finally {
      setIsExtending(false);
    }
  };
  
  const handleReset = () => {
    setLearningData(null);
    setUploadedFile(null);
    setError(null);
    setIsLoading(false); // Stop loading if reset is clicked
    localStorage.removeItem(LEARNING_DATA_KEY);
    localStorage.removeItem('nihongo_sessionState');
    localStorage.removeItem('nihongo_bookmarks');
    Object.keys(localStorage)
      .filter(key => key.startsWith('chatHistory_lesson_'))
      .forEach(key => localStorage.removeItem(key));
  };

  const hasMoreLessons = learningData && uploadedFile ? learningData.pelajaran.length < learningData.lessonIndex.length : false;


  const renderContent = () => {
    if (isLoading && !learningData) { // Show loading spinner only on initial load or processing
      return <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-custom"><LoadingSpinner message={t('loading_spinner_processing')} /></div>;
    }
    if (error && !learningData) {
      return (
         <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-custom">
            <div className="text-center max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{t('error_oops')}</h2>
                <p className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">{error}</p>
                <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors"
                >
                    {t('error_try_again')}
                </button>
            </div>
        </div>
      );
    }
    if (learningData) {
      return <LessonView
                learningData={learningData}
                onReset={handleReset}
                onLoadMore={handleLoadMore}
                openSettings={() => setIsSettingsModalOpen(true)}
                isExtending={isExtending}
                canLoadMore={!!uploadedFile}
                hasMoreLessons={hasMoreLessons}
                />;
    }
    return <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-custom"><FileUpload onFileUpload={handleFileUpload} onTextSubmit={handleTextSubmit} isApiKeySet={isReady()} openSettings={() => setIsSettingsModalOpen(true)} /></div>;
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}
      
      {!process.env.API_KEY && !apiKey && <APIKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      {renderContent()}
    </div>
  );
}

export default App;