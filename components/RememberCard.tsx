import React, { useState, useEffect } from 'react';
import { BrainCircuit } from 'lucide-react';

interface RememberCardProps {
  id: string;
  text: string;
  onDismiss: (id: string) => void;
}

const RememberCard: React.FC<RememberCardProps> = ({ id, text, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setVisible(true);
    
    // Timer to start fade out
    const fadeOutTimer = setTimeout(() => {
      setVisible(false);
    }, 7000); // 7 seconds visible

    // Timer to call dismiss after fade out animation completes
    const dismissTimer = setTimeout(() => {
        onDismiss(id);
    }, 7500); // 7s visible + 0.5s fade-out

    return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(dismissTimer);
    };
  }, [id, onDismiss]);

  return (
    <div 
      className={`max-w-md w-auto transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
    >
        <div className="bg-sky-100 border border-sky-200 text-sky-800 px-4 py-2 rounded-lg shadow-md flex items-center gap-3">
            <BrainCircuit size={20} className="flex-shrink-0" />
            <div>
                <p className="text-xs font-bold uppercase text-sky-600">Key Takeaway</p>
                <p className="text-sm font-medium">{text}</p>
            </div>
        </div>
    </div>
  );
};

export default RememberCard;