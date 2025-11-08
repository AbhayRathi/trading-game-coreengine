import { useState, useEffect, useCallback, useRef } from 'react';
import type { MarketEvent, AlpacaCreds } from '../types';
import { quizQuestions } from '../data/quizQuestions';
import { generateMarketEventDetails } from '../services/geminiService';
import { getRecentNewsForSymbol, getInitialPriceHistory } from '../services/alpacaService';

const SYMBOLS = ['NVDA', 'TSLA', 'GOOG', 'MSFT', 'AAPL', 'AMZN', 'META', 'BTC/USD', 'ETH/USD', 'SOL/USD'];
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
export const useAlpacaMarketData = (speed: number, isPlaying: boolean, creds: AlpacaCreds) => {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const eventIdCounter = useRef(0);
  const webSocket = useRef<WebSocket | null>(null);
  const lastPrice = useRef<{ [key: string]: number }>({});
  const isDemoMode = creds.key === 'demo';

  const createAndProcessEvent = useCallback(async (symbol: string, price: number, size: number) => {
    if (!lastPrice.current[symbol]) {
        lastPrice.current[symbol] = price;
        return; // Wait for the next tick to calculate change
    }
    
    const priceChange = price - lastPrice.current[symbol];
    const priceChangePercent = (priceChange / lastPrice.current[symbol]) * 100;
    lastPrice.current[symbol] = price;
    
    // Trigger event only on significant moves
    if (Math.abs(priceChangePercent) < 0.05) return;
    
    const id = `event-${eventIdCounter.current++}`;
    const type = priceChangePercent > 0 ? 'opportunity' : 'trap';
    const value = Math.abs(priceChangePercent * 10) + (size / 100); // P&L value based on change and size
    
    try {
        const [news, priceHistory] = await Promise.all([
            getRecentNewsForSymbol(symbol, creds),
            getInitialPriceHistory(symbol, creds)
        ]);

        const baseEvent: MarketEvent = {
            id, type, symbol,
            value: type === 'trap' ? -value : value,
            lane: Math.floor(Math.random() * 3),
            faded: false,
            title: "Market Movement",
            explanation: "Price has changed due to market activity.",
            news, priceHistory,
        };
        
        // Add event to state immediately for responsiveness
        setEvents(prev => [...prev.slice(-14), baseEvent]);

        // Then, enhance with Gemini
        const jsonResponse = await generateMarketEventDetails(symbol, priceChangePercent, news.headline);
        const details = JSON.parse(jsonResponse);
        setEvents(prev => prev.map(e => e.id === id ? { ...e, ...details } : e));

    } catch (error) {
        console.error(`Failed to process event for ${symbol}:`, error);
    }

  }, [creds]);

  // WebSocket connection logic for live paper trading
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
      ws.send(JSON.stringify({
        action: 'auth',
        key: creds.key,
        secret: creds.secret
      }));
      ws.send(JSON.stringify({
        action: 'subscribe',
        trades: SYMBOLS.filter(s => !s.includes('/')), // Alpaca stock symbols
        quotes: [],
        bars: []
      }));
       ws.send(JSON.stringify({
        action: 'subscribe',
        crypto_trades: SYMBOLS.filter(s => s.includes('/')), // Alpaca crypto symbols
        crypto_quotes: [],
        crypto_bars: []
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        data.forEach(msg => {
          if ((msg.T === 't' || msg.T === 'ct') && msg.p && msg.s) {
            // It's a stock or crypto trade message
            createAndProcessEvent(msg.S, msg.p, msg.s);
          }
        });
      }
    };

    ws.onclose = () => {
      console.log('Alpaca WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('Alpaca WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isPlaying, creds, isDemoMode, createAndProcessEvent]);


  // Demo mode logic
  useEffect(() => {
    if (!isPlaying || !isDemoMode) {
      return;
    }

    const interval = setInterval(() => {
        const id = `event-${eventIdCounter.current++}`;
        const random = Math.random();
        
        if (random < 0.15) { // Occasional quiz/recommendation
            const type = random < 0.05 ? 'quiz' : 'recommendation';
            const eventData = type === 'quiz' 
                ? { question: quizQuestions[Math.floor(Math.random() * quizQuestions.length)] } 
                : { text: RECOMMENDATIONS[Math.floor(Math.random() * RECOMMENDATIONS.length)] };
            setEvents(prev => [...prev.slice(-14), { id, type, lane: -1, faded: false, ...eventData } as MarketEvent]);
            return;
        }

        const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const priceChangePercent = (Math.random() - 0.45) * 5;
        const type = priceChangePercent > 0 ? 'opportunity' : 'trap';
        const value = Math.abs(priceChangePercent * 10) + 5;
        const newsHeadline = MOCK_NEWS_HEADLINES[Math.floor(Math.random() * MOCK_NEWS_HEADLINES.length)].replace('{symbol}', symbol);
        
        const baseEvent: MarketEvent = {
            id, type, symbol,
            value: type === 'trap' ? -value : value,
            lane: Math.floor(Math.random() * 3),
            faded: false,
            title: "Market Movement",
            explanation: "Price has changed due to market activity.",
            news: { headline: newsHeadline, source: "MarketWatch", url: "" },
            priceHistory: [], // In demo, we don't fetch historicals.
        };

        setEvents(prev => [...prev.slice(-14), baseEvent]);
        
        // Simulate Gemini call
        generateMarketEventDetails(symbol, priceChangePercent, newsHeadline).then(jsonResponse => {
            const details = JSON.parse(jsonResponse);
            setEvents(prev => prev.map(e => e.id === id ? { ...e, ...details } : e));
        }).catch(err => console.error("Demo Gemini call failed:", err));

    }, 4000 / speed);

    return () => clearInterval(interval);
  }, [speed, isPlaying, isDemoMode]);

  return events;
};