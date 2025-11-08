import React from 'react';
import type { PlayerStats, GameEffect } from '../types';
import { Gem } from 'lucide-react';
import AlphaPulse from './AlphaPulse';

interface HudProps {
  stats: PlayerStats;
  activeEffects: GameEffect[];
  marketPulse: number;
}

const StatBox: React.FC<{ title: string; value: string | React.ReactNode; subtext?: string; valueColor: string; }> = ({ title, value, subtext, valueColor }) => {
    return (
        <div 
            className="w-40 h-24 p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md flex flex-col justify-between transition-all duration-300"
        >
            <div className="font-sans text-sm text-slate-500 uppercase tracking-wider">{title}</div>
            <div>
                <div className={`text-3xl font-bold font-sans ${valueColor}`}>{value}</div>
                {subtext && <div className="text-xs text-slate-400 uppercase">{subtext}</div>}
            </div>
        </div>
    );
}

const Hud: React.FC<HudProps> = ({ stats, activeEffects, marketPulse }) => {
  return (
    <header className="w-full max-w-6xl mx-auto flex justify-center sm:justify-between items-start gap-4 p-4 z-20">
      <div className="flex gap-4">
        <StatBox title="Equity" value={`$${stats.equity.toFixed(2)}`} subtext="PAPER BALANCE" valueColor="text-sky-500" />
        <StatBox title="STREAK" value={`${stats.streak}`} valueColor="text-amber-500" />
        <StatBox 
            title="Gemin" 
            value={<span className="flex items-center gap-2">{stats.gemin} <Gem size={20}/></span>} 
            valueColor="text-amber-500" 
        />
      </div>
       <div className="flex-col items-center gap-2 hidden sm:flex">
         <AlphaPulse pulse={marketPulse} />
         <div className="flex gap-2 items-center h-10">
          {activeEffects.map((effect) => (
            <div key={effect.id} className="relative group flex items-center gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md">
              <effect.icon size={20} className={effect.type === 'powerup' ? 'text-green-500' : 'text-red-500'} />
              <div className="absolute bottom-full mb-2 w-48 bg-slate-800 text-white text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p className="font-bold">{effect.name}</p>
                <p>{effect.description}</p>
              </div>
            </div>
          ))}
        </div>
       </div>
    </header>
  );
};

export default Hud;