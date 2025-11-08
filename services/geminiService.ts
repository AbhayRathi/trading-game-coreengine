import { GoogleGenAI, Modality, LiveSession, LiveServerMessage, GenerateContentResponse, Type } from '@google/genai';
import type { QuizQuestion, GameContext, MarketEvent, ChartAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const formatContextForPrompt = (context: GameContext): string => {
    const { stats, visibleEvents } = context;
    let eventSummary = 'No significant events on screen.';
    if (visibleEvents.length > 0) {
        eventSummary = visibleEvents
            .map(e => `${e.type === 'opportunity' ? 'Opportunity' : 'Trap'}: ${e.symbol} for ${e.value?.toFixed(2)} P&L`)
            .join(', ');
    }
    return `
---
CURRENT GAME STATE:
// FIX: Property 'pnl' does not exist on type 'PlayerStats'. Calculated P&L from equity.
- P&L: ${(stats.equity - 100000).toFixed(2)}
- Current Streak: ${stats.streak}
- Gemin Balance: ${stats.gemin}
- Visible Market Events: ${eventSummary}
---
`;
}

export const generateMarketEventDetails = async (symbol: string, priceChangePercent: number, newsHeadline: string): Promise<string> => {
    const eventType = priceChangePercent > 0 ? 'opportunity' : 'trap';
    const prompt = `
    You are an AI for a financial education game called Alpha Infinity. Your role is to create engaging, educational content for market events based on real-world data.
    A market event just occurred for the symbol ${symbol}.

    - Real News Headline: "${newsHeadline}"
    - Real-Time Price Change: ${priceChangePercent.toFixed(2)}%

    Based on this, generate a JSON object for a market ${eventType}. The content should be simple, clear, and exciting for a beginner.
    
    The JSON object must have two fields:
    1. "title": A very short, catchy title for the event (e.g., "Tech Breakthrough!" or "Regulatory Concerns").
    2. "explanation": A one-to-two sentence explanation of what this event means in simple terms. Explain *why* the news could cause this price movement.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                },
                required: ['title', 'explanation']
            }
        }
    });

    return response.text;
};

export const generateForecastHeadlines = async (symbol: string): Promise<string> => {
    const outcome = Math.random() > 0.5 ? 'bullish' : 'bearish';
    const prompt = `
    You are an AI for a financial education game. Create a two-part news event for the stock symbol ${symbol}.
    The final outcome should be ${outcome}.

    Generate a JSON object with three fields:
    1. "initialHeadline": A headline for an upcoming event or rumor that creates uncertainty (e.g., an earnings call, a product announcement, a regulatory hearing).
    2. "resolutionHeadline": A follow-up headline that clearly states the outcome of the event, matching the predetermined '${outcome}' sentiment.
    3. "outcome": The string "${outcome}".

    Example for a 'bullish' outcome:
    {
      "initialHeadline": "Speculation mounts as ${symbol} prepares to unveil its next-gen AI chip tomorrow.",
      "resolutionHeadline": "BREAKING: ${symbol}'s new chip exceeds all performance benchmarks, sending stock soaring.",
      "outcome": "bullish"
    }

    Example for a 'bearish' outcome:
    {
      "initialHeadline": "${symbol} faces a critical patent lawsuit, with a verdict expected any moment.",
      "resolutionHeadline": "OUCH: ${symbol} loses patent case, ordered to pay hefty fines; investors panic.",
      "outcome": "bearish"
    }
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    initialHeadline: { type: Type.STRING },
                    resolutionHeadline: { type: Type.STRING },
                    outcome: { type: Type.STRING },
                },
                required: ['initialHeadline', 'resolutionHeadline', 'outcome']
            }
        }
    });
    return response.text;
};


