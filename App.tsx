import React, { useState, useEffect } from 'react';
import { generateInitialLearningData, generateSpecificLessons } from './services/geminiService';
import { LearningData } from './types';
import FileUpload from './components/FileUpload';
import LoadingSpinner from './components/LoadingSpinner';
import LessonView from './components/LessonView';

const LEARNING_DATA_KEY = 'nihongo_learningData';

function App() {
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExtending, setIsExtending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LEARNING_DATA_KEY);
      if (savedData) {
        setLearningData(JSON.parse(savedData));
      }
    } catch (e) {
      console.error("Gagal memuat data pembelajaran dari penyimpanan", e);
      localStorage.removeItem(LEARNING_DATA_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setLearningData(null);
    setUploadedFile(file);
    try {
      const data = await generateInitialLearningData(file);
      setLearningData(data);
      localStorage.setItem(LEARNING_DATA_KEY, JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan yang tidak diketahui.');
      setUploadedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!uploadedFile || !learningData || isExtending) return;

    setIsExtending(true);
    setError(null);
    try {
        const processedLessonNumbers = new Set(learningData.pelajaran.map(p => p.nomorPelajaran));
        const lessonsToFetch = learningData.lessonIndex
            .filter(item => !processedLessonNumbers.has(item.nomorPelajaran))
            .slice(0, 5);

      if (lessonsToFetch.length > 0) {
        const newLessons = await generateSpecificLessons(uploadedFile, lessonsToFetch);
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
      setError(err.message || 'Gagal memuat pelajaran tambahan.');
    } finally {
      setIsExtending(false);
    }
  };
  
  const handleReset = () => {
    setLearningData(null);
    setUploadedFile(null);
    setError(null);
    setIsLoading(false);
    localStorage.removeItem(LEARNING_DATA_KEY);
    localStorage.removeItem('nihongo_sessionState');
    localStorage.removeItem('nihongo_bookmarks');
    Object.keys(localStorage)
      .filter(key => key.startsWith('chatHistory_lesson_'))
      .forEach(key => localStorage.removeItem(key));
  };

  const hasMoreLessons = learningData ? learningData.pelajaran.length < learningData.lessonIndex.length : false;

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner message="Memuat sesi belajar Anda..." />;
    }
    if (error && !learningData) {
      return (
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Oops! Terjadi Kesalahan</h2>
          <p className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">{error}</p>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      );
    }
    if (learningData) {
      return <LessonView
                learningData={learningData}
                onReset={handleReset}
                onLoadMore={handleLoadMore}
                isExtending={isExtending}
                canLoadMore={!!uploadedFile}
                hasMoreLessons={hasMoreLessons}
                />;
    }
    return <FileUpload onFileUpload={handleFileUpload} />;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${!learningData ? 'p-4 bg-slate-50 dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-900'}`}>
      {error && learningData && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
          </div>
      )}
      {renderContent()}
    </div>
  );
}

export default App;