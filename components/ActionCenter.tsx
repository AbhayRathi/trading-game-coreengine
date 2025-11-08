import React from 'react';
import { Settings, Info, HelpCircle, LogOut, Zap } from 'lucide-react';
import Coach from './Coach';
import type { PlayerStats, MarketEvent } from '../types';

interface ActionCenterProps {
  onOpenSettings: () => void;
  onOpenInfo: () => void;
  onOpenQuiz: () => void;
  onEndSession: () => void;
  onLiquidate: () => void;
  isTtsEnabled: boolean;
  stats: PlayerStats;
  marketEvents: MarketEvent[];
}

const ActionCenter: React.FC<ActionCenterProps> = ({ onOpenSettings, onOpenInfo, onOpenQuiz, onEndSession, onLiquidate, isTtsEnabled, stats, marketEvents }) => {
  return (
    <footer className="w-full max-w-4xl mx-auto flex justify-center sm:justify-between items-center gap-4 p-4 z-20">
      <div className="flex gap-4">
        <button title="Settings" onClick={onOpenSettings} className="w-14 h-14 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-md hover:bg-slate-200/80 transition-colors text-slate-600">
          <Settings />
        </button>
        <button title="Get Info" onClick={onOpenInfo} className="w-14 h-14 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-md hover:bg-slate-200/80 transition-colors text-slate-600">
          <Info />
        </button>
         <button title="Take a Quiz" onClick={onOpenQuiz} className="w-14 h-14 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-md hover:bg-slate-200/80 transition-colors text-slate-600">
          <HelpCircle />
        </button>
        <button title="Liquidate All Positions" onClick={onLiquidate} className="w-14 h-14 rounded-full flex items-center justify-center bg-amber-100/80 backdrop-blur-sm shadow-md hover:bg-amber-200/80 transition-colors text-amber-600">
          <Zap />
        </button>
        <button title="Quit Session" onClick={onEndSession} className="w-14 h-14 rounded-full flex items-center justify-center bg-red-100/80 backdrop-blur-sm shadow-md hover:bg-red-200/80 transition-colors text-red-600">
          <LogOut />
        </button>
      </div>
      <Coach 
        isTtsEnabled={isTtsEnabled} 
        stats={stats} 
        marketEvents={marketEvents} 
      />
    </footer>
  );
};

export default ActionCenter;