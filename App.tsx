import React, { useState, useCallback } from 'react';
import HomePage from './components/HomePage';
import GameView from './components/GameView';
import SettingsModal from './components/SettingsModal';
import ImageEditor from './components/ImageEditor';
import InfoModal from './components/InfoModal';
import SessionSummary from './components/SessionSummary';
import { generateInfoCardContent } from './services/geminiService';
import type { PlayerStats, GameSettings, InfoCardContent, AlpacaCreds, PlayerPerks } from './types';

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

const INITIAL_PERKS: PlayerPerks = {
  longerPowerups: false,
  shorterGlitches: false,
  quizWhiz: false,
  takeawayArchive: false,
};

function App() {
  const [gameState, setGameState] = useState<'home' | 'playing' | 'summary'>('home');
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [sessionStats, setSessionStats] = useState<PlayerStats>(INITIAL_STATS);
  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [alpacaCreds, setAlpacaCreds] = useState<AlpacaCreds | null>(null);
  const [playerPerks, setPlayerPerks] = useState<PlayerPerks>(INITIAL_PERKS);


  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoContent, setInfoContent] = useState<InfoCardContent | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const startNewSession = () => {
    const newInitialStats = { ...INITIAL_STATS, gemin: stats.gemin };
    setStats(newInitialStats);
    setSessionStats(newInitialStats);
    setGameState('playing');
  }

  const handleLaunchSimulation = (creds: AlpacaCreds) => {
    setAlpacaCreds(creds);
    startNewSession();
  };
  
  const handleLaunchDemo = () => {
    setAlpacaCreds({ key: 'demo', secret: 'demo' });
    startNewSession();
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

  const handleEndSession = () => {
    setSessionStats(stats); // Save final stats for the summary
    setGameState('summary');
  };
  
  const handleRestart = () => {
     setGameState('home');
  };

  const handlePurchasePerk = (perk: keyof PlayerPerks, cost: number) => {
    if (stats.gemin >= cost && !playerPerks[perk]) {
        setStats(prev => ({ ...prev, gemin: prev.gemin - cost }));
        setPlayerPerks(prev => ({ ...prev, [perk]: true }));
    }
  };


  if (gameState === 'home') {
    return <HomePage onLaunchSimulation={handleLaunchSimulation} onLaunchDemo={handleLaunchDemo} backgroundImage={backgroundImage} />;
  }
  
  if (gameState === 'summary') {
    return <SessionSummary stats={sessionStats} onRestart={handleRestart} />;
  }
  
  if (!alpacaCreds) {
     return <HomePage onLaunchSimulation={handleLaunchSimulation} onLaunchDemo={handleLaunchDemo} backgroundImage={backgroundImage} />;
  }

  return (
    <>
      <GameView
        stats={stats}
        setStats={setStats}
        settings={settings}
        perks={playerPerks}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInfo={handleOpenInfo}
        onEndSession={handleEndSession}
        backgroundImage={backgroundImage}
        alpacaCreds={alpacaCreds}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onOpenImageEditor={() => setIsImageEditorOpen(true)}
        geminBalance={stats.gemin}
        perks={playerPerks}
        onPurchasePerk={handlePurchasePerk}
      />
      {isImageEditorOpen && <ImageEditor onClose={() => setIsImageEditorOpen(false)} onImageUpdate={handleImageUpdate} />}
      <InfoModal
        isOpen={isInfoOpen}
        isLoading={isGeminiLoading}
        content={infoContent}
        onClose={handleCloseInfo}
      />
    </>
  );
}

export default App;
