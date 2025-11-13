
import React from 'react';
import { QuizItem } from '../types';

interface QuizCardProps {
  quizItem: QuizItem;
  questionNumber: number;
  selectedAnswer: string | null;
  isSubmitted: boolean;
  onSelectAnswer: (answer: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quizItem, questionNumber, selectedAnswer, isSubmitted, onSelectAnswer }) => {

  const getButtonClass = (pilihan: string) => {
    // Setelah kuis disubmit, tunjukkan jawaban benar dan salah
    if (isSubmitted) {
      if (pilihan === quizItem.jawabanBenar) {
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-700';
      }
      if (pilihan === selectedAnswer && pilihan !== quizItem.jawabanBenar) {
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/10 dark:text-red-300 dark:border-red-700';
      }
      return 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-default';
    }

    // Sebelum kuis disubmit, hanya sorot pilihan pengguna
    if (selectedAnswer === pilihan) {
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-600';
    }
    return 'bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200';
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 mb-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
        <span className="text-rose-500 font-bold">{questionNumber}.</span> {quizItem.pertanyaan}
      </h3>
      <div className="space-y-3">
        {quizItem.pilihan.map((pilihan, index) => (
          <button
            key={index}
            onClick={() => onSelectAnswer(pilihan)}
            disabled={isSubmitted}
            className={`w-full text-left p-3 rounded-lg border dark:border-slate-600 transition-all duration-200 ${getButtonClass(pilihan)} ${!isSubmitted ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {pilihan}
          </button>
        ))}
      </div>
       {isSubmitted && selectedAnswer !== quizItem.jawabanBenar && (
         <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10 p-3 rounded-lg">
           Jawaban yang benar: <span className="font-bold">{quizItem.jawabanBenar}</span>
        </p>
      )}
    </div>
  );
};

export default QuizCard;
