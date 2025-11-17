
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, ChatMessage } from '../types';
import { generateChatResponse } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';

interface AIChatProps {
  lesson: Lesson;
  onGoToNextLesson: () => boolean;
  isLastLesson: boolean;
  activeTopic: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const AIChat: React.FC<AIChatProps> = ({ lesson, onGoToNextLesson, isLastLesson, activeTopic, isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { language, t } = useSettings();

  const storageKey = `chatHistory_lesson_${lesson.nomorPelajaran}_${language}`;

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(storageKey);
      const initialMessage = t('chat_initial_greeting', { lessonNumber: lesson.nomorPelajaran, lessonTitle: lesson.judul });
      setMessages(savedHistory ? JSON.parse(savedHistory) : [{ role: 'model', content: initialMessage }]);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      const errorMessage = t('chat_initial_greeting', { lessonNumber: lesson.nomorPelajaran, lessonTitle: lesson.judul });
      setMessages([{ role: 'model', content: errorMessage }]);
    }
  }, [lesson.nomorPelajaran, storageKey, lesson.judul, t]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save chat history:", error);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, storageKey]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const response = await generateChatResponse(lesson, newMessages, input, activeTopic, language);

    if (response === '[LANJUTKAN]') {
        const success = onGoToNextLesson();
        if (success) {
            setMessages([...newMessages, { role: 'model', content: t('chat_navigation_success') }]);
        } else if (isLastLesson) {
            setMessages([...newMessages, { role: 'model', content: t('chat_navigation_last_lesson') }]);
        }
    } else {
        setMessages([...newMessages, { role: 'model', content: response }]);
    }
    setIsLoading(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(e);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="lg:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setIsOpen(false)}></div>}

      <div className={`
        fixed right-0 top-0 h-full
        lg:relative lg:w-[400px] lg:flex-shrink-0
        flex flex-col transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0
      `}>
          <div className="h-full w-full glass-panel flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-500/20 flex-shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Sensei AI</h3>
                <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 rounded-full text-slate-400 hover:bg-slate-500/20 focus:outline-none focus:ring-2 focus:ring-rose-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">AI</div>
                )}
                <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.role === 'model' ? 'bg-slate-500/10 text-slate-700 dark:text-slate-200 rounded-tl-none' : 'bg-rose-500 text-white rounded-br-none'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">AI</div>
                    <div className="max-w-[80%] p-3 rounded-2xl bg-slate-500/10 rounded-tl-none flex items-center space-x-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-slate-500/20 flex-shrink-0">
            <div className="relative flex items-center">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat_placeholder')}
                    className="w-full pl-4 pr-12 py-2 border bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 rounded-2xl text-sm focus:ring-rose-500 focus:border-rose-500 transition-colors dark:placeholder-slate-400 dark:text-white resize-none max-h-32 custom-scrollbar"
                    disabled={isLoading}
                />
                <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-2 flex items-center justify-center w-8 h-8 text-white bg-rose-500 rounded-full disabled:bg-slate-400 dark:disabled:bg-slate-600 hover:bg-rose-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" transform="rotate(45) translate(1, -1)"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            </div>
            </form>
          </div>
      </div>
    </>
  );
};

export default AIChat;