export interface PlayerStats {
  pnl: number;
  btc: number;
  streak: number;
  gemin: number;
}

export interface GameSettings {
  speed: number;
  volume: number;
  tts: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface InfoCardContent {
  title: string;
  explanation: string;
}

export type GameEffectType = 'powerup' | 'glitch';
export type GameEffect = {
  id: 'MARKET_SIGHT' | 'MARKET_FOG';
  type: GameEffectType;
  name: string;
  description: string;
  duration: number; // in seconds
  icon: React.ElementType;
};

export type GlobalEventType = 'shock' | 'streak';
export interface GlobalMarketEvent {
    id: string;
    type: GlobalEventType;
    title: string;
    description: string;
    duration: number; // in seconds
    active: boolean;
}

export interface BaseEvent {
  id: string;
  lane: number;
}

export interface MarketEvent extends BaseEvent {
  type: 'opportunity' | 'trap';
  value: number;
  symbol: string;
  faded: boolean;
  title: string;
  explanation: string;
  news: {
    headline: string;
    source: string;
    url: string;
  };
  priceHistory: { time: number; price: number; }[];
}

export interface QuizEvent extends BaseEvent {
    type: 'quiz' | 'mandatory_quiz';
    question: QuizQuestion;
    text: string;
}

export interface RecommendationEvent extends BaseEvent {
    type: 'recommendation';
    text: string;
}

export interface ForecastEvent extends BaseEvent {
    type: 'forecast';
    symbol: string;
    status: 'pending' | 'predicted' | 'resolved';
    initialHeadline: string;
    resolutionHeadline?: string;
    outcome?: 'bullish' | 'bearish';
    prediction?: 'bullish' | 'bearish';
    reward: number;
}


export type GameEvent = MarketEvent | QuizEvent | RecommendationEvent | GlobalMarketEvent | ForecastEvent;


export interface KeyTakeaway {
  id: string;
  text: string;
}

export interface GameContext {
  stats: PlayerStats;
  visibleEvents: MarketEvent[];
}

export interface AlpacaCreds {
  key: string;
  secret: string;
}

export type IntegrationService = {
  id: 'fidelity' | 'robinhood' | 'moonshot' | 'discord' | 'telegram';
  name: string;
  description: string;
  longDescription: string;
  comingSoon: boolean;
  connectionType: 'api' | 'oauth' | 'info';
};

// Types for AI-Generated Chart Analysis
export interface ChartAnnotation {
  index: number; // Index in the priceHistory array
  text: string;
}

export interface ChartAnalysis {
  analysisText: string;
  keyConcept: {
    title: string;
    explanation: string;
  };
  relatedNews: {
    headline: string;
    source: string;
  }[];
  annotations: ChartAnnotation[];
}

export interface PlayerPerks {
    longerPowerups: boolean;
    shorterGlitches: boolean;
    quizWhiz: boolean;
    takeawayArchive: boolean;
}
