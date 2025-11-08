import { useState, useEffect, useCallback, useRef } from 'react';
import type { MarketEvent, AlpacaCreds, GlobalMarketEvent, GameEvent, ForecastEvent } from '../types';
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
    "security concern: Reports of a minor security vulnerability in {symbol}'s ecosystem are circulating.",
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
  
  const updateEvent = useCallback((updatedEvent: GameEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  }, []);

  const createAndProcessEvent = useCallback(async (symbol: string, price: number, size: number) => {
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
    
    if (Math.abs(priceChangePercent) < 0.05) return;
    
    const id = `event-${eventIdCounter.current++}`;
    let type: 'opportunity' | 'trap' = priceChangePercent > 0 ? 'opportunity' : 'trap';

    if (activeGlobalEvent) {
        if (activeGlobalEvent.type === 'streak' && type === 'trap') return;
        if (activeGlobalEvent.type === 'shock' && type === 'opportunity') return;
    }
    
    const value = Math.abs(priceChangePercent * 10) + (size / 100);
    
    try {
        const [news, priceHistory] = await Promise.all([
            getRecentNewsForSymbol(symbol, creds),
            getInitialPriceHistory(symbol, creds)
        ]);

        const baseEvent: MarketEvent = {
            id, type, symbol, value: type === 'trap' ? -value : value,
            lane: Math.floor(Math.random() * 3),
            title: "Market Movement", explanation: "Price has changed due to market activity.",
            news, priceHistory, faded: false
        };
        
        setEvents(prev => [...prev.slice(-14), baseEvent]);

        const jsonResponse = await generateMarketEventDetails(symbol, priceChangePercent, news.headline);
        const details = JSON.parse(jsonResponse);
        updateEvent({ ...baseEvent, ...details });

    } catch (error) {
        console.error(`Failed to process event for ${symbol}:`, error);
    }

  }, [creds, activeGlobalEvent, updateEvent]);

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
        
        // Schedule resolution
        setTimeout(() => {
            setEvents(prev => prev.map(e => {
                if (e.id === id && e.type === 'forecast' && e.status === 'predicted') {
                    return { ...e, status: 'resolved' };
                }
                return e;
            }));
        }, 8000 / speed);

    }).catch(err => console.error("Forecast Gemini call failed:", err));
  }, [speed]);


  useEffect(() => {
    if (!isPlaying || !isDemoMode) return;

    const interval = setInterval(() => {
        const id = `event-${eventIdCounter.current++}`;
        const random = Math.random();
        
        if (random < 0.03 && !activeGlobalEvent) {
             const isShock = Math.random() > 0.5;
            setEvents(prev => [...prev.slice(-14), {
                id, type: isShock ? 'shock' : 'streak',
                title: isShock ? 'Market Shock!' : 'Sector Rally!',
                description: isShock ? 'Negative news drags market down!' : 'Tech sector booms on breakthrough news!',
                duration: 20, active: true, lane: -1
            } as GlobalMarketEvent]);
            return;
        }

        if (random < 0.1) { // 10% chance for a forecast event
            createForecastEvent();
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

    }, 2500 / speed);

    return () => clearInterval(interval);
  }, [speed, isPlaying, isDemoMode, activeGlobalEvent, createForecastEvent, updateEvent]);

  return { events, marketPulse, updateEvent };
};
