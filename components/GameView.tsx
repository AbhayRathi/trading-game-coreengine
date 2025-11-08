import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Background from './Background';
import Hud from './Hud';
import ActionCenter from './ActionCenter';
import RecommendationToast from './RecommendationToast';
import RememberCard from './RememberCard';
import QuizModal from './QuizModal';
import EventDetailModal from './EventDetailModal';
import ForecastModal from './ForecastModal';
import MiniChart from './MiniChart';
import GlobalEventBanner from './GlobalEventBanner';
import NewsTicker from './NewsTicker';
import { useAlpacaMarketData } from '../hooks/useAlpacaMarketData';
import { generateKeyTakeaway, generateLiveNewsHeadlines } from '../services/geminiService';
import { getAlpacaAccount, placeAlpacaOrder, closeAllPositions } from '../services/alpacaService';
import type { PlayerStats, GameSettings, QuizQuestion, MarketEvent, KeyTakeaway, AlpacaCreds, GameEffect, GlobalMarketEvent, PlayerPerks, GameEvent, ForecastEvent, QuizEvent, RecommendationEvent } from '../types';
import { quizQuestions } from '../data/quizQuestions';
import { HelpCircle, Eye, EyeOff, GitCommit } from 'lucide-react';

const STREAK_FOR_POWERUP = 5;
const TRAP_VALUE_FOR_GLITCH = -50;

interface GameViewProps {
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  settings: GameSettings;
  perks: PlayerPerks;
  onOpenSettings: () => void;
  onOpenInfo: (topic: string) => void;
  onEndSession: () => void;
  backgroundImage: string | null;
  alpacaCreds: AlpacaCreds;
}

