import React, { useState, useEffect } from 'react';
import type { QuizQuestion } from '../types';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  question: QuizQuestion | null;
  onClose: (isCorrect: boolean) => void;
  isMandatory?: boolean;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, question, onClose, isMandatory = false }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    // Reset state when a new question is loaded
    if (isOpen) {
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  }, [isOpen, question]);

  if (!isOpen || !question) return null;

  const handleAnswerClick = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    setTimeout(() => {
      onClose(index === question.correctAnswerIndex);
    }, 2000); // Wait 2 seconds before closing
  };
  
  const getButtonClass = (index: number) => {
    if (!isAnswered) {
      return 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700';
    }
    if (index === question.correctAnswerIndex) {
      return 'bg-green-500 border-green-500 text-white';
    }
    if (index === selectedAnswer && index !== question.correctAnswerIndex) {
      return 'bg-orange-500 border-orange-500 text-white';
    }
    return 'bg-slate-200 border-slate-300 opacity-60 text-slate-500';
  }


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg p-6 flex flex-col text-slate-800"
      >
        <h2 className="text-2xl font-bold text-purple-600 mb-4 text-center">
          {isMandatory ? 'Challenge!' : 'Quiz Time!'}
        </h2>
        
        <p className="text-lg text-center mb-6">{question.question}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => handleAnswerClick(index)}
                    disabled={isAnswered}
                    className={`p-4 rounded-xl border-2 font-semibold transition-all duration-300 ${getButtonClass(index)}`}
                >
                    {option}
                </button>
            ))}
        </div>
        
        {isAnswered && (
            <div className="mt-6 text-center flex items-center justify-center gap-2">
                {selectedAnswer === question.correctAnswerIndex ? (
                    <>
                        <CheckCircle className="text-green-500" />
                        <span className="text-green-500 font-bold text-lg">Correct! +10 Gemin</span>
                    </>
                ) : (
                     <>
                        <XCircle className="text-orange-500" />
                        <span className="text-orange-500 font-bold text-lg">Incorrect. Streak reset.</span>
                    </>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default QuizModal;