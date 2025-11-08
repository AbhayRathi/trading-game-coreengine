import React from 'react';
import type { PlayerStats } from '../types';
import { Crown, TrendingUp, Zap, ChevronsUp, Trophy } from 'lucide-react';
import Background from './Background';

interface SessionSummaryProps {
  stats: PlayerStats;
  onRestart: () => void;
}

const MOCK_LEADERBOARD = [
  { name: 'CryptoKing', score: 1250.78 },
  { name: 'DiamondHands', score: 980.23 },
  { name: 'StonksGoUp', score: 750.45 },
  { name: 'TheOracle', score: 680.91 },
  { name: 'PaperTraderPro', score: 512.33 },
  { name: 'RiskRunner', score: 320.11 },
  { name: 'Moonshot', score: 150.67 },
];

const SessionSummary: React.FC<SessionSummaryProps> = ({ stats, onRestart }) => {
    // Assuming paper account starts at 100k for P&L calculation
    const userFinalPnl = stats.equity - 100000;
    const sortedLeaderboard = [...MOCK_LEADERBOARD, { name: 'You', score: userFinalPnl }]
        .sort((a, b) => b.score - a.score);
    const userRank = sortedLeaderboard.findIndex(p => p.name === 'You') + 1;

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center font-inter text-slate-800 p-4">
      <Background />
      <div className="relative z-10 w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center animate-fadeInUp">
        <Trophy className="mx-auto text-amber-500 mb-4" size={56} />
        <h1 className="text-4xl font-bold text-slate-800">Session Complete!</h1>
        <p className="text-slate-500 mt-2">Here's how you performed. Every session is a chance to learn.</p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
            <StatCard icon={<TrendingUp />} title="Final P&L" value={`$${userFinalPnl.toFixed(2)}`} color="text-sky-500" />
            <StatCard icon={<Zap />} title="Best Streak" value={`${stats.streak}`} color="text-amber-500" />
            <StatCard icon={<ChevronsUp />} title="Rank" value={`#${userRank}`} color="text-purple-500" />
        </div>

        {/* Leaderboard */}
        <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-700 mb-3">Daily Leaderboard</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {sortedLeaderboard.slice(0, 7).map((player, index) => (
                    <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${player.name === 'You' ? 'bg-cyan-100' : 'bg-slate-100'}`}>
                        <div className="flex items-center gap-3">
                            <span className="font-bold w-6">{index + 1}.</span>
                            <span className="font-semibold">{player.name}</span>
                            {index === 0 && <Crown size={16} className="text-amber-500" />}
                        </div>
                        <span className="font-bold text-slate-600">${player.score.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </div>

        <button 
            onClick={onRestart}
            className="mt-8 w-full max-w-xs mx-auto py-3 px-6 bg-cyan-500 text-white rounded-full font-semibold text-lg hover:bg-cyan-600 transition-all transform hover:scale-105 shadow-lg"
        >
            Play Again
        </button>
      </div>
      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeInUp {
            animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string; }> = ({ icon, title, value, color }) => (
    <div className="bg-white/50 p-4 rounded-xl shadow-md">
        <div className={`flex items-center gap-2 text-sm font-bold text-slate-500`}>
            {icon} {title}
        </div>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
);


export default SessionSummary;