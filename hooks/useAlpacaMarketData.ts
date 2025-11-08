import { useState, useEffect, useCallback, useRef } from 'react';
import type { MarketEvent, AlpacaCreds } from '../types';
import { quizQuestions } from '../data/quizQuestions';
import { generateMarketEventDetails } from '../services/geminiService';

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'NVDA', 'TSLA', 'GOOG', 'LINK', 'AVAX'];
const NEWS_TEMPLATES = [
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

const generatePriceHistory = (isOpportunity: boolean): { time: number; price: number }[] => {
    const history: { time: number; price: number }[] = [];
    let price = 100; // Start price
    const trend = isOpportunity ? 1 : -1;

    for (let i = 0; i < 15; i++) {
        history.push({ time: i, price });
        const volatility = (Math.random() - 0.4) * 5; // -2 to +3
        const drift = (Math.random() * 2) * trend; // Skewed in the direction of the trend
        price += drift + volatility;
        if (price < 10) price = 10; // Floor price
    }
    return history;
};


// Custom hook to simulate a stream of market events from Alpaca.
export const useAlpacaMarketData = (speed: number, isPlaying: boolean, creds: AlpacaCreds) => {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const eventIdCounter = useRef(0);
  const geminiRequestQueue = useRef<(() => Promise<void>)[]>([]);
  const isProcessingQueue = useRef(false);

  const processGeminiQueue = async () => {
    if (isProcessingQueue.current || geminiRequestQueue.current.length === 0) {
        return;
    }
    isProcessingQueue.current = true;
    const task = geminiRequestQueue.current.shift();
    if (task) {
        await task();
    }
    isProcessingQueue.current = false;
  };

  useEffect(() => {
    // Process one request every 15 seconds to stay safely within free tier limits.
    const queueInterval = setInterval(processGeminiQueue, 15000);
    return () => clearInterval(queueInterval);
  }, []);

  const createEvent = useCallback(async () => {
    const id = `event-${eventIdCounter.current++}`;
    const random = Math.random();
    
    // Forcing a mandatory quiz for demo purposes more often
    if ((random < 0.05 || eventIdCounter.current === 2) && quizQuestions.length > 0) {
      return { id, type: 'mandatory_quiz', question: quizQuestions[Math.floor(Math.random() * quizQuestions.length)], lane: -1, faded: false, priceHistory: [] } as MarketEvent;
    }
    if (random < 0.12 && quizQuestions.length > 0) {
      return { id, type: 'quiz', question: quizQuestions[Math.floor(Math.random() * quizQuestions.length)], lane: -1, faded: false, priceHistory: [] } as MarketEvent;
    }
    if (random < 0.22) {
        return { id, type: 'recommendation', text: RECOMMENDATIONS[Math.floor(Math.random() * RECOMMENDATIONS.length)], lane: -1, faded: false, priceHistory: [] } as MarketEvent;
    }

    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const priceChangePercent = (Math.random() - 0.45) * 5; // Skewed slightly positive, from approx -2.25% to +2.75%
    const type = priceChangePercent > 0 ? 'opportunity' : 'trap';
    const value = Math.abs(priceChangePercent * 10) + 5; // P&L value
    
    const newsTemplate = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
    const newsHeadline = newsTemplate.replace('{symbol}', symbol);
    const priceHistory = generatePriceHistory(type === 'opportunity');

    const baseEvent: MarketEvent = {
      id,
      type,
      symbol,
      value: type === 'trap' ? -value : value,
      lane: Math.floor(Math.random() * 3),
      faded: false,
      title: "Market Movement",
      explanation: "Price has changed due to market activity.",
      newsHeadline: newsHeadline,
      priceHistory,
    };
    
    // Queue the Gemini API call
    geminiRequestQueue.current.push(async () => {
        try {
            const jsonResponse = await generateMarketEventDetails(symbol, priceChangePercent, newsHeadline);
            const details = JSON.parse(jsonResponse);
            setEvents(prev => prev.map(e => e.id === id ? { ...e, ...details } : e));
        } catch (error) {
            console.error("Failed to generate event details from Gemini:", error);
            // Even if Gemini fails, the base event is still in the state
        }
    });
    
    return baseEvent;
  }, []);

  useEffect(() => {
    if (!isPlaying || !creds) {
      return;
    }

    const interval = setInterval(async () => {
      const newEvent = await createEvent();
      if (newEvent) {
        setEvents(prevEvents => 
          [...prevEvents.slice(-14), newEvent]
        );
      }
    }, 4000 / speed);

    return () => clearInterval(interval);
  }, [speed, isPlaying, creds, createEvent]);

  return events;
};