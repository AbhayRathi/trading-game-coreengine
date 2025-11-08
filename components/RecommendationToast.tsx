import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';

interface RecommendationToastProps {
  text: string;
}

const RecommendationToast: React.FC<RecommendationToastProps> = ({ text }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setVisible(true);
    
    // Fade out and disappear after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`max-w-md w-auto transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
    >
        <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg shadow-md flex items-center gap-3">
            <Lightbulb size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">{text}</p>
        </div>
    </div>
  );
};

export default RecommendationToast;