import React, { useState, useEffect } from 'react';
import type { GlobalMarketEvent } from '../types';
import { Zap, TrendingDown, TrendingUp } from 'lucide-react';

interface GlobalEventBannerProps {
  event: GlobalMarketEvent;
}

const GlobalEventBanner: React.FC<GlobalEventBannerProps> = ({ event }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, (event.duration - 0.5) * 1000); // Start fade out 0.5s before end

    return () => clearTimeout(timer);
  }, [event]);

  const isShock = event.type === 'shock';
  const bgColor = isShock ? 'bg-red-500/90' : 'bg-green-500/90';
  const Icon = isShock ? TrendingDown : TrendingUp;

  return (
    <div
      className={`w-full max-w-2xl text-white rounded-lg shadow-2xl p-3 flex items-center justify-center gap-4 transition-all duration-500 ${bgColor} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}
    >
      <Icon size={28} className="animate-pulse" />
      <div className="text-center">
        <h3 className="font-bold text-lg">{event.title}</h3>
        <p className="text-sm opacity-90">{event.description}</p>
      </div>
      <div 
        className="absolute bottom-0 left-0 h-1 bg-white/50"
        style={{ animation: `shrink ${event.duration}s linear forwards` }}
      />
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default GlobalEventBanner;