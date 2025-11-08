import React from 'react';
import { X, Loader, BookOpen } from 'lucide-react';
import type { InfoCardContent } from '../types';

interface InfoModalProps {
  isOpen: boolean;
  isLoading: boolean;
  content: InfoCardContent | null;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, isLoading, content, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <div 
        className="bg-[#0a192f] border-2 border-yellow-400/50 rounded-xl shadow-2xl w-full max-w-lg p-6 flex flex-col text-white"
        style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.3)' }}
      >
        <div className="flex justify-between items-center mb-4 relative">
          <h2 className="font-orbitron text-2xl text-yellow-300 flex items-center gap-3">
            <BookOpen size={24} />
            Alpha Intel
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white absolute top-0 right-0">
            <X size={24} />
          </button>
        </div>

        <div className="min-h-[250px] flex flex-col justify-center">
            {isLoading ? (
            <div className="flex flex-col items-center justify-center">
                <Loader size={48} className="text-yellow-400 animate-spin" />
                <p className="mt-4 text-yellow-200">Loading insight...</p>
            </div>
            ) : content ? (
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">{content.title}</h3>
                <p className="text-gray-300 leading-relaxed">{content.explanation}</p>
                <div className="mt-6 pt-4 border-t border-yellow-400/20 text-center">
                    <p className="text-yellow-300 font-semibold">+2 Gemin for expanding your knowledge!</p>
                </div>
            </div>
            ) : (
                <div className="flex flex-col items-center justify-center">
                    <p className="text-red-400">Failed to load content. Please try again.</p>
                </div>
            )}
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full py-2 bg-yellow-500/80 border border-yellow-400 rounded-lg font-semibold text-black hover:bg-yellow-400 transition-colors"
        >
          Got it!
        </button>

      </div>
    </div>
  );
};

export default InfoModal;
