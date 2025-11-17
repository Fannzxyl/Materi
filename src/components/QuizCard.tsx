
import React from 'react';
import { QuizItem } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface QuizCardProps {
  quizItem: QuizItem;
  questionNumber: number;
  selectedAnswer: string | null;
  isSubmitted: boolean;
  onSelectAnswer: (answer: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quizItem, questionNumber, selectedAnswer, isSubmitted, onSelectAnswer }) => {
  const { t } = useSettings();

  const getButtonClass = (pilihan: string) => {
    // Submitted state styles
    if (isSubmitted) {
      if (pilihan === quizItem.jawabanBenar) {
        return 'bg-emerald-500/30 text-emerald-800 border-emerald-500 dark:text-emerald-200 dark:border-emerald-500';
      }
      if (pilihan === selectedAnswer && pilihan !== quizItem.jawabanBenar) {
        return 'bg-red-500/30 text-red-800 border-red-500 dark:text-red-200 dark:border-red-500';
      }
      return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 cursor-default border-transparent';
    }

    // Interactive state styles
    if (selectedAnswer === pilihan) {
        return 'bg-rose-500/20 text-rose-800 border-rose-500 dark:text-rose-200 dark:border-rose-500';
    }
    return 'bg-white/50 hover:bg-white/80 text-slate-700 dark:bg-slate-700/30 dark:hover:bg-slate-700/50 dark:text-slate-200 border-slate-300 dark:border-slate-600';
  };

  return (
    <div className="glass-panel p-6 rounded-xl shadow-md mb-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
        <span className="text-rose-500 font-bold">{questionNumber}.</span> {quizItem.pertanyaan}
      </h3>
      <div className="space-y-3">
        {quizItem.pilihan.map((pilihan, index) => (
          <button
            key={index}
            onClick={() => onSelectAnswer(pilihan)}
            disabled={isSubmitted}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${getButtonClass(pilihan)} ${!isSubmitted ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {pilihan}
          </button>
        ))}
      </div>
       {isSubmitted && selectedAnswer !== quizItem.jawabanBenar && (
         <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10 p-3 rounded-lg">
           {t('quiz_results_correct_answer')}: <span className="font-bold">{quizItem.jawabanBenar}</span>
        </p>
      )}
    </div>
  );
};

export default QuizCard;