import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Background from './Background';
import Hud from './Hud';
import ActionCenter from './ActionCenter';
import RecommendationToast from './RecommendationToast';
import RememberCard from './RememberCard';
import QuizModal from './QuizModal';
import EventDetailModal from './EventDetailModal';
import MiniChart from './MiniChart';
import { useAlpacaMarketData } from '../hooks/useAlpacaMarketData';
import { generateQuizQuestion, generateKeyTakeaway } from '../services/geminiService';
import type { PlayerStats, GameSettings, QuizQuestion, MarketEvent, KeyTakeaway, AlpacaCreds } from '../types';
import { HelpCircle } from 'lucide-react';

interface GameViewProps {
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  settings: GameSettings;
  onOpenSettings: () => void;
  onOpenInfo: (topic: string) => void;
  backgroundImage: string | null;
  alpacaCreds: AlpacaCreds;
}

const GameView: React.FC<GameViewProps> = ({ stats, setStats, settings, onOpenSettings, onOpenInfo, backgroundImage, alpacaCreds }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [activeQuizEventId, setActiveQuizEventId] = useState<string | null>(null);
  const [keyTakeaways, setKeyTakeaways] = useState<KeyTakeaway[]>([]);
  const [activeMandatoryQuizId, setActiveMandatoryQuizId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(null);
  const [completedQuizIds, setCompletedQuizIds] = useState<Set<string>>(new Set());

  const allEvents = useAlpacaMarketData(settings.speed, !isPaused && !isQuizOpen && !selectedEvent, alpacaCreds);

  const marketEvents = useMemo(() => allEvents.filter(e => e.type === 'opportunity' || e.type === 'trap'), [allEvents]);
  const recommendationEvents = useMemo(() => allEvents.filter(e => e.type === 'recommendation'), [allEvents]);
  const quizEvents = useMemo(() => allEvents.filter(e => e.type === 'quiz' && !completedQuizIds.has(e.id)), [allEvents, completedQuizIds]);

  useEffect(() => {
    const mandatoryEvent = allEvents.find(e => e.type === 'mandatory_quiz' && !completedQuizIds.has(e.id));
    if (mandatoryEvent && !isQuizOpen && !selectedEvent) {
        setActiveMandatoryQuizId(mandatoryEvent.id);
        setQuizQuestion(mandatoryEvent.question!);
        setIsQuizOpen(true);
        setIsPaused(true);
    }
  }, [allEvents, isQuizOpen, selectedEvent, completedQuizIds]);


  const handleEventClick = useCallback((eventId: string) => {
    const event = marketEvents.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsPaused(true);
    }
  }, [marketEvents]);

  const handleCloseEventDetail = useCallback((didExecute: boolean) => {
    if (didExecute && selectedEvent) {
       if (selectedEvent.type === 'opportunity') {
        setStats(prev => ({
          ...prev,
          pnl: prev.pnl + selectedEvent.value!,
          streak: prev.streak + 1,
          gemin: prev.gemin + 1,
        }));
      } else { // trap
        setStats(prev => ({
          ...prev,
          pnl: prev.pnl + selectedEvent.value!,
          streak: 0,
        }));
      }
    }
    setSelectedEvent(null);
    setIsPaused(false);
  }, [selectedEvent, setStats]);

  const handleOpenInGameQuiz = useCallback((event: MarketEvent) => {
    if (event.question) {
      setQuizQuestion(event.question);
      setActiveQuizEventId(event.id);
      setIsQuizOpen(true);
      setIsPaused(true);
    }
  }, []);
  
  const handleOpenActionCenterQuiz = useCallback(async (topic: string) => {
    setIsPaused(true);
    setIsQuizOpen(true);
    try {
      const jsonResponse = await generateQuizQuestion(topic);
      setQuizQuestion(JSON.parse(jsonResponse));
    } catch (error) {
      console.error("Failed to generate quiz question:", error);
      setQuizQuestion({
        question: "What is a common strategy to mitigate risk in a portfolio?",
        options: ["Putting all money in one stock", "Diversification", "Ignoring market news", "Frequent short-term trading"],
        correctAnswerIndex: 1
      });
    }
  }, []);

  const handleCloseQuiz = useCallback((isCorrect: boolean) => {
    if (quizQuestion) {
      generateKeyTakeaway(quizQuestion)
        .then(response => {
            const takeawayText = JSON.parse(response).takeaway;
            const newTakeaway: KeyTakeaway = {
                id: `takeaway-${Date.now()}`,
                text: takeawayText,
            };
            setKeyTakeaways(prev => [...prev, newTakeaway]);
        })
        .catch(err => console.error("Failed to generate key takeaway:", err));
    }

    if (activeQuizEventId) {
        setCompletedQuizIds(prev => new Set(prev).add(activeQuizEventId));
    }
    if (activeMandatoryQuizId) {
        setCompletedQuizIds(prev => new Set(prev).add(activeMandatoryQuizId));
    }

    setIsQuizOpen(false);
    setQuizQuestion(null);
    setIsPaused(false);
    setActiveQuizEventId(null);
    setActiveMandatoryQuizId(null);
    
    if (isCorrect) {
      setStats(prev => ({ ...prev, gemin: prev.gemin + 10, streak: prev.streak + 1 }));
    } else {
      setStats(prev => ({ ...prev, streak: 0 }));
    }
  }, [setStats, quizQuestion, activeQuizEventId, activeMandatoryQuizId]);

  const handleDismissTakeaway = useCallback((id: string) => {
    setKeyTakeaways(prev => prev.filter(t => t.id !== id));
  }, []);


  const laneStyles = [
    'left-[16.67%] -translate-x-1/2', // Center of first third
    'left-1/2 -translate-x-1/2',        // Center of middle third
    'left-[83.33%] -translate-x-1/2'  // Center of last third
  ];

  return (
    <div className={`relative w-screen h-screen flex flex-col items-center justify-between text-slate-800 font-inter overflow-hidden ${isPaused ? 'game-paused' : ''}`}>
      <Background />
      <Hud stats={stats} />
      
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 w-full px-4">
        {recommendationEvents.map(rec => (
          <RecommendationToast key={rec.id} text={rec.text!} />
        ))}
        {keyTakeaways.map(takeaway => (
          <RememberCard key={takeaway.id} {...takeaway} onDismiss={handleDismissTakeaway} />
        ))}
      </div>
      
      {/* Quiz Lane */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 z-30 flex flex-col gap-4">
        {quizEvents.slice(0, 1).map(event => (
            <button
                key={event.id}
                onClick={() => handleOpenInGameQuiz(event)}
                className="w-48 h-16 bg-purple-400 text-white rounded-r-full flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 animate-slideIn pausable-animation"
            >
                <HelpCircle />
                <span className="font-bold">Quiz Available</span>
            </button>
        ))}
      </div>

      <main className="relative w-full flex-grow" style={{ perspective: '1000px' }}>
        {/* Decorative side glows */}
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-48 h-96 bg-cyan-400/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-48 h-96 bg-rose-400/20 rounded-full blur-3xl opacity-50" />
        
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg) translateY(-100px) scale(0.9)' }}>
          {/* Road and Lanes */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[80%]">
                {/* Road surface */}
                <div className="absolute inset-0 bg-slate-900/10 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"></div>
                {/* Lane markers */}
                <div className="absolute top-0 left-[33.33%] h-full w-[2px] bg-repeat-y" style={{ backgroundImage: "linear-gradient(to bottom, #a5f3fc 50%, transparent 50%)", backgroundSize: "2px 30px" }}></div>
                <div className="absolute top-0 left-[66.67%] h-full w-[2px] bg-repeat-y" style={{ backgroundImage: "linear-gradient(to bottom, #a5f3fc 50%, transparent 50%)", backgroundSize: "2px 30px" }}></div>
            </div>

          {marketEvents.map(event => (
            <div
              key={event.id}
              className={`absolute w-1/4 ${laneStyles[event.lane]} pausable-animation`}
              style={{
                animation: `approach ${8 / settings.speed}s linear forwards`,
              }}
            >
               <button
                onClick={() => handleEventClick(event.id)}
                className={`w-4/5 mx-auto h-24 rounded-2xl flex flex-col p-2 border-2 shadow-md transition-transform hover:scale-110 disabled:opacity-50 disabled:pointer-events-none overflow-hidden ${
                  event.type === 'opportunity'
                    ? 'bg-green-400/80 border-green-500 text-white'
                    : 'bg-orange-400/80 border-orange-500 text-white'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-lg">{event.symbol}</span>
                    <span className="text-sm font-semibold">{event.value! > 0 ? `+${event.value!.toFixed(2)}` : event.value!.toFixed(2)}</span>
                </div>
                <div className="flex-grow w-full h-full opacity-80">
                   <MiniChart data={event.priceHistory} isOpportunity={event.type === 'opportunity'} />
                </div>
              </button>
            </div>
          ))}
        </div>
      </main>

      <QuizModal
        isOpen={isQuizOpen}
        question={quizQuestion}
        onClose={handleCloseQuiz}
        isMandatory={!!activeMandatoryQuizId}
      />
      
      <EventDetailModal
        isOpen={!!selectedEvent}
        event={selectedEvent}
        onClose={handleCloseEventDetail}
      />

      <ActionCenter 
        onOpenSettings={onOpenSettings}
        onOpenInfo={() => onOpenInfo('Market Volatility')}
        onOpenQuiz={() => handleOpenActionCenterQuiz('Risk Management')}
        isTtsEnabled={settings.tts}
        stats={stats}
        marketEvents={marketEvents}
      />
      <style>{`
        @keyframes approach {
          from { 
            top: 0%; 
            transform: scale(0.2); 
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          to { 
            top: 100%; 
            transform: scale(1.2); 
            opacity: 0;
          }
        }
        @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
        }
        .game-paused .pausable-animation {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
};

export default GameView;