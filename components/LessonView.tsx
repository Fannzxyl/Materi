import React, { useState, useEffect, useMemo } from 'react';
import { LearningData, Lesson, VocabularyItem, GrammarPoint } from '../types';
import QuizCard from './QuizCard';
import AIChat from './AIChat';

interface LessonViewProps {
  learningData: LearningData;
  onReset: () => void;
  onLoadMore: () => void;
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
    fullContent: string; // for highlighting
}

const SESSION_STATE_KEY = 'nihongo_sessionState';

const TopicButton = ({ topic, activeTopic, onClick }: { topic: ActiveTopic, activeTopic: ActiveTopic, onClick: (topic: ActiveTopic) => void }) => (
    <button
        onClick={() => onClick(topic)}
        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${activeTopic === topic ? 'bg-rose-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
    >
        {topic}
    </button>
);

const BookmarkIcon = ({ isBookmarked }: { isBookmarked: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isBookmarked ? 'text-amber-400 fill-current' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const LessonView: React.FC<LessonViewProps> = ({ learningData, onReset, onLoadMore, isExtending, canLoadMore, hasMoreLessons }) => {
  const [activeLessonIndex, setActiveLessonIndex] = useState(() => {
    try {
      const savedState = localStorage.getItem(SESSION_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Validasi bahwa indeks yang disimpan berada dalam batas data pembelajaran saat ini
        if (parsed.activeLessonIndex >= 0 && parsed.activeLessonIndex < learningData.pelajaran.length) {
          return parsed.activeLessonIndex;
        }
      }
    } catch {}
    return 0; // Default ke pelajaran pertama
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

  // Quiz State
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Practice Mode State
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
      console.error("Gagal memuat bookmark:", error);
      setBookmarks(new Set());
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nihongo_bookmarks', JSON.stringify(Array.from(bookmarks)));
    } catch (error) {
      console.error("Gagal menyimpan bookmark:", error);
    }
  }, [bookmarks]);

  // Efek untuk menyimpan state sesi setiap kali berubah
  useEffect(() => {
    try {
      const stateToSave = { activeLessonIndex, activeTopic, currentView };
      localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Gagal menyimpan state sesi:", error);
    }
  }, [activeLessonIndex, activeTopic, currentView]);

  // Reset quiz state when lesson changes
  useEffect(() => {
    setUserAnswers({});
    setIsQuizCompleted(false);
  }, [activeLessonIndex]);
  
    const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.trim().toLowerCase();
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    learningData.pelajaran.forEach((lesson, lessonIndex) => {
        const lessonTitle = `Pelajaran ${lesson.nomorPelajaran}: ${lesson.judul}`;

        // Search lesson title and summary
        if (lesson.judul.toLowerCase().includes(query) || lesson.ringkasan.toLowerCase().includes(query)) {
            const key = `lesson-${lessonIndex}`;
            if(!seen.has(key)) {
                results.push({
                    type: 'Ringkasan',
                    lessonIndex,
                    lessonTitle,
                    content: lesson.ringkasan.length > 150 ? lesson.ringkasan.substring(0, 150) + '...' : lesson.ringkasan,
                    fullContent: lesson.ringkasan
                });
                seen.add(key);
            }
        }

        // Search vocabulary
        lesson.kosakata.forEach((item) => {
            const fullVocabString = `${item.jepang} ${item.romaji} ${item.indonesia}`;
            if (fullVocabString.toLowerCase().includes(query)) {
                 const key = `vocab-${lessonIndex}-${item.jepang}`;
                 if(!seen.has(key)) {
                    results.push({
                        type: 'Kosakata',
                        lessonIndex,
                        lessonTitle,
                        content: `${item.jepang} (${item.romaji}) - ${item.indonesia}`,
                        fullContent: `${item.jepang} (${item.romaji}) - ${item.indonesia}`
                    });
                    seen.add(key);
                 }
            }
        });

        // Search grammar
        lesson.tataBahasa.forEach((item) => {
            const fullGrammarString = `${item.pola} ${item.penjelasan}`;
            if (fullGrammarString.toLowerCase().includes(query)) {
                const key = `grammar-${lessonIndex}-${item.pola}`;
                if(!seen.has(key)) {
                    results.push({
                        type: 'Tata Bahasa',
                        lessonIndex,
                        lessonTitle,
                        content: `${item.pola}: ${item.penjelasan.substring(0, 100)}...`,
                        fullContent: `${item.pola}: ${item.penjelasan}`
                    });
                    seen.add(key);
                }
            }
        });
    });
    return results;
  }, [searchQuery, learningData]);

  const handleSearchResultClick = (result: SearchResult) => {
    setActiveLessonIndex(result.lessonIndex);
    setActiveTopic(result.type);
    setCurrentView('lesson');
    setSearchQuery(''); // Clear search to show the lesson view
  };

  const toggleBookmark = (key: string) => {
    setBookmarks(prevBookmarks => {
      const newBookmarks = new Set(prevBookmarks);
      if (newBookmarks.has(key)) {
        newBookmarks.delete(key);
      } else {
        newBookmarks.add(key);
      }
      return newBookmarks;
    });
  };
  
  const getBookmarkedVocab = (): VocabularyItem[] => {
      const bookmarkedVocab: VocabularyItem[] = [];
      learningData.pelajaran.forEach(lesson => {
          lesson.kosakata.forEach((item, index) => {
              const key = `lesson-${lesson.nomorPelajaran}-kosakata-${index}`;
              if (bookmarks.has(key)) {
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

      switch (randomType) {
        case 'jepang-to-indonesia':
          question = item.jepang;
          correctAnswer = item.indonesia;
          break;
        case 'indonesia-to-jepang':
          question = item.indonesia;
          correctAnswer = item.jepang;
          break;
        case 'jepang-to-romaji':
          question = item.jepang;
          correctAnswer = item.romaji;
          break;
      }
      
      const distractors = [...shuffledVocab]
        .filter(distractor => distractor.jepang !== item.jepang)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(distractor => {
            switch (randomType) {
                case 'jepang-to-indonesia': return distractor.indonesia;
                case 'indonesia-to-jepang': return distractor.jepang;
                case 'jepang-to-romaji': return distractor.romaji;
            }
        });

      const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

      return { question, options, correctAnswer, questionType: randomType, originalItem: item };
    });
    
    setPracticeState({
        isActive: true,
        cards: practiceCards,
        currentIndex: 0,
        userAnswers: {},
        isCardAnswered: false,
    });
    setCurrentView('practice');
  };

  const handlePracticeAnswer = (selectedAnswer: string) => {
    if (practiceState.isCardAnswered) return;

    const currentCard = practiceState.cards[practiceState.currentIndex];
    const isCorrect = selectedAnswer === currentCard.correctAnswer;
    
    setPracticeState(prev => ({
        ...prev,
        isCardAnswered: true,
        userAnswers: {
            ...prev.userAnswers,
            [prev.currentIndex]: { selected: selectedAnswer, isCorrect }
        }
    }));
  };

  const handleNextCard = () => {
      setPracticeState(prev => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
          isCardAnswered: false,
      }));
  };
  
  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmitQuiz = () => {
    setIsQuizCompleted(true);
  };
  
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
        return true; // Indicate success
    }
    return false; // Indicate failure
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
            const key = `lesson-${lesson.nomorPelajaran}-tataBahasa-${index}`;
            if (bookmarks.has(key)) {
                bookmarkedGrammar.push({ lesson, item });
            }
        });
    });

    if (bookmarkedVocab.length === 0 && bookmarkedGrammar.length === 0) {
        return (
            <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-100">Tidak Ada Bookmark</h3>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Tandai kosakata atau tata bahasa yang penting untuk dilihat lagi di sini.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {bookmarkedVocab.length > 0 && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Kosakata Ditandai</h3>
                         <button 
                            onClick={startPractice}
                            disabled={bookmarkedVocab.length < 4}
                            className="px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-all duration-200 disabled:bg-slate-300 disabled:dark:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                           Mulai Latihan
                        </button>
                    </div>
                    {bookmarkedVocab.length < 4 && <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 -mt-2">Butuh minimal 4 kosakata untuk memulai latihan.</p>}
                     <div className="space-y-3">
                         {bookmarkedVocab.map((vocab, index) => (
                              <div key={`vocab-${index}`} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                                 <p className="font-medium text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{vocab.jepang} ({vocab.romaji})</p>
                                 <p className="text-sm text-slate-600 dark:text-slate-300">{vocab.indonesia}</p>
                             </div>
                         ))}
                     </div>
                </div>
            )}
             {bookmarkedGrammar.length > 0 && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Tata Bahasa Ditandai</h3>
                      <div className="space-y-4">
                        {bookmarkedGrammar.map(({lesson, item}, index) => (
                             <div key={`grammar-${index}`} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                                 <p className="text-xs text-rose-500 font-semibold mb-1">Pelajaran {lesson.nomorPelajaran}</p>
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
    if (!isQuizCompleted) {
        const allQuestionsAnswered = Object.keys(userAnswers).length === activeLesson.kuis.length;
        return (
            <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Uji Pengetahuan Anda!</h3>
                {activeLesson.kuis.map((item, index) => (
                    <QuizCard 
                        key={index} 
                        quizItem={item} 
                        questionNumber={index + 1}
                        selectedAnswer={userAnswers[index] || null}
                        isSubmitted={false}
                        onSelectAnswer={(answer) => handleSelectAnswer(index, answer)}
                    />
                ))}
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleSubmitQuiz}
                        disabled={!allQuestionsAnswered}
                        className="px-8 py-3 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-all duration-200 disabled:bg-slate-300 disabled:dark:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Cek Jawaban
                    </button>
                </div>
            </div>
        );
    }

    const score = activeLesson.kuis.reduce((acc, question, index) => {
        return acc + (userAnswers[index] === question.jawabanBenar ? 1 : 0);
    }, 0);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Hasil Kuis</h3>
            <p className={`text-lg font-semibold ${score / activeLesson.kuis.length >= 0.7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                Skor Anda: {score} dari {activeLesson.kuis.length} benar
            </p>
            <div className="my-6 border-t border-slate-200 dark:border-slate-700"></div>
            <div className="space-y-4">
                {activeLesson.kuis.map((question, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = userAnswer === question.jawabanBenar;
                    return (
                        <div key={index} className={`p-4 rounded-lg ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{index + 1}. {question.pertanyaan}</p>
                            <p className={`mt-1 text-sm ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                Jawaban Anda: <span className="font-bold">{userAnswer}</span> {isCorrect ? ' (Benar)' : ' (Salah)'}
                            </p>
                            {!isCorrect && (
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    Jawaban yang benar: <span className="font-bold">{question.jawabanBenar}</span>
                                </p>
                            )}
                            {!isCorrect && (
                                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700/50 flex items-center space-x-2">
                                     <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Perlu bantuan?</span>
                                    <button onClick={() => setActiveTopic('Kosakata')} className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-full transition-colors">Ulas Kosakata</button>
                                    <button onClick={() => setActiveTopic('Tata Bahasa')} className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-full transition-colors">Ulas Tata Bahasa</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 flex justify-end">
                <button 
                    onClick={handleRetryQuiz}
                    className="px-8 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                    Ulangi Kuis
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
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Latihan Selesai!</h3>
                    <p className={`text-xl font-semibold ${score / total >= 0.7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        Skor Anda: {score} dari {total} benar
                    </p>
                    <div className="mt-8 flex justify-center space-x-4">
                        <button 
                            onClick={startPractice}
                            className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors"
                        >
                            Ulangi Latihan
                        </button>
                        <button 
                            onClick={() => {
                                setPracticeState(prev => ({...prev, isActive: false}));
                                setCurrentView('bookmarks');
                            }}
                            className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                           Kembali ke Bookmark
                        </button>
                    </div>
                </div>
            )
        }
        
        const currentCard = practiceState.cards[practiceState.currentIndex];
        const userAnswerInfo = practiceState.userAnswers[practiceState.currentIndex];

        const getButtonClass = (option: string) => {
            if (!practiceState.isCardAnswered) {
                return 'bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600';
            }
            if (option === currentCard.correctAnswer) {
                return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-700';
            }
            if (option === userAnswerInfo.selected) {
                 return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/10 dark:text-red-300 dark:border-red-700';
            }
            return 'bg-white text-slate-500 cursor-default opacity-60 dark:bg-slate-700 dark:text-slate-400 dark:opacity-50';
        };
        
        return (
            <div>
                 <p className="text-right text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    Kartu {practiceState.currentIndex + 1} dari {practiceState.cards.length}
                </p>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-sm font-medium text-rose-500 dark:text-rose-400 mb-4">
                        {
                            currentCard.questionType === 'jepang-to-indonesia' ? 'Apa arti dari kata ini?' :
                            currentCard.questionType === 'indonesia-to-jepang' ? 'Manakah kata Jepang yang benar?' :
                            'Bagaimana cara baca (romaji) kata ini?'
                        }
                    </p>
                    <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-8" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        {currentCard.question}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentCard.options.map((option, index) => (
                             <button
                                key={index}
                                onClick={() => handlePracticeAnswer(option)}
                                disabled={practiceState.isCardAnswered}
                                className={`w-full text-center p-4 rounded-lg border dark:border-slate-600 transition-all duration-200 font-semibold ${getButtonClass(option)} ${!practiceState.isCardAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    {practiceState.isCardAnswered && (
                        <div className="mt-6 text-center">
                             <button 
                                onClick={handleNextCard}
                                className="px-10 py-3 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-all duration-200"
                            >
                                Berikutnya
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
            return (
                <span>
                    {parts.map((part, i) =>
                        part.toLowerCase() === query.toLowerCase() ? (
                            <strong key={i} className="bg-amber-200 dark:bg-amber-400 text-slate-800 dark:text-slate-900 rounded">{part}</strong>
                        ) : (
                            part
                        )
                    )}
                </span>
            );
        };
        
        return (
             <div>
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Hasil Pencarian</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Ditemukan {searchResults.length} hasil untuk <span className="font-semibold text-slate-700 dark:text-slate-200">"{searchQuery}"</span></p>
                </div>
                {searchResults.length === 0 ? (
                    <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-100">Tidak Ada Hasil</h3>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">Coba gunakan kata kunci yang berbeda.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {searchResults.map((result, index) => (
                            <button key={index} onClick={() => handleSearchResultClick(result)} className="w-full text-left bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-rose-500 dark:text-rose-400">{result.lessonTitle}</span>
                                    <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">{result.type}</span>
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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-100 dark:bg-slate-900">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-b md:border-r border-slate-200 dark:border-slate-700 p-4 md:p-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
                 <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>Nihongo AI</h1>
                 <button onClick={onReset} className="text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors md:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h5V4M20 15h-5v5" />
                    </svg>
                 </button>
            </div>
            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </span>
                <input
                    type="search"
                    placeholder="Cari materi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-rose-500 focus:border-rose-500 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
                />
            </div>
            <nav className="space-y-1">
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">Pelajaran</p>
                <div className="px-1 mb-2">
                    <input
                        type="search"
                        placeholder="Filter pelajaran..."
                        value={lessonFilter}
                        onChange={(e) => setLessonFilter(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-rose-500 focus:border-rose-500 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
                    />
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
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
                                <button
                                    key={lesson.nomorPelajaran}
                                    onClick={() => {setActiveLessonIndex(originalIndex); setActiveTopic('Ringkasan'); setCurrentView('lesson');}}
                                    title={`Pelajaran ${lesson.nomorPelajaran}: ${lesson.judul}`}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 truncate ${activeLessonIndex === originalIndex && currentView === 'lesson' && !searchQuery ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                                >
                                    Pelajaran {lesson.nomorPelajaran}: {lesson.judul}
                                </button>
                            )
                        })}
                </div>
                <div className="mt-2">
                    {canLoadMore ? (
                        hasMoreLessons ? (
                            <button
                                onClick={onLoadMore}
                                disabled={isExtending}
                                className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isExtending ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Memuat...
                                    </>
                                ) : 'Muat Pelajaran Selanjutnya'}
                            </button>
                        ) : (
                            <p className="px-3 py-2 text-xs text-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                Anda telah mencapai akhir buku.
                            </p>
                        )
                    ) : (
                        <p className="px-3 py-2 text-xs text-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            Untuk memuat lebih banyak, <button onClick={onReset} className="font-semibold text-rose-500 hover:underline">mulai lagi</button>.
                        </p>
                    )}
                </div>
            </nav>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setCurrentView('bookmarks')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-3 ${currentView === 'bookmarks' && !searchQuery ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    <span>Bookmark Saya</span>
                </button>
            </div>
            <button onClick={onReset} className="hidden md:flex items-center space-x-2 mt-8 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 15h-5v5M4 9h5V4M20 20v-5h-5" />
                 </svg>
                 <span>Mulai Lagi</span>
            </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                {searchQuery.trim() ? renderSearchResults() : (
                    <>
                        {currentView === 'lesson' && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Pelajaran {activeLesson.nomorPelajaran}: {activeLesson.judul}</h2>
                                </div>
                                <div className="flex items-center space-x-2 p-1.5 rounded-full bg-slate-200/75 dark:bg-slate-800 mb-8 w-full overflow-x-auto">
                                    <TopicButton topic="Ringkasan" activeTopic={activeTopic} onClick={setActiveTopic} />
                                    <TopicButton topic="Kosakata" activeTopic={activeTopic} onClick={setActiveTopic} />
                                    <TopicButton topic="Tata Bahasa" activeTopic={activeTopic} onClick={setActiveTopic} />
                                    <TopicButton topic="Kuis" activeTopic={activeTopic} onClick={setActiveTopic} />
                                </div>
                                
                                <div className="break-words">
                                    {activeTopic === 'Ringkasan' && (
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Ringkasan Pelajaran</h3>
                                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{activeLesson.ringkasan}</p>
                                        </div>
                                    )}
                                    {activeTopic === 'Kosakata' && (
                                        <div className="overflow-x-auto">
                                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                                                            <tr>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jepang</th>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Romaji</th>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Indonesia</th>
                                                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Bookmark</span></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                                            {activeLesson.kosakata.map((item, index) => {
                                                                const key = `lesson-${activeLesson.nomorPelajaran}-kosakata-${index}`;
                                                                const isBookmarked = bookmarks.has(key);
                                                                return (
                                                                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{item.jepang}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{item.romaji}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{item.indonesia}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                            <button onClick={() => toggleBookmark(key)} className="p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-400/10 transition-colors" aria-label="Bookmark">
                                                                                <BookmarkIcon isBookmarked={isBookmarked} />
                                                                            </button>
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
                                                const isBookmarked = bookmarks.has(key);
                                                return (
                                                    <div key={index} className="relative bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                                        <div className="absolute top-4 right-4">
                                                            <button onClick={() => toggleBookmark(key)} className="p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-400/10 transition-colors" aria-label="Bookmark">
                                                                <BookmarkIcon isBookmarked={isBookmarked} />
                                                            </button>
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-rose-600 dark:text-rose-400 mb-2 pr-8" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{item.pola}</h3>
                                                        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{item.penjelasan}</p>
                                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4 space-y-3">
                                                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Contoh:</h4>
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
                                <div className="mt-8 flex justify-between items-center">
                                    <button 
                                        onClick={handlePreviousLesson}
                                        disabled={isFirstLesson}
                                        className="inline-flex items-center px-6 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 -ml-1 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                        Sebelumnya
                                    </button>
                                    <button 
                                        onClick={() => handleNextLesson()}
                                        disabled={isLastLesson}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Berikutnya
                                        <svg xmlns="http://www.w3.org/2000/svg" className="ml-3 -mr-1 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}
                        {currentView === 'bookmarks' && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Bookmark Saya</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Materi penting yang Anda simpan untuk dipelajari kembali.</p>
                                </div>
                                {renderBookmarks()}
                            </>
                        )}
                        {currentView === 'practice' && (
                             <>
                                <div className="mb-6">
                                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Latihan Kosakata</h2>
                                     <p className="text-slate-500 dark:text-slate-400 mt-1">Uji pemahaman kosakata yang telah Anda tandai.</p>
                                </div>
                                {renderPracticeMode()}
                            </>
                        )}
                    </>
                )}
            </div>
        </main>
        <AIChat learningData={learningData} lesson={activeLesson} onGoToNextLesson={handleNextLesson} isLastLesson={isLastLesson} activeTopic={activeTopic} />
    </div>
  );
};

export default LessonView;