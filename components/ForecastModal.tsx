import React from 'react';
import type { ForecastEvent } from '../types';
import { X, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

interface ForecastModalProps {
  isOpen: boolean;
  event: ForecastEvent | null;
  onClose: (prediction: 'bullish' | 'bearish') => void;
}

const ForecastModal: React.FC<ForecastModalProps> = ({ isOpen, event, onClose }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <div 
        className="bg-slate-900 border-2 border-indigo-400/50 rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col text-white animate-fadeInUp"
        style={{ boxShadow: '0 0 40px rgba(129, 140, 248, 0.2)' }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-indigo-300 flex items-center gap-2">
              <HelpCircle size={32} />
              Make Your Forecast
            </h2>
            <p className="text-slate-400 text-xl font-bold ml-1">{event.symbol}</p>
          </div>
        </div>

        <div className="my-4 text-center">
            <p className="text-slate-400 mb-2 text-sm uppercase font-semibold">Developing Story</p>
            <p className="text-lg text-slate-200 leading-relaxed bg-slate-800/50 p-4 rounded-lg">"{event.initialHeadline}"</p>
        </div>
        
        <p className="text-center text-slate-300 mb-6">What will be the market's reaction? A correct prediction will earn a large P&L bonus.</p>
        
        <div className="mt-2 grid grid-cols-2 gap-4 flex-shrink-0">
            <button
                onClick={() => onClose('bearish')}
                className="w-full py-4 bg-orange-500 rounded-full font-semibold text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-lg"
            >
                <TrendingDown size={24} />
                Bearish
            </button>
            <button
                onClick={() => onClose('bullish')}
                className="w-full py-4 bg-green-500 rounded-full font-semibold text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-lg"
            >
                 <TrendingUp size={24} />
                Bullish
            </button>
        </div>
        <style>{`
            @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-fadeInUp {
            animation: fadeInUp 0.3s ease-out forwards;
            }
        `}</style>
      </div>
    </div>
  );
};

export default ForecastModal;