export const generateChartAnalysis = async (event: MarketEvent): Promise<string> => {
    const keyConcepts = ["Price vs. Value", "Reading Candlestick Charts", "Market Sentiment", "Support and Resistance"];
    const randomConcept = keyConcepts[Math.floor(Math.random() * keyConcepts.length)];

    const prompt = `
    You are an expert financial analyst and educator within the game "Alpha Infinity".
    Analyze the following market event for a beginner player. The goal is to make complex topics simple and engaging.
    
    Event Details:
    - Symbol: ${event.symbol}
    - Initial News: "${event.news.headline}"
    - Price History (last 15 intervals): ${JSON.stringify(event.priceHistory.map(p => p.price.toFixed(2)))}

    Your task is to generate a comprehensive analysis as a single JSON object. The JSON must have the following structure:
    {
      "analysisText": "A two-sentence summary explaining what the chart shows and why it might be happening, linking to the news.",
      "keyConcept": {
        "title": "A title for a key financial concept. Use the concept: '${randomConcept}'.",
        "explanation": "A simple, one-or-two sentence explanation of '${randomConcept}' for a total beginner."
      },
      "relatedNews": [
        { "headline": "A realistic, simulated news headline related to the event.", "source": "A plausible news source (e.g., 'MarketWatch', 'CoinDesk', 'Bloomberg')." },
        { "headline": "Another related, but slightly different, simulated news headline.", "source": "A different plausible source." }
      ],
      "annotations": [
        { "index": "The array index (0-14) of a noteworthy point in the price history.", "text": "A very short text label for that point (e.g., 'Initial Dip', 'Rally Starts')." },
        { "index": "The array index of another interesting point.", "text": "A short label." }
      ]
    }

    Select two distinct and interesting points from the price history for the annotations. For example, a peak, a a trough, or the start of a trend.
    Ensure the entire output is a single, valid JSON object.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysisText: { type: Type.STRING },
                    keyConcept: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            explanation: { type: Type.STRING }
                        },
                        required: ['title', 'explanation']
                    },
                    relatedNews: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                headline: { type: Type.STRING },
                                source: { type: Type.STRING }
                            },
                            required: ['headline', 'source']
                        }
                    },
                    annotations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                index: { type: Type.INTEGER },
                                text: { type: Type.STRING }
                            },
                            required: ['index', 'text']
                        }
                    }
                },
                required: ['analysisText', 'keyConcept', 'relatedNews', 'annotations']
            }
        }
    });

    return response.text;
}


export const editImageWithPrompt = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const model = 'gemini-2.5-flash-image';

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates?.[0]?.content.parts ?? []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  throw new Error('No image data found in response');
};

interface LiveSessionCallbacks {
    onMessage: (message: LiveServerMessage) => void;
    onError: (e: ErrorEvent) => void;
    onClose: (e: CloseEvent) => void;
}

export const createContextualLiveSession = async (context: GameContext, callbacks: LiveSessionCallbacks): Promise<LiveSession> => {
    const systemInstruction = `You are a trading coach in a gamified learning app. The user is thinking out loud while playing.
    Analyze their spoken thoughts in the context of the current game state provided below.
    Provide concise, encouraging, and educational feedback. Help them understand the concepts and make better decisions.
    Keep your responses to a single, concise sentence. Be direct and helpful.
    You should also be able to explain concepts like risk management (e.g., stop-loss), the basics of trading algorithms, and how market sentiment from social platforms like Discord can be a factor. The app plans to integrate with services like Robinhood and Fidelity in the future.
    ${formatContextForPrompt(context)}`;

    const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {}, // onOpen is handled by the component now
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            systemInstruction: systemInstruction
        }
    });

    return session;
};

export const getCoachResponse = async (query: string, context: GameContext): Promise<string> => {
    const prompt = `You are a trading coach in a gamified learning app. The user has asked a question via text.
    Analyze their question in the context of the current game state provided below.
    Provide a concise, encouraging, and educational answer. Keep your response to a single, short sentence.
    You should also be able to explain concepts like risk management (e.g., stop-loss), the basics of trading algorithms, and how market sentiment from social platforms like Discord can be a factor. The app plans to integrate with services like Robinhood and Fidelity in the future.
    ${formatContextForPrompt(context)}
    
    User's Question: "${query}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data returned from TTS API.");
      }
      return base64Audio;
}


export const generateQuizQuestion = async (topic: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a multiple-choice quiz question about the financial topic: "${topic}". The question should have 4 options and one correct answer.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswerIndex: { type: Type.INTEGER },
                },
                required: ['question', 'options', 'correctAnswerIndex']
            }
        }
    });
    return response.text;
};

export const generateInfoCardContent = async (topic: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Explain the financial concept "${topic}" in a simple, easy-to-understand way for a beginner. Provide a title for this explanation.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                },
                required: ['title', 'explanation']
            }
        }
    });
    return response.text;
};

export const generateKeyTakeaway = async (question: QuizQuestion): Promise<string> => {
    const prompt = `Based on this quiz question and its correct answer, generate a concise, one-sentence key takeaway for a beginner learner.
    Question: "${question.question}"
    Correct Answer: "${question.options[question.correctAnswerIndex]}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    takeaway: {
                        type: Type.STRING,
                        description: 'A single, memorable sentence summarizing the key learning point.'
                    }
                },
                required: ['takeaway']
            }
        }
    });

    return response.text;
};