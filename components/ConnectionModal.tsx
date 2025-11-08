import React from 'react';
import type { IntegrationService } from '../types';
import { X, Lock, KeyRound, ExternalLink } from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: IntegrationService;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, service }) => {
  if (!isOpen) return null;

  const renderConnectionForm = () => {
    switch(service.connectionType) {
        case 'api':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-300 block mb-1.5">API Key</label>
                        <input type="text" placeholder="Your API Key" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-300 block mb-1.5">Secret Key</label>
                        <input type="password" placeholder="Your Secret Key" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                    </div>
                    <button disabled={service.comingSoon} className="w-full mt-4 py-2.5 px-4 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <KeyRound size={18} />
                        {service.comingSoon ? "Coming Soon" : "Connect Securely"}
                    </button>
                </div>
            );
        case 'oauth':
             return (
                <div className="space-y-4 text-center">
                    <p className="text-slate-400 text-sm">You will be redirected to {service.name} to securely authorize this connection.</p>
                     <button disabled={service.comingSoon} className="w-full mt-4 py-2.5 px-4 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <ExternalLink size={18} />
                        {service.comingSoon ? "Coming Soon" : `Continue to ${service.name}`}
                    </button>
                </div>
            );
        case 'info':
             return (
                <div className="space-y-4 text-center">
                    <p className="text-slate-400 text-sm">For services like wallets and social media, you'll provide public information like a wallet address or server link in the game settings after connecting.</p>
                     <button onClick={onClose} className="w-full mt-4 py-2.5 px-4 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors">
                        Understood
                    </button>
                </div>
            )
    }
  }


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <div 
        className="bg-slate-800 border border-cyan-400/50 rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col text-white"
        style={{ boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-300">Connect to {service.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 my-2">
            <p className="text-slate-300 leading-relaxed text-sm">{service.longDescription}</p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-cyan-400/20">
            {renderConnectionForm()}
        </div>

        <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Lock size={12} />
            Your information is transmitted securely.
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;
