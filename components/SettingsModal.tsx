import React from 'react';
import type { GameSettings, PlayerPerks } from '../types';
import { X, Image, Volume2, FastForward, Gem, Zap, Shield, BrainCircuit, BookCopy } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (newSettings: GameSettings) => void;
  onOpenImageEditor: () => void;
  geminBalance: number;
  perks: PlayerPerks;
  onPurchasePerk: (perk: keyof PlayerPerks, cost: number) => void;
}

const PERK_CATALOG: { id: keyof PlayerPerks; name: string; description: string; cost: number; icon: React.ElementType; }[] = [
    { id: 'longerPowerups', name: 'Longer Power-Ups', description: 'Increases the duration of helpful effects.', cost: 50, icon: Zap },
    { id: 'shorterGlitches', name: 'Shorter Glitches', description: 'Reduces the duration of negative effects.', cost: 50, icon: Shield },
    { id: 'quizWhiz', name: 'Quiz Whiz', description: 'Get a hint to remove one wrong answer in quizzes.', cost: 75, icon: BrainCircuit },
    { id: 'takeawayArchive', name: 'Takeaway Archive', description: 'Saves your last 5 key takeaways to review.', cost: 30, icon: BookCopy },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange, onOpenImageEditor, geminBalance, perks, onPurchasePerk }) => {
  if (!isOpen) return null;

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col text-slate-800"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="game-speed" className="flex items-center gap-2 text-lg font-semibold">
                <FastForward size={20} className="text-blue-500"/>
                Game Speed: <span className="font-bold text-blue-600">{settings.speed.toFixed(1)}x</span>
            </label>
            <input id="game-speed" type="range" min="0.5" max="2" step="0.1" value={settings.speed} onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>

          <div className="flex flex-col gap-2">
             <label htmlFor="volume" className="flex items-center gap-2 text-lg font-semibold">
                <Volume2 size={20} className="text-blue-500"/>
                Volume: <span className="font-bold text-blue-600">{(settings.volume * 100).toFixed(0)}%</span>
            </label>
            <input id="volume" type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Enable Coach Voice (TTS)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.tts} onChange={(e) => handleSettingChange('tts', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          
           <div className="border-t border-slate-200 my-2" />
          
          {/* Gemin Perks Store */}
          <div>
            <div className="flex justify-between items-center mb-3">
                 <h3 className="text-xl font-bold text-purple-600">Gemin Perks</h3>
                 <div className="flex items-center gap-2 font-bold text-amber-500 bg-amber-100 px-3 py-1 rounded-full">
                    <Gem size={16} /> {geminBalance}
                 </div>
            </div>
            <div className="space-y-2">
                {PERK_CATALOG.map((perk) => {
                    const isPurchased = perks[perk.id];
                    const canAfford = geminBalance >= perk.cost;
                    return (
                        <div key={perk.id} className="flex items-center justify-between bg-slate-100 p-2 rounded-lg">
                            <div className="flex items-center gap-3">
                                <perk.icon size={20} className="text-purple-500" />
                                <div>
                                    <p className="font-semibold">{perk.name}</p>
                                    <p className="text-xs text-slate-500">{perk.description}</p>
                                </div>
                            </div>
                            {isPurchased ? (
                                <span className="font-bold text-sm text-green-600">Purchased</span>
                            ) : (
                                <button 
                                    onClick={() => onPurchasePerk(perk.id, perk.cost)}
                                    disabled={!canAfford}
                                    className="px-3 py-1 bg-purple-500 text-white rounded-md text-sm font-semibold hover:bg-purple-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-1.5"
                                >
                                    <Gem size={12} /> {perk.cost}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
          </div>
          
          <div className="border-t border-slate-200 my-2" />

          <button onClick={onOpenImageEditor} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-100 border border-purple-200 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors">
            <Image size={20}/>
            Edit Background Image
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
