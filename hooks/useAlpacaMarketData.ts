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
  
  // *** RE-ARCHITECTED PRICE STORAGE ***
  // This now holds the most recent price from the WebSocket for all symbols.
  const lastPrice = useRef<{ [key: string]: number }>({}); 
  // This holds the price at the time an event was last created for a symbol.
  const eventCreationPrice = useRef<{ [key: string]: number }>({});
  
  const isDemoMode = creds.key === 'demo';
  const [marketPulse, setMarketPulse] = useState(0); 
  const lastSpyPrice = useRef<number | null>(null);
  

  const updateEvent = useCallback((updatedEvent: GameEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  }, []);

  // --- UNIFIED MARKET EVENT CREATION LOGIC ---
  const createMarketEvent = useCallback(async (symbol: string) => {
    let priceChangePercent: number;
    let currentPrice: number;

    if (isDemoMode) {
      // --- DEMO MODE LOGIC ---
      currentPrice = 100 + (Math.random() - 0.5) * 20; // Simulate a base price
      priceChangePercent = (Math.random() - 0.45) * 5;
    } else {
      // --- LIVE MODE LOGIC ---
      currentPrice = lastPrice.current[symbol];
      const previousPrice = eventCreationPrice.current[symbol] ?? currentPrice;
      
      if (!currentPrice || !previousPrice) return; // Not enough data yet
      
      // We still calculate the change to determine event type/value, 
      // but no longer filter out events based on a threshold.
      const priceChange = currentPrice - previousPrice;
      priceChangePercent = (priceChange / previousPrice) * 100;
    }

    eventCreationPrice.current[symbol] = currentPrice; // Update the price at which we last created an event

    const id = `event-${eventIdCounter.current++}`;
    let type: 'opportunity' | 'trap' = priceChangePercent > 0 ? 'opportunity' : 'trap';
    
    // Global event modifiers
    if (activeGlobalEvent) {
      if (activeGlobalEvent.type === 'streak' && type === 'trap') return; // Suppress traps during streak
      if (activeGlobalEvent.type === 'shock' && type === 'opportunity') return; // Suppress opportunities during shock
    }
    
    const value = Math.abs(priceChangePercent * 10) + 5;
    
    // Use a mock headline for demo, fetch real news for live
    const newsHeadline = isDemoMode 
        ? MOCK_NEWS_HEADLINES[Math.floor(Math.random() * MOCK_NEWS_HEADLINES.length)].replace('{symbol}', symbol)
        : (await getRecentNewsForSymbol(symbol, creds)).headline;

    const baseEvent: MarketEvent = {
        id, type, symbol, value: type === 'trap' ? -value : value,
        lane: Math.floor(Math.random() * 3),
        faded: false, title: symbol, explanation: "Analyzing market data...",
        news: { headline: newsHeadline, source: "...", url: "" },
        priceHistory: Array.from({length: 15}, () => ({time: 0, price: currentPrice})),
    };

    setEvents(prev => [...prev.slice(-14), baseEvent]);

    try {
      const [priceHistory, geminiResponse] = await Promise.all([
          isDemoMode 
            ? Promise.resolve(Array.from({length: 15}, (_, i) => ({time: i, price: currentPrice + Math.sin(i) * priceChangePercent + (Math.random()-0.5) * 2})))
            : getInitialPriceHistory(symbol, creds),
          generateMarketEventDetails(symbol, priceChangePercent, newsHeadline)
      ]);
      const geminiDetails = JSON.parse(geminiResponse);
      const newsDetails = isDemoMode ? { source: "MarketWatch", url: "" } : await getRecentNewsForSymbol(symbol, creds);

      const enrichedEvent: MarketEvent = {
          ...baseEvent,
          ...geminiDetails,
          news: newsDetails,
          priceHistory: priceHistory.length > 0 ? priceHistory : baseEvent.priceHistory,
      };
      
      updateEvent(enrichedEvent);
    } catch (error) {
        console.error(`Failed to enrich event for ${symbol}:`, error);
        updateEvent({ ...baseEvent, title: `${symbol} - Data Error`, explanation: "Could not load full details for this event." });
    }
  }, [creds, activeGlobalEvent, updateEvent, isDemoMode]);


  // --- WEBSOCKET'S NEW JOB: PASSIVE DATA PROVIDER ---
  useEffect(() => {
    if (isDemoMode || !isPlaying) {
      webSocket.current?.close();
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
          // Update market pulse based on SPY
          if (msg.S === 'SPY' && msg.p) {
            if (lastSpyPrice.current) {
              setMarketPulse(msg.p > lastSpyPrice.current ? 1 : -1);
            }
            lastSpyPrice.current = msg.p;
          } 
          // Store the latest price for all symbols
          else if ((msg.T === 't' || msg.T === 'ct') && msg.p && msg.S) {
            lastPrice.current[msg.S] = msg.p;
          }
        });
      }
    };

    ws.onclose = () => console.log('Alpaca WebSocket disconnected');
    ws.onerror = (error) => console.error('Alpaca WebSocket error:', error);

    return () => ws.close();
  }, [isPlaying, creds, isDemoMode]);
  
  // --- GAMIFICATION EVENT CREATORS (Unchanged) ---
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

    // This single loop now drives event creation for BOTH modes.
    const gameLoopInterval = setInterval(() => {
        const random = Math.random();
        
        // This ensures a steady stream of varied events.
        if (random < 0.5) { // 50% chance to create a tradeable market event
            const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            createMarketEvent(symbol);
        } else if (random < 0.75) { // 25% chance for a forecast
            createForecastEvent();
        } else { // 25% chance for a "cheap" non-API event
            if (Math.random() < 0.5) createQuizEvent();
            else createRecommendationEvent();
        }
        
    }, 15000 / speed); // A more engaging pace of ~15 seconds per event

    return () => clearInterval(gameLoopInterval);

  }, [isPlaying, speed, createMarketEvent, createForecastEvent, createQuizEvent, createRecommendationEvent]);

  return { events, marketPulse, updateEvent };
};