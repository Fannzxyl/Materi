import React, { useState, useEffect, useRef } from 'react';
import { Lesson, ChatMessage, LearningData } from '../types';
import { generateChatResponse } from '../services/geminiService';

interface AIChatProps {
  learningData: LearningData;
  lesson: Lesson;
  onGoToNextLesson: () => boolean;
  isLastLesson: boolean;
  activeTopic: string;
}

const AIChat: React.FC<AIChatProps> = ({ learningData, lesson, onGoToNextLesson, isLastLesson, activeTopic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = `chatHistory_lesson_${lesson.nomorPelajaran}`;

  useEffect(() => {
    // Load chat history from localStorage when lesson changes
    try {
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        setMessages(JSON.parse(savedHistory));
      } else {
        setMessages([{ role: 'model', content: `Halo! Saya Sensei AI. Ada yang bisa saya bantu dengan Pelajaran ${lesson.nomorPelajaran}: ${lesson.judul}?` }]);
      }
    } catch (error) {
      console.error("Gagal memuat riwayat percakapan:", error);
      setMessages([{ role: 'model', content: `Halo! Selamat datang di Pelajaran ${lesson.nomorPelajaran}.` }]);
    }
  }, [lesson.nomorPelajaran, storageKey, lesson.judul]);

  useEffect(() => {
    // Save chat history to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
        console.error("Gagal menyimpan riwayat percakapan:", error);
    }
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, storageKey]);
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const response = await generateChatResponse(learningData, lesson, newMessages, input, activeTopic);

    if (response === '[LANJUTKAN]') {
        const success = onGoToNextLesson();
        if (success) {
            setMessages([...newMessages, { role: 'model', content: "Baik, mari kita lanjut ke pelajaran berikutnya!" }]);
        } else if (isLastLesson) {
            setMessages([...newMessages, { role: 'model', content: "Ini adalah pelajaran terakhir. Tidak ada pelajaran selanjutnya." }]);
        }
    } else {
        setMessages([...newMessages, { role: 'model', content: response }]);
    }
    setIsLoading(false);
  };

  return (
    <>
      {/* Chat Popup */}
      <div className={`fixed bottom-24 right-4 sm:right-6 lg:right-8 w-[calc(100%-2rem)] sm:w-96 max-h-[70vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`} style={{ zIndex: 1000 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Sensei AI</h3>
          <button onClick={() => setIsOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-rose-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">AI</div>
              )}
              <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'model' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none' : 'bg-rose-500 text-white rounded-br-none'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">AI</div>
                <div className="max-w-[80%] p-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none flex items-center space-x-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya sesuatu..."
              className="w-full pl-4 pr-12 py-2 border border-slate-300 rounded-full text-sm focus:ring-rose-500 focus:border-rose-500 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-10 text-rose-500 disabled:text-slate-400 dark:disabled:text-slate-500 hover:text-rose-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 flex items-center justify-center rounded-full transition-opacity duration-300">
                <svg className="animate-spin h-5 w-5 text-rose-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Sensei AI sedang berpikir...
                </span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 lg:right-8 w-14 h-14 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-slate-900 transition-transform duration-200 transform hover:scale-110"
        aria-label="Buka Asisten AI"
        style={{ zIndex: 1001 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mx-auto" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2-2H4a2 2 0 01-2-2v-4z" />
        </svg>
      </button>
    </>
  );
};

export default AIChat;