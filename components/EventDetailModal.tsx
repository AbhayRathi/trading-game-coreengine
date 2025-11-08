import React, { useState, useEffect } from 'react';
import type { MarketEvent, ChartAnalysis } from '../types';
import { X, TrendingUp, TrendingDown, BookOpen, Newspaper, Loader2, ExternalLink } from 'lucide-react';
import { generateChartAnalysis } from '../services/geminiService';
import DetailedChart from './DetailedChart';

interface EventDetailModalProps {
  isOpen: boolean;
  event: MarketEvent | null;
  onClose: (didExecute: boolean) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, event, onClose }) => {
  const [analysis, setAnalysis] = useState<ChartAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      const fetchAnalysis = async () => {
        setIsLoading(true);
        setAnalysis(null);
        try {
          const jsonResponse = await generateChartAnalysis(event);
          setAnalysis(JSON.parse(jsonResponse));
        } catch (error) {
          console.error("Failed to generate chart analysis:", error);
          // Set a default error state if needed
        } finally {
          setIsLoading(false);
        }
      };
      fetchAnalysis();
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const isOpportunity = event.type === 'opportunity';
  const titleColor = isOpportunity ? 'text-green-500' : 'text-orange-500';
  const buttonClass = isOpportunity 
    ? 'bg-green-500 hover:bg-green-600' 
    : 'bg-orange-500 hover:bg-orange-600';
  const Icon = isOpportunity ? TrendingUp : TrendingDown;
  
  const formattedSymbol = event.symbol?.replace('/', '');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <div 
        className="bg-slate-900 border-2 border-cyan-400/50 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] p-6 flex flex-col text-white animate-fadeInUp"
        style={{ boxShadow: '0 0 40px rgba(34, 211, 238, 0.2)' }}
      >
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
          <div>
            <h2 className={`text-3xl font-bold ${titleColor} flex items-center gap-2`}>
              <Icon size={32} />
              Market Analysis
            </h2>
            <p className="text-slate-400 text-xl font-bold ml-1">{event.symbol}</p>
          </div>
          <button onClick={() => onClose(false)} className="text-slate-400 hover:text-white">
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
            {!isLoading && event.priceHistory.length <= 1 && (
                <div className="text-center text-slate-400">
                    <p>Live data streaming...</p>
                    <p className="text-xs">Chart requires more historical data to display.</p>
                </div>
            )}
          </div>

          {/* Analysis & News */}
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto pr-2">
             {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>}
             {!isLoading && analysis && (
                <>
                    {/* AI Analysis */}
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-cyan-300 mb-1">AI Analysis</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">{analysis.analysisText}</p>
                    </div>

                    {/* Key Concept */}
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-cyan-300 mb-1 flex items-center gap-2"><BookOpen size={16} /> {analysis.keyConcept.title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">{analysis.keyConcept.explanation}</p>
                    </div>

                     {/* Related News */}
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-cyan-300 mb-2 flex items-center gap-2"><Newspaper size={16} /> Live News</h3>
                        <div className="space-y-2">
                            <div className="text-sm">
                                <p className="text-slate-300">"{event.news.headline}"</p>
                                <p className="text-xs text-slate-500 font-semibold uppercase">{event.news.source}</p>
                            </div>
                        </div>
                    </div>

                     {/* External Resources */}
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-cyan-300 mb-2 flex items-center gap-2"><ExternalLink size={16} /> External Resources</h3>
                        <div className="space-y-2 text-sm">
                           {event.news.url && (
                             <a href={event.news.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:underline">
                                Read Full Article <ExternalLink size={14} />
                             </a>
                           )}
                           <a href={`https://www.tradingview.com/chart/?symbol=${formattedSymbol}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:underline">
                                View on TradingView <ExternalLink size={14} />
                            </a>
                            <a href={`https://finance.yahoo.com/quote/${formattedSymbol}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:underline">
                                View on Yahoo Finance <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                </>
             )}
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4 flex-shrink-0">
            <button
                onClick={() => onClose(false)}
                className="w-full py-3 bg-slate-700 rounded-full font-semibold text-slate-300 hover:bg-slate-600 transition-colors"
            >
                Ignore
            </button>
            <button
                onClick={() => onClose(true)}
                className={`w-full py-3 ${buttonClass} rounded-full font-semibold text-white transition-colors flex items-center justify-center gap-2`}
            >
                <Icon size={20} />
                Execute ({event.value! > 0 ? `+${event.value!.toFixed(2)}` : event.value!.toFixed(2)} P&L)
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