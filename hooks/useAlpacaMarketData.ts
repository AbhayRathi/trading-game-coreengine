import { useState, useEffect, useCallback, useRef } from 'react';
import type { MarketEvent, AlpacaCreds, GlobalMarketEvent, GameEvent, ForecastEvent, QuizEvent, RecommendationEvent } from '../types';
import { quizQuestions } from '../data/quizQuestions';
import { generateMarketEventDetails, generateForecastHeadlines } from '../services/geminiService';
import { getRecentNewsForSymbol, getInitialPriceHistory } from '../services/alpacaService';

const SYMBOLS = ['NVDA', 'TSLA', 'GOOG', 'MSFT', 'AAPL', 'AMZN', 'META', 'BTC/USD', 'ETH/USD', 'SOL/USD'];
const TECH_SYMBOLS = ['NVDA', 'GOOG', 'MSFT', 'AAPL', 'AMZN', 'META'];

const MOCK_NEWS_HEADLINES = [
    "breaking: {symbol} announces partnership with major tech firm, boosting confidence.",
    "rumor mill: Speculation grows about {symbol}'s upcoming product launch.",
    "analyst report: {symbol} upgraded to 'Buy' rating citing strong growth potential.",
    "macro news: Favorable economic data released, creating positive market sentiment for assets like {symbol}.",
    "tech update: A successful network upgrade for {symbol} has completed ahead of schedule.",
    "regulatory news: Government announces unexpected regulations impacting {symbol} and its sector.",
    "market correction: Broader market downturn pulls {symbol} prices lower.",
    "competitor action: A major competitor to {symbol} releases a groundbreaking product.",
    "security concern: Reports of a minor security vulnerability in {symbol}''s ecosystem are circulating.",
    "profit taking: After a recent rally, investors appear to be taking profits on {symbol}."
];
const RECOMMENDATIONS = [
    "Click the 'Info' button to learn about market trends!",
    "Test your knowledge with a quiz to earn Gemin!",
    "Keeping a winning streak increases your rewards.",
    "Traps will reset your streak. Be careful!",
    "Use your Gemin to unlock new features in the future."
];

