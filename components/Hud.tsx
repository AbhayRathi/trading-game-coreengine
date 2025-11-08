import React from 'react';
// FIX: Import PlayerStats from the dedicated types file.
import type { PlayerStats } from '../types';
import { Gem } from 'lucide-react';

interface HudProps {
  stats: PlayerStats;
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

const Hud: React.FC<HudProps> = ({ stats }) => {
  return (
    <header className="w-full max-w-4xl mx-auto flex justify-center sm:justify-between items-start gap-4 p-4 z-20">
        <StatBox title="P&L +" value={stats.pnl.toFixed(2)} subtext="PAPER BALANCE" valueColor="text-sky-500" />
        <StatBox title={`+${stats.btc.toFixed(1)}%`} value="BTC" valueColor="text-sky-500" />
        <StatBox title="STREAK" value={`${stats.streak}`} valueColor="text-amber-500" />
        <StatBox 
            title="Gemin" 
            value={<span className="flex items-center gap-2">{stats.gemin} <Gem size={20}/></span>} 
            valueColor="text-amber-500" 
        />
    </header>
  );
};

export default Hud;