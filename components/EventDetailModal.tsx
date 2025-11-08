import React, { useState, useEffect, useMemo } from 'react';
import type { MarketEvent, ChartAnalysis } from '../types';
import { X, TrendingUp, TrendingDown, BookOpen, Newspaper, Loader2, ExternalLink, Minus, Plus } from 'lucide-react';
import { generateChartAnalysis } from '../services/geminiService';
import DetailedChart from './DetailedChart';

interface EventDetailModalProps {
  isOpen: boolean;
  event: MarketEvent | null;
  onClose: (tradeDetails: { execute: boolean; quantity: number; stopLoss?: number; }) => void;
  onAnalysisComplete: (eventId: string, analysis: ChartAnalysis) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, event, onClose, onAnalysisComplete }) => {
  const [analysis, setAnalysis] = useState<ChartAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [stopLoss, setStopLoss] = useState('');
  const [stopLossError, setStopLossError] = useState('');

  const currentPrice = useMemo(() => {
    if (!event?.priceHistory || event.priceHistory.length === 0) return null;
    return event.priceHistory[event.priceHistory.length - 1].price;
  }, [event]);

  useEffect(() => {
    if (isOpen && event) {
      // Reset state for new modal instance
      setQuantity(1);
      setStopLoss('');
      setStopLossError('');
      
      if (event.analysis) {
        setAnalysis(event.analysis);
        return;
      }
      
      const fetchAnalysis = async () => {
        setIsLoading(true);
        setAnalysis(null);
        try {
          const jsonResponse = await generateChartAnalysis(event);
          const fetchedAnalysis = JSON.parse(jsonResponse) as ChartAnalysis;
          setAnalysis(fetchedAnalysis);
          onAnalysisComplete(event.id, fetchedAnalysis);
        } catch (error) {
          console.error("Failed to generate chart analysis:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAnalysis();
    }
  }, [isOpen, event, onAnalysisComplete]);
  
  // Validate Stop Loss
  useEffect(() => {
    if (!stopLoss || !currentPrice || !event) {
        setStopLossError('');
        return;
    }
    const stopPrice = parseFloat(stopLoss);
    if (isNaN(stopPrice)) {
        setStopLossError('Must be a number.');
        return;
    }

    if (event.type === 'opportunity' && stopPrice >= currentPrice) {
        setStopLossError(`For a buy, stop must be < ${currentPrice.toFixed(2)}`);
    } else if (event.type === 'trap' && stopPrice <= currentPrice) {
        setStopLossError(`For a sell, stop must be > ${currentPrice.toFixed(2)}`);
    } else {
        setStopLossError('');
    }
  }, [stopLoss, currentPrice, event]);


  if (!isOpen || !event) return null;

  const handleExecute = () => {
      if (stopLossError) return;
      const stopLossValue = stopLoss ? parseFloat(stopLoss) : undefined;
      onClose({ execute: true, quantity, stopLoss: stopLossValue });
  }

  const isOpportunity = event.type === 'opportunity';
  const titleColor = isOpportunity ? 'text-green-500' : 'text-orange-500';
  const buttonClass = isOpportunity 
    ? 'bg-green-500 hover:bg-green-600' 
    : 'bg-orange-500 hover:bg-orange-600';
  const Icon = isOpportunity ? TrendingUp : TrendingDown;
  
  const formattedSymbol = event.symbol?.replace('/', '');
  const potentialPnl = event.value! * quantity;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <div 
        className="bg-slate-900 border-2 border-cyan-400/50 rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] p-6 flex flex-col text-white animate-fadeInUp"
        style={{ boxShadow: '0 0 40px rgba(34, 211, 238, 0.2)' }}
      >
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
          <div>
            <h2 className={`text-3xl font-bold ${titleColor} flex items-center gap-2`}>
              <Icon size={32} />
              Market Analysis
            </h2>
            <p className="text-slate-400 text-xl font-bold ml-1">{event.symbol} @ ${currentPrice?.toFixed(2)}</p>
          </div>
          <button onClick={() => onClose({ execute: false, quantity: 0 })} className="text-slate-400 hover:text-white">
            <X size={28} />
          </button>
        </div>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
          {/* Chart */}
          <div className="lg:col-span-3 bg-slate-800/50 rounded-lg p-4 flex flex-col items-center justify-center">
            {isLoading && <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />}
            {!isLoading && analysis && event.priceHistory.length > 1 && (
              <DetailedChart 
                priceHistory={event.priceHistory}
                annotations={analysis.annotations}
                isOpportunity={isOpportunity}
              />
            )}
             {!isLoading && (!analysis || event.priceHistory.length <= 1) && (
                <div className="text-center text-slate-400">
                    <p>Live data streaming...</p>
                    <p className="text-xs">Chart requires more historical data to display.</p>
                </div>
            )}
          </div>

          {/* Analysis & News */}
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto pr-2">
             {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>}
             {!isLoading && (analysis || event.analysis) && (
                <>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-cyan-300 mb-1">AI Analysis</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">{(analysis || event.analysis)?.analysisText}</p>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-cyan-300 mb-1 flex items-center gap-2"><BookOpen size={16} /> {(analysis || event.analysis)?.keyConcept.title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">{(analysis || event.analysis)?.keyConcept.explanation}</p>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-cyan-300 mb-2 flex items-center gap-2"><Newspaper size={16} /> Live News</h3>
                        <div className="space-y-2 text-sm">
                            <p className="text-slate-300">"{event.news.headline}"</p>
                            <p className="text-xs text-slate-500 font-semibold uppercase">{event.news.source}</p>
                        </div>
                    </div>
                </>
             )}
          </div>
        </div>
        
        {/* Trade Controls */}
        <div className="mt-4 pt-4 border-t border-cyan-400/50 grid grid-cols-1 md:grid-cols-2 gap-4 items-center flex-shrink-0">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300">Quantity (Shares)</label>
                <div className="flex items-center gap-2">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-md hover:bg-slate-600"><Minus size={16}/></button>
                    <input 
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center bg-slate-800 border border-slate-600 rounded-md p-2"
                    />
                    <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-md hover:bg-slate-600"><Plus size={16}/></button>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300">Stop Loss (Optional)</label>
                <input 
                    type="number"
                    placeholder="Set stop price"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    disabled={!currentPrice}
                    className={`w-full bg-slate-800 border ${stopLossError ? 'border-red-500' : 'border-slate-600'} rounded-md p-2 placeholder-slate-500 disabled:bg-slate-800/50`}
                />
                {stopLossError && <p className="text-xs text-red-500">{stopLossError}</p>}
            </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 flex-shrink-0">
            <button
                onClick={() => onClose({ execute: false, quantity: 0 })}
                className="w-full py-3 bg-slate-700 rounded-full font-semibold text-slate-300 hover:bg-slate-600 transition-colors"
            >
                Ignore
            </button>
            <button
                onClick={handleExecute}
                disabled={!!stopLossError}
                className={`w-full py-3 ${buttonClass} rounded-full font-semibold text-white transition-colors flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed`}
            >
                <Icon size={20} />
                Execute ({potentialPnl > 0 ? `+${potentialPnl.toFixed(2)}` : potentialPnl.toFixed(2)} P&L)
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

export default EventDetailModal;