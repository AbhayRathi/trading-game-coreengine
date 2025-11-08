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

export interface MarketEvent {
  id: string;
  type: 'opportunity' | 'trap' | 'recommendation' | 'quiz' | 'mandatory_quiz';
  value?: number;
  symbol?: string;
  text?: string;
  question?: QuizQuestion;
  lane: number; // 0, 1, or 2 for tracks, -1 for non-track events
  faded: boolean;
  // New properties for detailed event descriptions
  title: string;
  explanation: string;
  newsHeadline: string;
  priceHistory: { time: number; price: number; }[];
}

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