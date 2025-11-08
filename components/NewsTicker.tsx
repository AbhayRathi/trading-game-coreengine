import React from 'react';
import { Newspaper } from 'lucide-react';

interface NewsTickerProps {
  headlines: string[];
  speed: number;
}

const NewsTicker: React.FC<NewsTickerProps> = ({ headlines, speed }) => {
  if (headlines.length === 0) {
    return null;
  }

  // Create a long string for continuous scrolling, repeating the content to avoid gaps
  const tickerContent = Array(3).fill(headlines.join(' ••• ')).join(' ••• ');
  const animationDuration = Math.max(30, headlines.join(' ').length / 4) / speed;

  return (
    <div className="w-full h-10 bg-slate-800 text-white flex items-center overflow-hidden z-20 border-y-2 border-cyan-400/50">
      <div className="flex-shrink-0 bg-cyan-500 h-full flex items-center px-4 font-bold text-sm uppercase">
        <Newspaper size={18} className="mr-2" />
        Alpha Ticker
      </div>
      <div className="flex-grow h-full relative overflow-hidden">
        <p 
          key={tickerContent} // Force re-render on content change
          className="absolute whitespace-nowrap text-lg font-semibold top-1/2 -translate-y-1/2 pausable-animation"
          style={{ animation: `scroll-left ${animationDuration}s linear infinite` }}
        >
          {tickerContent}
        </p>
      </div>
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); } /* Corresponds to one third of the repeated content */
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