// Custom hook to provide market data, either simulated or from live Alpaca stream.
export const useAlpacaMarketData = (speed: number, isPlaying: boolean, creds: AlpacaCreds, activeGlobalEvent: GlobalMarketEvent | null) => {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const eventIdCounter = useRef(0);
  const webSocket = useRef<WebSocket | null>(null);
  const lastPrice = useRef<{ [key: string]: number }>({});
  const isDemoMode = creds.key === 'demo';
  const [marketPulse, setMarketPulse] = useState(0); // -1 for down, 0 for neutral, 1 for up
  const lastSpyPrice = useRef<number | null>(null);
  
  // --- REVISED THROTTLING REFS ---
  const lastGeminiCall = useRef<{ [symbol: string]: number }>({}); // Per-symbol cooldown for live events
  const lastGlobalGeminiCall = useRef<number>(0); // Global cooldown for live events

  const updateEvent = useCallback((updatedEvent: GameEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  }, []);

  const createAndProcessEvent = useCallback((symbol: string, price: number, size: number) => {
    (async () => {
        if (!lastPrice.current[symbol]) {
            const history = await getInitialPriceHistory(symbol, creds);
            if (history.length > 0) {
                lastPrice.current[symbol] = history[history.length - 1].price;
            } else {
                lastPrice.current[symbol] = price;
            }
            return;
        }
    
        const priceChange = price - lastPrice.current[symbol];
        const priceChangePercent = (priceChange / lastPrice.current[symbol]) * 100;
        lastPrice.current[symbol] = price;
        
        const isCrypto = symbol.includes('/');
        const threshold = isCrypto ? 0.02 : 0.01;
        if (Math.abs(priceChangePercent) < threshold) return;
        
        // --- NEW, STRICTER THROTTLING FOR LIVE MODE ---
        const now = Date.now();
        const lastCallTime = lastGeminiCall.current[symbol] ?? 0;
        if (now - lastGlobalGeminiCall.current < 10000) return; // GLOBAL COOLDOWN: At most 1 event every 10 seconds.
        if (now - lastCallTime < 60000) return; // PER-SYMBOL COOLDOWN: At most 1 event per minute for the same symbol.

        lastGlobalGeminiCall.current = now;
        lastGeminiCall.current[symbol] = now;
        
        const id = `event-${eventIdCounter.current++}`;
        let type: 'opportunity' | 'trap' = priceChangePercent > 0 ? 'opportunity' : 'trap';

        if (activeGlobalEvent) {
            if (activeGlobalEvent.type === 'streak' && type === 'trap') return;
            if (activeGlobalEvent.type === 'shock' && type === 'opportunity') return;
        }
        
        const value = Math.abs(priceChangePercent * 10) + (size / 100);

        const baseEvent: MarketEvent = {
            id, type, symbol, value: type === 'trap' ? -value : value,
            lane: Math.floor(Math.random() * 3),
            faded: false, title: symbol, explanation: "Analyzing market data...",
            news: { headline: "Fetching latest news...", source: "", url: "" },
            priceHistory: Array.from({length: 15}, () => ({time: 0, price: lastPrice.current[symbol]})),
        };

        setEvents(prev => [...prev.slice(-14), baseEvent]);

        try {
            const news = await getRecentNewsForSymbol(symbol, creds);
            const [priceHistory, geminiResponse] = await Promise.all([
                getInitialPriceHistory(symbol, creds),
                generateMarketEventDetails(symbol, priceChangePercent, news.headline)
            ]);
            const geminiDetails = JSON.parse(geminiResponse);

            const enrichedEvent: MarketEvent = {
                ...baseEvent,
                ...geminiDetails,
                news,
                priceHistory: priceHistory.length > 0 ? priceHistory : baseEvent.priceHistory,
            };
            
            updateEvent(enrichedEvent);

        } catch (error) {
            console.error(`Failed to enrich event for ${symbol}:`, error);
            updateEvent({ ...baseEvent, title: `${symbol} - Data Error`, explanation: "Could not load full details for this event." });
        }
    })();
  }, [creds, activeGlobalEvent, updateEvent]);
  
  // Effect for Live Mode: Connects to Alpaca WebSocket to generate MarketEvents
  useEffect(() => {
    if (isDemoMode || !isPlaying) {
      if (webSocket.current) {
        webSocket.current.close();
        webSocket.current = null;
      }
      return;
    }

    const ws = new WebSocket('wss://stream.data.alpaca.markets/v2/sip');
    webSocket.current = ws;

    ws.onopen = () => {
      console.log('Alpaca WebSocket connected');
      ws.send(JSON.stringify({ action: 'auth', key: creds.key, secret: creds.secret }));
      ws.send(JSON.stringify({ action: 'subscribe', trades: [...SYMBOLS.filter(s => !s.includes('/')), 'SPY'], quotes: [], bars: [] }));
      ws.send(JSON.stringify({ action: 'subscribe', crypto_trades: SYMBOLS.filter(s => s.includes('/')), crypto_quotes: [], crypto_bars: [] }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        data.forEach(msg => {
          if (msg.S === 'SPY' && msg.p) {
            if (lastSpyPrice.current) {
                if (msg.p > lastSpyPrice.current) setMarketPulse(1);
                else if (msg.p < lastSpyPrice.current) setMarketPulse(-1);
            }
            lastSpyPrice.current = msg.p;
          } else if ((msg.T === 't' || msg.T === 'ct') && msg.p && msg.s) {
            createAndProcessEvent(msg.S, msg.p, msg.s);
          }
        });
      }
    };

    ws.onclose = () => console.log('Alpaca WebSocket disconnected');
    ws.onerror = (error) => console.error('Alpaca WebSocket error:', error);

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [isPlaying, creds, isDemoMode, createAndProcessEvent]);
  
  // --- UNIFIED GAMIFICATION & DEMO LOGIC ---
  const createDemoMarketEvent = useCallback(() => {
    const id = `event-${eventIdCounter.current++}`;

    // Chance to create a global event instead of a market event
    if (Math.random() < 0.15 && !activeGlobalEvent) {
        const isShock = Math.random() > 0.5;
        setEvents(prev => [...prev.slice(-14), {
            id, type: isShock ? 'shock' : 'streak',
            title: isShock ? 'Market Shock!' : 'Sector Rally!',
            description: isShock ? 'Negative news drags market down!' : 'Tech sector booms on breakthrough news!',
            duration: 20, active: true, lane: -1
        } as GlobalMarketEvent]);
        return;
    }

    let symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    let priceChangePercent = (Math.random() - 0.45) * 5;

    if (activeGlobalEvent) {
        if (activeGlobalEvent.type === 'shock') priceChangePercent = -Math.abs(priceChangePercent);
        else {
            priceChangePercent = Math.abs(priceChangePercent);
            symbol = TECH_SYMBOLS[Math.floor(Math.random() * TECH_SYMBOLS.length)];
        }
    }
    
    const type = priceChangePercent > 0 ? 'opportunity' : 'trap';
    const value = Math.abs(priceChangePercent * 10) + 5;
    const newsHeadline = MOCK_NEWS_HEADLINES[Math.floor(Math.random() * MOCK_NEWS_HEADLINES.length)].replace('{symbol}', symbol);
    
    const baseEvent: MarketEvent = {
        id, type, symbol, value: type === 'trap' ? -value : value, lane: Math.floor(Math.random() * 3),
        faded: false, title: "Market Movement", explanation: "Price has changed.",
        news: { headline: newsHeadline, source: "MarketWatch", url: "" }, priceHistory: Array.from({length: 15}, (_, i) => ({time: i, price: 100 + Math.sin(i) * priceChangePercent + (Math.random()-0.5) * 2})),
    };

    setEvents(prev => [...prev.slice(-14), baseEvent]);
    
    generateMarketEventDetails(symbol, priceChangePercent, newsHeadline).then(jsonResponse => {
        const details = JSON.parse(jsonResponse);
        updateEvent({ ...baseEvent, ...details });
    }).catch(err => console.error("Demo Gemini call failed:", err));
  }, [activeGlobalEvent, updateEvent]);
  
  const createForecastEvent = useCallback(() => {
    const id = `event-${eventIdCounter.current++}`;
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    
    generateForecastHeadlines(symbol).then(jsonResponse => {
        const details = JSON.parse(jsonResponse);
        const forecastEvent: ForecastEvent = {
            id, type: 'forecast', symbol, status: 'pending',
            initialHeadline: details.initialHeadline,
            outcome: details.outcome,
            resolutionHeadline: details.resolutionHeadline,
            lane: Math.floor(Math.random() * 3),
            reward: 50 + Math.random() * 50
        };
        setEvents(prev => [...prev.slice(-14), forecastEvent]);
        
        setTimeout(() => {
            updateEvent({ ...forecastEvent, status: 'resolved' });
        }, 8000 / speed);

    }).catch(err => console.error("Forecast Gemini call failed:", err));
  }, [speed, updateEvent]);
  
  const createQuizEvent = useCallback(() => {
      const id = `event-${eventIdCounter.current++}`;
      const question = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
      const quizEvent: QuizEvent = {
          id, type: 'quiz', question, text: 'Test your knowledge!', lane: 0,
      };
      setEvents(prev => [...prev.slice(-14), quizEvent]);
  }, []);

  const createRecommendationEvent = useCallback(() => {
      const id = `event-${eventIdCounter.current++}`;
      const recommendation = RECOMMENDATIONS[Math.floor(Math.random() * RECOMMENDATIONS.length)];
      const recommendationEvent: RecommendationEvent = {
          id, type: 'recommendation', text: recommendation, lane: 0,
      };
      setEvents(prev => [...prev.slice(-14), recommendationEvent]);
  }, []);
  
  // --- NEW UNIFIED GAME LOOP ---
  useEffect(() => {
    if (!isPlaying) return;

    // This loop runs at a calm pace, taking one action every ~30 seconds.
    const gameLoopInterval = setInterval(() => {
        const random = Math.random();

        // Each "tick" has one opportunity to create a major event.
        // This ensures API calls are naturally spaced out.
        if (isDemoMode && random < 0.33) {
            // ~33% chance to generate a Gemini-powered market event in demo mode.
            createDemoMarketEvent();
        } else if (random < 0.66) {
            // ~33% chance to generate a Gemini-powered forecast event (runs in both modes).
            createForecastEvent();
        } else {
            // ~34% chance for a "cheap" event that doesn't use the Gemini API.
            if (Math.random() < 0.5) {
                createQuizEvent();
            } else {
                createRecommendationEvent();
            }
        }
        
        if (isDemoMode) {
            // Also simulate market pulse in demo mode to keep the UI active.
            setMarketPulse(Math.floor(Math.random() * 3) - 1);
        }

    }, 30000 / speed);

    return () => clearInterval(gameLoopInterval);

  }, [isPlaying, speed, isDemoMode, activeGlobalEvent, createDemoMarketEvent, createForecastEvent, createQuizEvent, createRecommendationEvent]);


  return { events, marketPulse, updateEvent };
};
