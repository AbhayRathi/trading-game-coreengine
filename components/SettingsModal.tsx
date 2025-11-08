import React from 'react';
// FIX: Import GameSettings from the dedicated types file.
import type { GameSettings } from '../types';
import { X, Image, Volume2, FastForward } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (newSettings: GameSettings) => void;
  onOpenImageEditor: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange, onOpenImageEditor }) => {
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
          {/* Game Speed */}
          <div className="flex flex-col gap-2">
            <label htmlFor="game-speed" className="flex items-center gap-2 text-lg font-semibold">
                <FastForward size={20} className="text-blue-500"/>
                Game Speed: <span className="font-bold text-blue-600">{settings.speed.toFixed(1)}x</span>
            </label>
            <input 
              id="game-speed"
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1" 
              value={settings.speed}
              onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Volume */}
          <div className="flex flex-col gap-2">
             <label htmlFor="volume" className="flex items-center gap-2 text-lg font-semibold">
                <Volume2 size={20} className="text-blue-500"/>
                Volume: <span className="font-bold text-blue-600">{(settings.volume * 100).toFixed(0)}%</span>
            </label>
            <input 
              id="volume"
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={settings.volume}
              onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          
          {/* TTS Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Enable Coach Voice (TTS)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.tts} onChange={(e) => handleSettingChange('tts', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          
          <div className="border-t border-slate-200 my-4" />

          <button
            onClick={onOpenImageEditor}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-100 border border-purple-200 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors"
          >
            <Image size={20}/>
            Edit Background Image
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;