import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createContextualLiveSession, getCoachResponse, generateSpeech } from '../services/geminiService';
import type { LiveServerMessage, LiveSession, Blob, GameContext } from '@google/genai';
import { Mic, MicOff, Send, Loader2, X } from 'lucide-react';
import { encode } from '../utils';
import { decode, decodeAudioData } from '../utils/audioUtils';
import type { PlayerStats, MarketEvent } from '../types';

interface CoachProps {
    isTtsEnabled: boolean;
    stats: PlayerStats;
    marketEvents: MarketEvent[];
}

const Coach: React.FC<CoachProps> = ({ isTtsEnabled, stats, marketEvents }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [coachResponse, setCoachResponse] = useState('');

  const sessionPromise = useRef<Promise<LiveSession> | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  
  const outputAudioContext = useRef<AudioContext | null>(null);
  const nextStartTime = useRef(0);
  const audioSources = useRef(new Set<AudioBufferSourceNode>());

  const gameContext = useMemo<GameContext>(() => ({ stats, visibleEvents: marketEvents }), [stats, marketEvents]);

  const stopAudioPlayback = () => {
    audioSources.current.forEach(source => source.stop());
    audioSources.current.clear();
    nextStartTime.current = 0;
    if (outputAudioContext.current && outputAudioContext.current.state !== 'closed') {
      outputAudioContext.current.close().then(() => outputAudioContext.current = null);
    }
  }

  const playAudio = useCallback(async (base64Audio: string) => {
    stopAudioPlayback();
    const oac = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    outputAudioContext.current = oac;
    
    const audioBuffer = await decodeAudioData(decode(base64Audio), oac, 24000, 1);
    const source = oac.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(oac.destination);
    source.start();
    audioSources.current.add(source);
  }, []);

  const stopRecording = useCallback(async () => {
    if(sessionPromise.current) {
       sessionPromise.current.then(session => session.close());
       sessionPromise.current = null;
    }
    if(scriptProcessor.current) {
      scriptProcessor.current.disconnect();
      scriptProcessor.current = null;
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
    if (audioContext.current && audioContext.current.state !== 'closed') {
      await audioContext.current.close();
      audioContext.current = null;
    }
    stopAudioPlayback();
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  const handleMicToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      try {
        mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        setUserQuery('');
        setCoachResponse('');

        sessionPromise.current = createContextualLiveSession(gameContext, {
          onMessage: async (message: LiveServerMessage) => {
            const text = message.serverContent?.inputTranscription?.text;
            if (text) {
              setUserQuery(prev => (prev.endsWith(' ') || prev === '') ? prev + text : prev + ' ' + text);
            }
            if (isTtsEnabled) {
              const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64EncodedAudioString) {
                  playAudio(base64EncodedAudioString);
              }
            }
          },
          onError: (e) => {
            console.error("Live session error:", e);
            stopRecording();
            setCoachResponse("Sorry, I encountered an error.");
          },
          onClose: () => {
             console.log("Live session closed by server.");
             stopRecording();
          },
        });
        
        sessionPromise.current.then(() => {
            if (!mediaStream.current) return;
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = audioContext.current.createMediaStreamSource(mediaStream.current);
            scriptProcessor.current = audioContext.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor.current);
            scriptProcessor.current.connect(audioContext.current.destination);
        });

      } catch (err) {
        console.error("Error accessing microphone:", err);
        setIsRecording(false);
      }
    }
  };

  const handleTextSubmit = async () => {
    if (!userQuery.trim() || isThinking) return;

    setIsThinking(true);
    setCoachResponse('');
    stopAudioPlayback();

    try {
        const responseText = await getCoachResponse(userQuery, gameContext);
        setCoachResponse(responseText);

        if (isTtsEnabled) {
            const audio = await generateSpeech(responseText);
            await playAudio(audio);
        }
    } catch (error) {
        console.error("Coach text response error:", error);
        setCoachResponse("I couldn't process that request. Please try again.");
    } finally {
        setIsThinking(false);
    }
  };

  return (
    <div className="w-full max-w-sm relative">
      {coachResponse && (
        <div className="absolute bottom-full mb-2 w-full bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm text-slate-700 shadow-lg animate-fadeInUp">
            <button 
              onClick={() => setCoachResponse('')} 
              title="Close"
              className="absolute top-1 right-1 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
            <p className="font-bold text-blue-600 pr-4">Coach:</p>
            {coachResponse}
        </div>
      )}
      <div className="relative w-full flex items-center">
        <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                }
            }}
            placeholder="Ask the coach or think out loud..."
            className="w-full h-14 bg-white/80 border border-slate-300 rounded-lg text-slate-800 p-3 pr-24 resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors placeholder-slate-400 shadow-md"
            rows={1}
            disabled={isRecording}
        />
        <button
          type="button"
          onClick={handleTextSubmit}
          disabled={isThinking || isRecording || !userQuery.trim()}
          title="Send"
          className="absolute right-14 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 transition-colors"
        >
            {isThinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
        <button
          type="button"
          onClick={handleMicToggle}
          title={isRecording ? 'Stop recording' : 'Start recording'}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isRecording ? 'bg-red-500 border-red-400' : 'bg-blue-500 border-blue-400'}`}
        >
          {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
      </div>
       <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Coach;