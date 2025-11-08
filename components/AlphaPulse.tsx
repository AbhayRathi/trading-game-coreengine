import React from 'react';

interface AlphaPulseProps {
  pulse: number; // -1 for down, 0 for neutral, 1 for up
}

const AlphaPulse: React.FC<AlphaPulseProps> = ({ pulse }) => {
  const pulseColor = pulse > 0 ? 'bg-green-400' : pulse < 0 ? 'bg-red-400' : 'bg-slate-400';
  const pulseShadowColor = pulse > 0 ? 'shadow-[0_0_15px_3px_rgba(74,222,128,0.7)]' : pulse < 0 ? 'shadow-[0_0_15px_3px_rgba(248,113,113,0.7)]' : 'shadow-[0_0_15px_3px_rgba(148,163,184,0.7)]';
  const animationDuration = pulse !== 0 ? 'animate-pulse-fast' : 'animate-pulse-slow';
  
  return (
    <div className="relative flex flex-col items-center group">
        <div 
            className={`w-5 h-5 rounded-full transition-all duration-500 ${pulseColor} ${pulseShadowColor} ${animationDuration}`}
        />
        <p className="text-xs font-bold text-slate-500 uppercase mt-1">Market Pulse</p>
        <div className="absolute bottom-full mb-2 w-48 bg-slate-800 text-white text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Represents the overall market trend (SPY index). Green indicates an upward trend, red indicates downward.
        </div>
         <style>{`
            @keyframes pulse-fast {
                50% { opacity: 0.6; }
            }
            @keyframes pulse-slow {
                50% { opacity: 0.6; }
            }
            .animate-pulse-fast {
                animation: pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .animate-pulse-slow {
                 animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
         `}</style>
    </div>
  );
};

export default AlphaPulse;