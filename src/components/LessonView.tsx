
import React, { useState, useEffect, useMemo } from 'react';
import { LearningData, Lesson, VocabularyItem, GrammarPoint } from '../types';
import QuizCard from './QuizCard';
import AIChat from './AIChat';
import { useSettings } from '../contexts/SettingsContext';

interface LessonViewProps {
  learningData: LearningData;
  onReset: () => void;
  onLoadMore: () => void;
  openSettings: () => void;
  isExtending: boolean;
  canLoadMore: boolean;
  hasMoreLessons: boolean;
}

type ActiveTopic = 'Ringkasan' | 'Kosakata' | 'Tata Bahasa' | 'Kuis';
type View = 'lesson' | 'bookmarks' | 'practice';

interface PracticeCard {
  question: string;
  options: string[];
  correctAnswer: string;
  questionType: 'jepang-to-indonesia' | 'indonesia-to-jepang' | 'jepang-to-romaji';
  originalItem: VocabularyItem;
}

interface PracticeState {
  isActive: boolean;
  cards: PracticeCard[];
  currentIndex: number;
  userAnswers: { [key: number]: { selected: string; isCorrect: boolean } };
  isCardAnswered: boolean;
}

interface SearchResult {
    type: ActiveTopic;
    lessonIndex: number;
    lessonTitle: string;
    content: string;
    fullContent: string;
}

const SESSION_STATE_KEY = 'nihongo_sessionState';