const GameView: React.FC<GameViewProps> = ({ stats, setStats, settings, perks, onOpenSettings, onOpenInfo, onEndSession, backgroundImage, alpacaCreds }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [activeQuizEventId, setActiveQuizEventId] = useState<string | null>(null);
  const [keyTakeaways, setKeyTakeaways] = useState<KeyTakeaway[]>([]);
  const [activeMandatoryQuizId, setActiveMandatoryQuizId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<ForecastEvent | null>(null);
  const [completedQuizIds, setCompletedQuizIds] = useState<Set<string>>(new Set());
  
  const [activeEffects, setActiveEffects] = useState<GameEffect[]>([]);
  const [globalEvent, setGlobalEvent] = useState<GlobalMarketEvent | null>(null);
  const [headlines, setHeadlines] = useState<string[]>([]);
  
  const isDemo = alpacaCreds.key === 'demo';
  const { events, marketPulse, updateEvent } = useAlpacaMarketData(settings.speed, !isPaused && !isQuizOpen && !selectedEvent && !selectedForecast, alpacaCreds, globalEvent);
  
  const POWERUPS: Record<'MARKET_SIGHT', GameEffect> = {
    'MARKET_SIGHT': { id: 'MARKET_SIGHT', type: 'powerup', name: 'Market Sight', description: 'Reveals all event details for a short time.', duration: 15 + (perks.longerPowerups ? 5 : 0), icon: Eye },
  };
  const GLITCHES: Record<'MARKET_FOG', GameEffect> = {
    'MARKET_FOG': { id: 'MARKET_FOG', type: 'glitch', name: 'Market Fog', description: 'Hides event details, increasing uncertainty.', duration: 20 - (perks.shorterGlitches ? 5 : 0), icon: EyeOff },
  };

  useEffect(() => {
    const fetchHeadlines = async () => {
        try {
            const response = await generateLiveNewsHeadlines();
            const newHeadlines = JSON.parse(response);
            setHeadlines(newHeadlines);
        } catch (error) {
            console.error("Failed to fetch news headlines:", error);
            setHeadlines(["Market data is currently being analyzed...", "Economic indicators show mixed signals...", "Tech sector sees increased volatility..."]);
        }
    };

    fetchHeadlines(); // Fetch on initial load
    const interval = setInterval(fetchHeadlines, 45000); // Fetch every 45 seconds

    return () => clearInterval(interval);
  }, []);

  // Sync with Alpaca account on start and periodically
  useEffect(() => {
    if (isDemo) return;
    
    const syncAccount = async () => {
        try {
            const account = await getAlpacaAccount(alpacaCreds);
            setStats(prev => ({...prev, equity: account.equity}));
        } catch (error) {
            console.error("Failed to sync Alpaca account:", error);
            // Handle error, maybe show a notification to the user
        }
    };

    syncAccount(); // Sync on component mount
    const interval = setInterval(syncAccount, 5000); // Sync every 5 seconds
    return () => clearInterval(interval);
  }, [alpacaCreds, setStats, isDemo]);


  const isEvent = <T extends GameEvent>(type: T['type']) => (event: GameEvent): event is T => event.type === type;

  const marketEvents = useMemo(() => events.filter(isEvent<MarketEvent>('opportunity'))
    .concat(events.filter(isEvent<MarketEvent>('trap'))), [events]);
  const recommendationEvents = useMemo(() => events.filter(isEvent<RecommendationEvent>('recommendation')), [events]);
  const quizEvents = useMemo(() => events.filter(isEvent<QuizEvent>('quiz')).filter(e => !completedQuizIds.has(e.id)), [events, completedQuizIds]);
  const forecastEvents = useMemo(() => events.filter(isEvent<ForecastEvent>('forecast')), [events]);

  useEffect(() => {
    if (activeEffects.length > 0) {
      const timer = setTimeout(() => {
        setActiveEffects(prev => prev.slice(1));
      }, activeEffects[0].duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [activeEffects]);
  
   useEffect(() => {
    const global = events.find(isEvent<GlobalMarketEvent>('shock')) || events.find(isEvent<GlobalMarketEvent>('streak'));
    if (global && (!globalEvent || global.id !== globalEvent.id)) {
      setGlobalEvent(global);
    }
    
    if (globalEvent?.active) {
       const timer = setTimeout(() => {
        setGlobalEvent(null);
      }, globalEvent.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [events, globalEvent]);


  useEffect(() => {
    const mandatoryEvent = events.find(isEvent<QuizEvent>('mandatory_quiz'));
    if (mandatoryEvent && !completedQuizIds.has(mandatoryEvent.id) && !isQuizOpen && !selectedEvent) {
        setActiveMandatoryQuizId(mandatoryEvent.id);
        setQuizQuestion(mandatoryEvent.question);
        setIsQuizOpen(true);
        setIsPaused(true);
    }
  }, [events, isQuizOpen, selectedEvent, completedQuizIds]);


  const handleEventClick = useCallback((eventId: string) => {
    const event = marketEvents.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsPaused(true);
    }
  }, [marketEvents]);

  const handleForecastClick = useCallback((event: ForecastEvent) => {
    if (event.status === 'pending') {
        setSelectedForecast(event);
        setIsPaused(true);
    }
  }, []);

  const handleCloseEventDetail = useCallback(async (didExecute: boolean) => {
    if (didExecute && selectedEvent) {
       if (isDemo) {
            // Original demo logic
            if (selectedEvent.type === 'opportunity') {
                const newStreak = stats.streak + 1;
                setStats(prev => ({
                ...prev,
                equity: prev.equity + selectedEvent.value!,
                streak: newStreak,
                gemin: prev.gemin + 1,
                }));
                if (newStreak > 0 && newStreak % STREAK_FOR_POWERUP === 0) {
                setActiveEffects(prev => [...prev, POWERUPS.MARKET_SIGHT]);
                }
            } else { // trap
                setStats(prev => ({
                ...prev,
                equity: prev.equity + selectedEvent.value!,
                streak: 0,
                }));
                if (selectedEvent.value! < TRAP_VALUE_FOR_GLITCH) {
                setActiveEffects(prev => [...prev, GLITCHES.MARKET_FOG]);
                }
            }
       } else {
            // Live Alpaca trading logic
            try {
                const side = selectedEvent.type === 'opportunity' ? 'buy' : 'sell';
                // For simplicity, we trade 1 share/coin per event.
                // A more advanced implementation could calculate quantity based on event value.
                const quantity = 1;
                await placeAlpacaOrder(selectedEvent.symbol, quantity, side, alpacaCreds);

                // Update streak and other game mechanics based on the action
                 if (side === 'buy') {
                    setStats(prev => ({...prev, streak: prev.streak + 1, gemin: prev.gemin + 1}));
                 } else {
                    setStats(prev => ({...prev, streak: 0}));
                 }

            } catch(error) {
                console.error("Failed to place order:", error);
                // Optionally show an error to the user
            }
       }
    }
    setSelectedEvent(null);
    setIsPaused(false);
  }, [selectedEvent, setStats, stats.streak, POWERUPS.MARKET_SIGHT, GLITCHES.MARKET_FOG, alpacaCreds, isDemo]);

  const handleForecastPredict = useCallback((prediction: 'bullish' | 'bearish') => {
    if (selectedForecast) {
        const updatedEvent: ForecastEvent = { ...selectedForecast, status: 'predicted', prediction };
        updateEvent(updatedEvent);
    }
    setSelectedForecast(null);
    setIsPaused(false);
  }, [selectedForecast, updateEvent]);


  const handleOpenInGameQuiz = useCallback((event: QuizEvent) => {
    if (event.question) {
      setQuizQuestion(event.question);
      setActiveQuizEventId(event.id);
      setIsQuizOpen(true);
      setIsPaused(true);
    }
  }, []);
  
  const handleOpenActionCenterQuiz = useCallback((topic: string) => {
    setIsPaused(true);
    setIsQuizOpen(true);
    // Select a random question from the predefined local list to avoid API calls
    const randomQuestion = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    setQuizQuestion(randomQuestion);
  }, []);

  const handleCloseQuiz = useCallback((isCorrect: boolean) => {
    if (quizQuestion && perks.takeawayArchive) {
      generateKeyTakeaway(quizQuestion)
        .then(response => {
            const takeawayText = JSON.parse(response).takeaway;
            const newTakeaway: KeyTakeaway = {
                id: `takeaway-${Date.now()}`,
                text: takeawayText,
            };
            setKeyTakeaways(prev => [...prev.slice(-4), newTakeaway]);
        })
        .catch(err => console.error("Failed to generate key takeaway:", err));
    }

    if (activeQuizEventId) setCompletedQuizIds(prev => new Set(prev).add(activeQuizEventId));
    if (activeMandatoryQuizId) setCompletedQuizIds(prev => new Set(prev).add(activeMandatoryQuizId));

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
  }, [setStats, quizQuestion, activeQuizEventId, activeMandatoryQuizId, perks.takeawayArchive]);

  const handleDismissTakeaway = useCallback((id: string) => {
    setKeyTakeaways(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleLiquidate = useCallback(async () => {
    if (isDemo) {
        console.log("Liquidation is only available in live mode.");
        return;
    }
    try {
        await closeAllPositions(alpacaCreds);
        // Optionally show a success message
    } catch (error) {
        console.error("Failed to liquidate positions:", error);
        // Optionally show an error message
    }
  }, [alpacaCreds, isDemo]);

  const hasEffect = (id: GameEffect['id']) => activeEffects.some(e => e.id === id);

  const laneStyles = [
    'left-[16.67%] -translate-x-1/2',
    'left-1/2 -translate-x-1/2',
    'left-[83.33%] -translate-x-1/2'
  ];

  return (
    <div className={`relative w-screen h-screen flex flex-col items-center justify-between text-slate-800 font-inter overflow-hidden ${isPaused ? 'game-paused' : ''}`}>
      <Background />
      <Hud stats={stats} activeEffects={activeEffects} marketPulse={marketPulse} />
      
       <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 w-full px-4">
        {globalEvent && <GlobalEventBanner event={globalEvent} />}
        {recommendationEvents.map(rec => (
          <RecommendationToast key={rec.id} text={rec.text!} />
        ))}
        {keyTakeaways.map(takeaway => (
          <RememberCard key={takeaway.id} {...takeaway} onDismiss={handleDismissTakeaway} />
        ))}
      </div>
      
      <div className="absolute top-1/2 -translate-y-1/2 left-0 z-30 flex flex-col gap-4">
        {quizEvents.slice(0, 1).map(event => (
            <button key={event.id} onClick={() => handleOpenInGameQuiz(event)} className="w-48 h-16 bg-purple-400 text-white rounded-r-full flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 animate-slideIn pausable-animation">
                <HelpCircle />
                <span className="font-bold">Quiz Available</span>
            </button>
        ))}
      </div>

      <main className="relative w-full flex-grow" style={{ perspective: '1000px' }}>
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-48 h-96 bg-cyan-400/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-48 h-96 bg-rose-400/20 rounded-full blur-3xl opacity-50" />
        
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg) translateY(-100px) scale(0.9)' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[80%]">
                <div className="absolute inset-0 bg-slate-900/10 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"></div>
                <div className="absolute top-0 left-[33.33%] h-full w-[2px] bg-repeat-y" style={{ backgroundImage: "linear-gradient(to bottom, #a5f3fc 50%, transparent 50%)", backgroundSize: "2px 30px" }}></div>
                <div className="absolute top-0 left-[66.67%] h-full w-[2px] bg-repeat-y" style={{ backgroundImage: "linear-gradient(to bottom, #a5f3fc 50%, transparent 50%)", backgroundSize: "2px 30px" }}></div>
            </div>

          {marketEvents.map(event => {
            const isFogged = hasEffect('MARKET_FOG');
            const showDetails = hasEffect('MARKET_SIGHT') || !isFogged;
            return (
              <div key={event.id} className={`absolute w-1/4 ${laneStyles[event.lane]} pausable-animation`} style={{ animation: `approach ${8 / settings.speed}s linear forwards` }}>
                 <button onClick={() => handleEventClick(event.id)} className={`w-4/5 mx-auto h-24 rounded-2xl flex flex-col p-2 border-2 shadow-md transition-all hover:scale-110 disabled:opacity-50 disabled:pointer-events-none overflow-hidden ${event.type === 'opportunity' ? 'bg-green-400/80 border-green-500' : 'bg-orange-400/80 border-orange-500'} ${isFogged ? 'blur-sm' : ''}`}>
                  <div className="flex justify-between items-center w-full text-white">
                      <span className="font-bold text-lg">{showDetails ? event.symbol : '????'}</span>
                      <span className="text-sm font-semibold">{showDetails ? (event.value! > 0 ? `+${event.value!.toFixed(2)}` : event.value!.toFixed(2)) : '??.?'}</span>
                  </div>
                  <div className="flex-grow w-full h-full opacity-80">
                     <MiniChart data={event.priceHistory} isOpportunity={event.type === 'opportunity'} />
                  </div>
                </button>
              </div>
            );
          })}
          
          {forecastEvents.map(event => {
              let bgColor = 'bg-indigo-400/80 border-indigo-500';
              if (event.status === 'resolved') {
                  const correct = event.prediction === event.outcome;
                  bgColor = correct ? 'bg-yellow-400/80 border-yellow-500' : 'bg-slate-500/80 border-slate-600';
              }
              return (
                  <div key={event.id} className={`absolute w-1/4 ${laneStyles[event.lane]} pausable-animation`} style={{ animation: `approach ${8 / settings.speed}s linear forwards` }}>
                      <button onClick={() => handleForecastClick(event)} disabled={event.status !== 'pending'} className={`w-4/5 mx-auto h-24 rounded-2xl flex flex-col items-center justify-center p-2 border-2 shadow-md transition-all hover:scale-110 disabled:opacity-50 disabled:pointer-events-none overflow-hidden ${bgColor}`}>
                          <GitCommit className="text-white mb-1" />
                          <span className="font-bold text-white text-center text-sm">{event.status === 'pending' ? 'Forecast!' : event.status === 'predicted' ? 'Predicted' : `Resolved: ${event.outcome}`}</span>
                          <span className="text-xs text-white/80">{event.symbol}</span>
                      </button>
                  </div>
              )
          })}

        </div>
      </main>
      
      <NewsTicker headlines={headlines} speed={settings.speed} />
      <QuizModal isOpen={isQuizOpen} question={quizQuestion} onClose={handleCloseQuiz} isMandatory={!!activeMandatoryQuizId} />
      <EventDetailModal isOpen={!!selectedEvent} event={selectedEvent} onClose={handleCloseEventDetail} />
      <ForecastModal isOpen={!!selectedForecast} event={selectedForecast} onClose={handleForecastPredict} />

      <ActionCenter onOpenSettings={onOpenSettings} onOpenInfo={() => onOpenInfo('Market Volatility')} onOpenQuiz={() => handleOpenActionCenterQuiz('Risk Management')} onEndSession={onEndSession} onLiquidate={handleLiquidate} isTtsEnabled={settings.tts} stats={stats} marketEvents={marketEvents} />
      <style>{`
        @keyframes approach { from { top: 0%; transform: scale(0.2); opacity: 1; } 85% { opacity: 1; } to { top: 100%; transform: scale(1.2); opacity: 0; } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .game-paused .pausable-animation { animation-play-state: paused !important; }
      `}</style>
    </div>
  );
};

export default GameView;