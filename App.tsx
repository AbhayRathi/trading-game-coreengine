import React, { useState, useCallback } from 'react';
import HomePage from './components/HomePage';
import GameView from './components/GameView';
import SettingsModal from './components/SettingsModal';
import ImageEditor from './components/ImageEditor';
import InfoModal from './components/InfoModal';
import { generateInfoCardContent } from './services/geminiService';
import type { PlayerStats, GameSettings, InfoCardContent, AlpacaCreds } from './types';

const INITIAL_STATS: PlayerStats = {
  pnl: 0,
  btc: 0.1,
  streak: 0,
  gemin: 10,
};

const INITIAL_SETTINGS: GameSettings = {
  speed: 1.0,
  volume: 0.5,
  tts: true,
};

function App() {
  const [gameState, setGameState] = useState<'home' | 'playing'>('home');
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [alpacaCreds, setAlpacaCreds] = useState<AlpacaCreds | null>(null);


  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoContent, setInfoContent] = useState<InfoCardContent | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const handleLaunchSimulation = (creds: AlpacaCreds) => {
    setAlpacaCreds(creds);
    setGameState('playing');
  };
  
  const handleLaunchDemo = () => {
    // Use dummy credentials for demo mode to satisfy the game view's prop requirements
    setAlpacaCreds({ key: 'demo', secret: 'demo' });
    setGameState('playing');
  };

  const handleImageUpdate = (newImageUrl: string) => {
    setBackgroundImage(newImageUrl);
    setIsImageEditorOpen(false);
  };
  
  const handleOpenInfo = useCallback(async (topic: string) => {
    setIsInfoOpen(true);
    setIsGeminiLoading(true);
    setInfoContent(null);
    try {
      const jsonResponse = await generateInfoCardContent(topic);
      setInfoContent(JSON.parse(jsonResponse));
    } catch (error) {
      console.error("Failed to generate info content:", error);
      setInfoContent({ title: "Error", explanation: "Could not load content from Gemini." });
    } finally {
      setIsGeminiLoading(false);
    }
  }, []);
  
  const handleCloseInfo = () => {
    setIsInfoOpen(false);
    setInfoContent(null);
    setStats(prev => ({ ...prev, gemin: prev.gemin + 2 }));
  };

  if (gameState === 'home') {
    return <HomePage onLaunchSimulation={handleLaunchSimulation} onLaunchDemo={handleLaunchDemo} backgroundImage={backgroundImage} />;
  }
  
  if (!alpacaCreds) {
    // This is a fallback, should be handled by the HomePage logic
     return <HomePage onLaunchSimulation={handleLaunchSimulation} onLaunchDemo={handleLaunchDemo} backgroundImage={backgroundImage} />;
  }

  return (
    <>
      <GameView
        stats={stats}
        setStats={setStats}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInfo={handleOpenInfo}
        backgroundImage={backgroundImage}
        alpacaCreds={alpacaCreds}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onOpenImageEditor={() => setIsImageEditorOpen(true)}
      />
      {isImageEditorOpen && <ImageEditor onClose={() => setIsImageEditorOpen(false)} onImageUpdate={handleImageUpdate} />}
      <InfoModal
        isOpen={isInfoOpen}
        isLoading={isGeminiLoading}
        // FIX: The prop 'content' was being passed an undefined variable 'content'. It has been corrected to use the state variable 'infoContent'.
        content={infoContent}
        onClose={handleCloseInfo}
      />
    </>
  );
}

export default App;