const TopicTab = ({ topic, activeTopic, onClick, label }: { topic: ActiveTopic, activeTopic: ActiveTopic, onClick: (topic: ActiveTopic) => void, label: string }) => (
    <button
        onClick={() => onClick(topic)}
        className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 shrink-0 ${activeTopic === topic ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
    >
        {label}
    </button>
);

const BookmarkIcon = ({ isBookmarked }: { isBookmarked: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isBookmarked ? 'text-amber-400 fill-current' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const LessonView: React.FC<LessonViewProps> = ({ learningData, onReset, onLoadMore, openSettings, isExtending, canLoadMore, hasMoreLessons }) => {
  const { t, language } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeLessonIndex, setActiveLessonIndex] = useState(() => {
    try {
      const savedState = localStorage.getItem(SESSION_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.activeLessonIndex >= 0 && parsed.activeLessonIndex < learningData.pelajaran.length) {
          return parsed.activeLessonIndex;
        }
      }
    } catch {}
    return 0;
  });
  
  const [activeTopic, setActiveTopic] = useState<ActiveTopic>(() => {
    try {
      const savedState = localStorage.getItem(SESSION_STATE_KEY);
      return savedState ? JSON.parse(savedState).activeTopic : 'Ringkasan';
    } catch {
      return 'Ringkasan';
    }
  });

  const [currentView, setCurrentView] = useState<View>(() => {
    try {
      const savedState = localStorage.getItem(SESSION_STATE_KEY);
      return savedState ? JSON.parse(savedState).currentView : 'lesson';
    } catch {
      return 'lesson';
    }
  });

  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [lessonFilter, setLessonFilter] = useState('');
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [practiceState, setPracticeState] = useState<PracticeState>({
    isActive: false,
    cards: [],
    currentIndex: 0,
    userAnswers: {},
    isCardAnswered: false,
  });


  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem('nihongo_bookmarks');
      if (savedBookmarks) {
        setBookmarks(new Set(JSON.parse(savedBookmarks)));
      }
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      setBookmarks(new Set());
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nihongo_bookmarks', JSON.stringify(Array.from(bookmarks)));
    } catch (error) {
      console.error("Failed to save bookmarks:", error);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      const stateToSave = { activeLessonIndex, activeTopic, currentView };
      localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save session state:", error);
    }
  }, [activeLessonIndex, activeTopic, currentView]);

  useEffect(() => {
    setUserAnswers({});
    setIsQuizCompleted(false);
    setIsSidebarOpen(false); // Close sidebar on lesson change
  }, [activeLessonIndex]);
  
    const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    learningData.pelajaran.forEach((lesson, lessonIndex) => {
        const lessonTitle = `${t('lesson')} ${lesson.nomorPelajaran}: ${lesson.judul}`;

        if (lesson.judul.toLowerCase().includes(query) || lesson.ringkasan.toLowerCase().includes(query)) {
            const key = `lesson-${lessonIndex}`;
            if(!seen.has(key)) {
                results.push({ type: 'Ringkasan', lessonIndex, lessonTitle, content: lesson.ringkasan.length > 150 ? lesson.ringkasan.substring(0, 150) + '...' : lesson.ringkasan, fullContent: lesson.ringkasan });
                seen.add(key);
            }
        }

        lesson.kosakata.forEach((item) => {
            const fullVocabString = `${item.jepang} ${item.romaji} ${item.indonesia}`;
            if (fullVocabString.toLowerCase().includes(query)) {
                 const key = `vocab-${lessonIndex}-${item.jepang}`;
                 if(!seen.has(key)) {
                    results.push({ type: 'Kosakata', lessonIndex, lessonTitle, content: `${item.jepang} (${item.romaji}) - ${item.indonesia}`, fullContent: `${item.jepang} (${item.romaji}) - ${item.indonesia}` });
                    seen.add(key);
                 }
            }
        });

        lesson.tataBahasa.forEach((item) => {
            const fullGrammarString = `${item.pola} ${item.penjelasan}`;
            if (fullGrammarString.toLowerCase().includes(query)) {
                const key = `grammar-${lessonIndex}-${item.pola}`;
                if(!seen.has(key)) {
                    results.push({ type: 'Tata Bahasa', lessonIndex, lessonTitle, content: `${item.pola}: ${item.penjelasan.substring(0, 100)}...`, fullContent: `${item.pola}: ${item.penjelasan}` });
                    seen.add(key);
                }
            }
        });
    });
    return results;
  }, [searchQuery, learningData, t]);

  const handleSearchResultClick = (result: SearchResult) => {
    setActiveLessonIndex(result.lessonIndex);
    setActiveTopic(result.type);
    setCurrentView('lesson');
    setSearchQuery('');
    setIsSidebarOpen(false);
  };

  const toggleBookmark = (key: string) => {
    setBookmarks(prevBookmarks => {
      const newBookmarks = new Set(prevBookmarks);
      newBookmarks.has(key) ? newBookmarks.delete(key) : newBookmarks.add(key);
      return newBookmarks;
    });
  };
  
  const getBookmarkedVocab = (): VocabularyItem[] => {
      const bookmarkedVocab: VocabularyItem[] = [];
      learningData.pelajaran.forEach(lesson => {
          lesson.kosakata.forEach((item, index) => {
              if (bookmarks.has(`lesson-${lesson.nomorPelajaran}-kosakata-${index}`)) {
                  bookmarkedVocab.push(item);
              }
          });
      });
      return bookmarkedVocab;
  };

  const startPractice = () => {
    const bookmarkedVocab = getBookmarkedVocab();
    if (bookmarkedVocab.length < 4) return; 

    const shuffledVocab = [...bookmarkedVocab].sort(() => Math.random() - 0.5);

    const practiceCards: PracticeCard[] = shuffledVocab.map((item) => {
      const questionTypes: PracticeCard['questionType'][] = ['jepang-to-indonesia', 'indonesia-to-jepang', 'jepang-to-romaji'];
      const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      
      let question = '';
      let correctAnswer = '';
      let answerLanguageField: 'indonesia' | 'jepang' | 'romaji' = 'indonesia';

      switch (randomType) {
        case 'jepang-to-indonesia':
          question = item.jepang;
          correctAnswer = item.indonesia;
          answerLanguageField = 'indonesia';
          break;
        case 'indonesia-to-jepang':
          question = item.indonesia;
          correctAnswer = item.jepang;
          answerLanguageField = 'jepang';
          break;
        case 'jepang-to-romaji':
          question = item.jepang;
          correctAnswer = item.romaji;
          answerLanguageField = 'romaji';
          break;
      }
      
      const distractors = [...shuffledVocab]
        .filter(distractor => distractor.jepang !== item.jepang)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(distractor => distractor[answerLanguageField]);

      const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
      return { question, options, correctAnswer, questionType: randomType, originalItem: item };
    });
    
    setPracticeState({ isActive: true, cards: practiceCards, currentIndex: 0, userAnswers: {}, isCardAnswered: false });
    setCurrentView('practice');
  };

  const handlePracticeAnswer = (selectedAnswer: string) => {
    if (practiceState.isCardAnswered) return;
    const currentCard = practiceState.cards[practiceState.currentIndex];
    const isCorrect = selectedAnswer === currentCard.correctAnswer;
    setPracticeState(prev => ({ ...prev, isCardAnswered: true, userAnswers: { ...prev.userAnswers, [prev.currentIndex]: { selected: selectedAnswer, isCorrect } } }));
  };

  const handleNextCard = () => {
      setPracticeState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1, isCardAnswered: false }));
  };
  
  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmitQuiz = () => setIsQuizCompleted(true);
  const handleRetryQuiz = () => {
      setUserAnswers({});
      setIsQuizCompleted(false);
  };

  const activeLesson = learningData.pelajaran[activeLessonIndex];
  const isFirstLesson = activeLessonIndex === 0;
  const isLastLesson = activeLessonIndex === learningData.pelajaran.length - 1;

  const handleNextLesson = () => {
    if (!isLastLesson) {
        setActiveLessonIndex(prevIndex => prevIndex + 1);
        setActiveTopic('Ringkasan');
        return true;
    }
    return false;
  };

  const handlePreviousLesson = () => {
    if (!isFirstLesson) {
        setActiveLessonIndex(prevIndex => prevIndex - 1);
        setActiveTopic('Ringkasan');
    }
  };

  const renderBookmarks = () => {
    const bookmarkedVocab = getBookmarkedVocab();
    const bookmarkedGrammar: { lesson: Lesson; item: GrammarPoint }[] = [];
    
    learningData.pelajaran.forEach(lesson => {
        lesson.tataBahasa.forEach((item, index) => {
            if (bookmarks.has(`lesson-${lesson.nomorPelajaran}-tataBahasa-${index}`)) {
                bookmarkedGrammar.push({ lesson, item });
            }
        });
    });

    if (bookmarkedVocab.length === 0 && bookmarkedGrammar.length === 0) {
        return (
            <div className="text-center glass-panel p-8 rounded-xl shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-100">{t('bookmarks_empty_title')}</h3>
                <p className="mt-1 text-slate-500 dark:text-slate-400">{t('bookmarks_empty_subtitle')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {bookmarkedVocab.length > 0 && (
                 <div className="glass-panel p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('bookmarks_vocab_title')}</h3>
                         <button 
                            onClick={startPractice}
                            disabled={bookmarkedVocab.length < 4}
                            className="px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-all duration-200 disabled:bg-slate-300 disabled:dark:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                           {t('bookmarks_start_practice')}
                        </button>
                    </div>
                    {bookmarkedVocab.length < 4 && <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 -mt-2">{t('bookmarks_practice_min_warning')}</p>}
                     <div className="space-y-3">
                         {bookmarkedVocab.map((vocab, index) => (
                              <div key={`vocab-${index}`} className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20">
                                 <p className="font-medium text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{vocab.jepang} ({vocab.romaji})</p>
                                 <p className="text-sm text-slate-600 dark:text-slate-300">{vocab.indonesia}</p>
                             </div>
                         ))}
                     </div>
                </div>
            )}
             {bookmarkedGrammar.length > 0 && (
                 <div className="glass-panel p-6 rounded-xl shadow-sm">
                     <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('bookmarks_grammar_title')}</h3>
                      <div className="space-y-4">
                        {bookmarkedGrammar.map(({lesson, item}, index) => (
                             <div key={`grammar-${index}`} className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
                                 <p className="text-xs text-rose-500 font-semibold mb-1">{t('lesson')} {lesson.nomorPelajaran}</p>
                                <h4 className="font-semibold text-rose-600 dark:text-rose-400" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{item.pola}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{item.penjelasan}</p>
                            </div>
                        ))}
                      </div>
                 </div>
            )}
        </div>
    );
  };
  
  const renderQuizContent = () => {
    const vocabLabel = language === 'ja' ? '語彙' : 'Vocabulary';
    const grammarLabel = language === 'ja' ? '文法' : 'Grammar';

    if (!isQuizCompleted) {
        const allQuestionsAnswered = Object.keys(userAnswers).length === activeLesson.kuis.length;
        return (
            <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('quiz_title')}</h3>
                {activeLesson.kuis.map((item, index) => (
                    <QuizCard key={index} quizItem={item} questionNumber={index + 1} selectedAnswer={userAnswers[index] || null} isSubmitted={false} onSelectAnswer={(answer) => handleSelectAnswer(index, answer)} />
                ))}
                <div className="mt-6 flex justify-end">
                    <button onClick={handleSubmitQuiz} disabled={!allQuestionsAnswered} className="px-8 py-3 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-all duration-200 disabled:bg-slate-300 disabled:dark:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none">
                        {t('quiz_submit')}
                    </button>
                </div>
            </div>
        );
    }

    const score = activeLesson.kuis.reduce((acc, question, index) => acc + (userAnswers[index] === question.jawabanBenar ? 1 : 0), 0);

    return (
        <div className="glass-panel p-6 rounded-xl shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('quiz_results_title')}</h3>
            <p className={`text-lg font-semibold ${score / activeLesson.kuis.length >= 0.7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {t('quiz_results_score', { score: score, total: activeLesson.kuis.length })}
            </p>
            <div className="my-6 border-t border-slate-500/20"></div>
            <div className="space-y-4">
                {activeLesson.kuis.map((question, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = userAnswer === question.jawabanBenar;
                    return (
                        <div key={index} className={`p-4 rounded-lg ${isCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{index + 1}. {question.pertanyaan}</p>
                            <p className={`mt-1 text-sm ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                {t('quiz_results_your_answer')}: <span className="font-bold">{userAnswer}</span> {isCorrect ? t('quiz_results_correct') : t('quiz_results_incorrect')}
                            </p>
                            {!isCorrect && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('quiz_results_correct_answer')}: <span className="font-bold">{question.jawabanBenar}</span></p>}
                             {!isCorrect && (
                                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700/50 flex items-center space-x-2">
                                     <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('quiz_results_help')}</span>
                                    <button onClick={() => setActiveTopic('Kosakata')} className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-full transition-colors">{t('topic_Kosakata_short', { default: vocabLabel })}</button>
                                    <button onClick={() => setActiveTopic('Tata Bahasa')} className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-full transition-colors">{t('topic_Tata Bahasa_short', { default: grammarLabel })}</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleRetryQuiz} className="px-8 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                    {t('quiz_retry')}
                </button>
            </div>
        </div>
    );
  };
  
    const renderPracticeMode = () => {
        if (!practiceState.isActive) return null;

        if (practiceState.currentIndex >= practiceState.cards.length) {
            const score = Object.values(practiceState.userAnswers).filter((ans: { isCorrect: boolean }) => ans.isCorrect).length;
            const total = practiceState.cards.length;
            return (
                 <div className="glass-panel p-8 rounded-xl shadow-sm text-center">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('practice_done_title')}</h3>
                    <p className={`text-xl font-semibold ${score / total >= 0.7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {t('practice_done_score', { score: score, total: total })}
                    </p>
                    <div className="mt-8 flex justify-center space-x-4">
                        <button onClick={startPractice} className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors">
                            {t('practice_retry')}
                        </button>
                        <button onClick={() => { setPracticeState(prev => ({...prev, isActive: false})); setCurrentView('bookmarks'); }} className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors">
                           {t('practice_back_to_bookmarks')}
                        </button>
                    </div>
                </div>
            )
        }
        
        const currentCard = practiceState.cards[practiceState.currentIndex];
        const userAnswerInfo = practiceState.userAnswers[practiceState.currentIndex];

        const getButtonClass = (option: string) => {
            if (!practiceState.isCardAnswered) return 'bg-white/50 hover:bg-white/80 text-slate-700 dark:bg-slate-700/30 dark:hover:bg-slate-700/50 dark:text-slate-200 border-slate-300 dark:border-slate-600';
            if (option === currentCard.correctAnswer) return 'bg-emerald-500/30 text-emerald-800 border-emerald-500 dark:text-emerald-200 dark:border-emerald-500';
            if (option === userAnswerInfo.selected) return 'bg-red-500/30 text-red-800 border-red-500 dark:text-red-200 dark:border-red-500';
            return 'bg-slate-500/10 text-slate-500 cursor-default opacity-60 dark:text-slate-400 dark:opacity-50 border-transparent';
        };
        
        return (
            <div>
                 <p className="text-right text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    {t('practice_card_count', { current: practiceState.currentIndex + 1, total: practiceState.cards.length })}
                </p>
                <div className="glass-panel p-8 rounded-xl shadow-md text-center">
                    <p className="text-sm font-medium text-rose-500 dark:text-rose-400 mb-4">
                        {t(`practice_question_type_${currentCard.questionType}`)}
                    </p>
                    <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-8" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        {currentCard.question}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentCard.options.map((option, index) => (
                             <button key={index} onClick={() => handlePracticeAnswer(option)} disabled={practiceState.isCardAnswered} className={`w-full text-center p-4 rounded-lg border transition-all duration-200 font-semibold ${getButtonClass(option)} ${!practiceState.isCardAnswered ? 'cursor-pointer' : 'cursor-default'}`}>
                                {option}
                            </button>
                        ))}
                    </div>
                    {practiceState.isCardAnswered && (
                        <div className="mt-6 text-center">
                             <button onClick={handleNextCard} className="px-10 py-3 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-all duration-200">
                                {t('next')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderSearchResults = () => {
        const highlightMatch = (text: string, query: string) => {
            if (!query) return text;
            const parts = text.split(new RegExp(`(${query})`, 'gi'));
            return <span>{parts.map((part, i) => part.toLowerCase() === query.toLowerCase() ? <strong key={i} className="bg-amber-200 dark:bg-amber-400 text-slate-800 dark:text-slate-900 rounded">{part}</strong> : part)}</span>;
        };
        
        return (
             <div>
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('search_results_title')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('search_results_count', { count: searchResults.length, query: searchQuery })}</p>
                </div>
                {searchResults.length === 0 ? (
                    <div className="text-center glass-panel p-8 rounded-xl shadow-sm">
                        <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-100">{t('search_no_results_title')}</h3>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">{t('search_no_results_subtitle')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {searchResults.map((result, index) => (
                            <button key={index} onClick={() => handleSearchResultClick(result)} className="w-full text-left glass-panel p-4 rounded-xl shadow-sm hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-rose-500 dark:text-rose-400">{result.lessonTitle}</span>
                                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">{t(`topic_${result.type}`)}</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 mt-2 text-sm">{highlightMatch(result.content, searchQuery)}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
        <aside className={`w-72 glass-panel p-4 flex-shrink-0 flex flex-col fixed md:relative inset-y-0 left-0 z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
            <div className="flex-shrink-0">
                 <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 px-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>Nihongo Sensei AI</h1>
                <div className="relative mb-4">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </span>
                    <input type="search" placeholder={t('sidebar_search_placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 focus:ring-rose-500 focus:border-rose-500 transition-colors dark:placeholder-slate-400 dark:text-white" />
                </div>
                <nav className="space-y-1">
                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">{t('sidebar_lessons_title')}</p>
                    <div className="px-1 mb-2">
                        <input type="search" placeholder={t('sidebar_filter_placeholder')} value={lessonFilter} onChange={(e) => setLessonFilter(e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-xs bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 focus:ring-rose-500 focus:border-rose-500 transition-colors dark:placeholder-slate-400 dark:text-white"/>
                    </div>
                </nav>
            </div>
            <div className="flex-grow overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                 {learningData.pelajaran
                    .filter(lesson => {
                        const filterText = lessonFilter.toLowerCase().trim();
                        if (!filterText) return true;
                        const title = lesson.judul.toLowerCase();
                        const number = String(lesson.nomorPelajaran);
                        return title.includes(filterText) || number.includes(filterText);
                    })
                    .map((lesson) => {
                        const originalIndex = learningData.pelajaran.findIndex(l => l.nomorPelajaran === lesson.nomorPelajaran);
                        return (
                            <button key={lesson.nomorPelajaran} onClick={() => {setActiveLessonIndex(originalIndex); setActiveTopic('Ringkasan'); setCurrentView('lesson');}} title={`${t('lesson')} ${lesson.nomorPelajaran}: ${lesson.judul}`} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 truncate ${activeLessonIndex === originalIndex && currentView === 'lesson' && !searchQuery ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'text-slate-700 hover:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-slate-700/50'}`}>
                                {t('lesson')} {lesson.nomorPelajaran}: {lesson.judul}
                            </button>
                        )
                    })}
                <div className="mt-2">
                    {canLoadMore ? ( hasMoreLessons ? (
                        <button onClick={onLoadMore} disabled={isExtending} className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-wait">
                            {isExtending ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('loading')}...</>) : t('sidebar_load_more')}
                        </button>
                    ) : ( <p className="px-3 py-2 text-xs text-center text-slate-500 dark:text-slate-400 bg-slate-500/10 rounded-lg">{t('sidebar_end_of_book')}</p> )
                    ) : ( <p className="px-3 py-2 text-xs text-center text-slate-500 dark:text-slate-400 bg-slate-500/10 rounded-lg">{t('sidebar_start_over_prompt_1')} <button onClick={onReset} className="font-semibold text-rose-500 hover:underline">{t('sidebar_start_over_prompt_2')}</button>.</p> )}
                </div>
            </div>
            <div className="flex-shrink-0 mt-4 pt-4 border-t border-slate-500/20 space-y-2">
                <button onClick={() => {setCurrentView('bookmarks'); setIsSidebarOpen(false);}} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-3 ${currentView === 'bookmarks' && !searchQuery ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'text-slate-700 hover:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-slate-700/50'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                    <span>{t('sidebar_bookmarks')}</span>
                </button>
                 <button onClick={openSettings} className="w-full flex items-center space-x-3 text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{t('sidebar_settings')}</span>
                </button>
                 <button onClick={onReset} className="w-full flex items-center space-x-3 text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     <span>{t('sidebar_start_over')}</span>
                </button>
            </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="flex-shrink-0 glass-panel p-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="flex-1 min-w-0">
                  {currentView === 'lesson' && activeLesson && (
                    <>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{t('lesson')} {activeLesson.nomorPelajaran}</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{activeLesson.judul}</p>
                    </>
                  )}
                   {currentView === 'bookmarks' && <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{t('bookmarks_title')}</h2>}
                   {currentView === 'practice' && <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{t('practice_title')}</h2>}
                </div>
                 <div className="flex items-center space-x-1">
                    {currentView === 'lesson' && (
                        <>
                        <button onClick={handlePreviousLesson} disabled={isFirstLesson} className="p-2 rounded-full hover:bg-slate-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                        <button onClick={() => handleNextLesson()} disabled={isLastLesson} className="p-2 rounded-full hover:bg-slate-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></button>
                        </>
                    )}
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className="lg:hidden p-2 rounded-full hover:bg-slate-500/10 transition-colors text-rose-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2-2H4a2 2 0 01-2-2v-4z" /></svg>
                    </button>
                 </div>
              </div>
          </header>
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
              <div className="max-w-4xl mx-auto">
                  {searchQuery.trim() ? renderSearchResults() : (
                      <>
                          {currentView === 'lesson' && activeLesson && (
                              <>
                                <div className="mb-6">
                                    <div className="flex items-center space-x-2 p-1 rounded-full bg-slate-200/50 dark:bg-slate-900/50 w-full overflow-x-auto custom-scrollbar">
                                      <TopicTab topic="Ringkasan" activeTopic={activeTopic} onClick={setActiveTopic} label={t('topic_Ringkasan')} />
                                      <TopicTab topic="Kosakata" activeTopic={activeTopic} onClick={setActiveTopic} label={t('topic_Kosakata')} />
                                      <TopicTab topic="Tata Bahasa" activeTopic={activeTopic} onClick={setActiveTopic} label={t('topic_Tata Bahasa')} />
                                      <TopicTab topic="Kuis" activeTopic={activeTopic} onClick={setActiveTopic} label={t('topic_Kuis')} />
                                    </div>
                                </div>
                                  
                                  <div className="break-words">
                                      {activeTopic === 'Ringkasan' && (
                                          <div className="glass-panel p-6 rounded-xl shadow-sm">
                                              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('topic_Ringkasan')}</h3>
                                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{activeLesson.ringkasan}</p>
                                          </div>
                                      )}
                                      {activeTopic === 'Kosakata' && (
                                          <div className="overflow-x-auto">
                                              <div className="glass-panel rounded-xl shadow-sm overflow-hidden">
                                                  <table className="min-w-full">
                                                          <thead className="bg-slate-500/10">
                                                              <tr>
                                                                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('vocab_table_col1')}</th>
                                                                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('vocab_table_col2')}</th>
                                                                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('vocab_table_col3')}</th>
                                                                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Bookmark</span></th>
                                                              </tr>
                                                          </thead>
                                                          <tbody className="divide-y divide-slate-500/20">
                                                              {activeLesson.kosakata.map((item, index) => {
                                                                  const key = `lesson-${activeLesson.nomorPelajaran}-kosakata-${index}`;
                                                                  return (
                                                                      <tr key={index} className="hover:bg-slate-500/5">
                                                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{item.jepang}</td>
                                                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{item.romaji}</td>
                                                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{item.indonesia}</td>
                                                                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                              <button onClick={() => toggleBookmark(key)} className="p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-400/10 transition-colors" aria-label="Bookmark"><BookmarkIcon isBookmarked={bookmarks.has(key)} /></button>
                                                                          </td>
                                                                      </tr>
                                                                  )
                                                              })}
                                                          </tbody>
                                                      </table>
                                              </div>
                                          </div>
                                      )}
                                      {activeTopic === 'Tata Bahasa' && (
                                          <div className="space-y-6">
                                              {activeLesson.tataBahasa.map((item, index) => {
                                                  const key = `lesson-${activeLesson.nomorPelajaran}-tataBahasa-${index}`;
                                                  return (
                                                      <div key={index} className="relative glass-panel p-6 rounded-xl shadow-sm">
                                                          <div className="absolute top-4 right-4"><button onClick={() => toggleBookmark(key)} className="p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-400/10 transition-colors" aria-label="Bookmark"><BookmarkIcon isBookmarked={bookmarks.has(key)} /></button></div>
                                                          <div className="relative group inline-block">
                                                              <h3 className="text-lg font-semibold text-rose-600 dark:text-rose-400 mb-2 pr-8 cursor-help" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                                                                  {item.pola}
                                                              </h3>
                                                              <div className="absolute invisible group-hover:visible bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-800 dark:bg-slate-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                                                                  {item.penjelasan}
                                                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800 dark:border-t-slate-900"></div>
                                                              </div>
                                                          </div>
                                                          <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed whitespace-pre-wrap">{item.penjelasan}</p>
                                                          <div className="border-t border-slate-500/20 pt-4 mt-4 space-y-3">
                                                              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('grammar_examples_title')}:</h4>
                                                              {item.contoh.map((c, cIndex) => (
                                                                  <div key={cIndex} className="text-sm">
                                                                      <p className="text-slate-800 dark:text-slate-100 font-medium" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{c.jepang}</p>
                                                                      <p className="text-slate-500 dark:text-slate-400">{c.indonesia}</p>
                                                                  </div>
                                                              ))}
                                                          </div>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      )}
                                      {activeTopic === 'Kuis' && renderQuizContent()}
                                  </div>
                              </>
                          )}
                          {currentView === 'bookmarks' && renderBookmarks()}
                          {currentView === 'practice' && renderPracticeMode()}
                      </>
                  )}
              </div>
          </main>
        </div>
        
        {activeLesson && <AIChat lesson={activeLesson} onGoToNextLesson={handleNextLesson} isLastLesson={isLastLesson} activeTopic={activeTopic} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />}
    </div>
  );
};

export default LessonView;