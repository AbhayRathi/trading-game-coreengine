import React, { useState } from 'react';
import { AlpacaCreds, IntegrationService } from '../types';
import { Eye, EyeOff, PlayCircle, Link, TrendingUp, Bot, PercentCircle, Banknote, BotMessageSquare, Wallet, Send, TestTube2, BarChart } from 'lucide-react';
import Background from './Background';
import InvestmentSimulator from './InvestmentSimulator';
import ConnectionModal from './ConnectionModal';

interface HomePageProps {
  onLaunchSimulation: (creds: AlpacaCreds) => void;
  onLaunchDemo: () => void;
  backgroundImage: string | null;
}

const INTEGRATION_DATA: Record<IntegrationService['id'], IntegrationService> = {
  robinhood: {
    id: 'robinhood',
    name: "Robinhood",
    description: "Analyze your real-world strategies by connecting your Robinhood account.",
    longDescription: "By connecting your Robinhood account via their secure API, Alpha Infinity gains read-only access to your trade history. We use this data to provide personalized feedback and create in-game events that mirror your real-world investment style. Your credentials are never stored on our servers.",
    comingSoon: true,
    connectionType: 'api',
  },
  fidelity: {
    id: 'fidelity',
    name: "Fidelity",
    description: "Gain insights on your long-term investments from your Fidelity portfolio.",
    longDescription: "Link your Fidelity account through a secure, industry-standard OAuth connection. Alpha Infinity will analyze your portfolio composition to offer educational content on diversification and long-term growth. We do not have access to your credentials or the ability to make trades.",
    comingSoon: true,
    connectionType: 'oauth',
  },
  moonshot: {
    id: 'moonshot',
    name: "Moonshot Wallet",
    description: "Learn about DeFi and track your digital assets by connecting your crypto wallet.",
    longDescription: "Connecting your Moonshot crypto wallet is a read-only process that scans the public blockchain for your wallet address. This allows the game to simulate events related to your actual holdings (like NFTs and tokens) and teach you about concepts like staking and liquidity pools. Your private keys are never required.",
    comingSoon: true,
    connectionType: 'info',
  },
  discord: {
    id: 'discord',
    name: "Discord",
    description: "Gauge real-time market sentiment from popular trading communities.",
    longDescription: "Alpha Infinity can integrate with public, opt-in Discord servers. Our AI scans the conversation in trading channels to create a 'sentiment score' for different assets, teaching you how community hype can influence market movements. This integration does not read your private messages.",
    comingSoon: true,
    connectionType: 'info',
  },
  telegram: {
    id: 'telegram',
    name: "Telegram",
    description: "Plug into news channels to catch breaking trends as they happen.",
    longDescription: "By connecting to public Telegram news and trading channels, the game can generate real-time events based on breaking headlines and discussions. This teaches you the importance of staying informed and reacting quickly to new information in the market.",
    comingSoon: true,
    connectionType: 'info',
  }
};

const HomePage: React.FC<HomePageProps> = ({ onLaunchSimulation, onLaunchDemo }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');
  const [modalService, setModalService] = useState<IntegrationService | null>(null);


  const handleLaunch = () => {
    if (!apiKey || !apiSecret) {
      setError('Please provide both API Key and Secret Key.');
      return;
    }
    setError('');
    onLaunchSimulation({ key: apiKey, secret: apiSecret });
  };

  return (
    <>
    <div className="relative w-full min-h-screen flex flex-col font-inter text-slate-800">
      <Background />

      <header className="fixed top-0 left-0 right-0 z-20 bg-white/50 backdrop-blur-lg border-b border-slate-200/50">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 flex justify-between items-center h-20">
          <h1 className="text-2xl font-bold text-slate-800">Alpha Infinity</h1>
          <nav>
            <ul className="flex items-center gap-6 font-semibold">
              <li><a href="#get-started" className="text-slate-600 hover:text-cyan-600 transition-colors">Get Started</a></li>
              <li><a href="#prediction" className="text-slate-600 hover:text-cyan-600 transition-colors">Prediction</a></li>
              <li><a href="#connect" className="text-slate-600 hover:text-cyan-600 transition-colors">Connect</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <div className="relative z-10 w-full max-w-6xl mx-auto flex-grow flex flex-col items-center justify-center px-4 sm:px-8 pt-28 pb-8">
        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start w-full">
          
          {/* Login Panel */}
          <div id="get-started" className="lg:col-span-2 w-full">
             <div className="w-full h-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold text-center text-slate-800">Choose Your Mode</h2>
                <p className="text-center text-slate-500 mb-6">Play with simulated data or connect to the live market.</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button onClick={onLaunchDemo} className="w-full flex flex-col items-center justify-center gap-2 p-4 font-semibold text-lg text-white bg-amber-500 rounded-lg shadow-md hover:bg-amber-600 transition-all duration-300 transform hover:scale-105">
                        <TestTube2 />
                        Demo Mode
                    </button>
                    <button onClick={handleLaunch} className="w-full flex flex-col items-center justify-center gap-2 p-4 font-semibold text-lg text-white bg-cyan-500 rounded-lg shadow-md hover:bg-cyan-600 transition-all duration-300 transform hover:scale-105">
                       <BarChart />
                       Live Paper Trading
                    </button>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-center text-slate-500 bg-slate-100 p-2 rounded-md">
                    For <strong>Live Paper Trading</strong>, connect your Alpaca paper trading account. It's risk-free and uses real market data. 
                    <a href="https://alpaca.markets/trading-platforms/paper-trading" target="_blank" rel="noopener noreferrer" className="text-cyan-600 font-bold hover:underline"> Get a free key here.</a>
                  </p>
                  <div>
                      <label className="text-sm font-semibold text-slate-600 block mb-1.5">Alpaca API Key</label>
                       <input 
                          type="text"
                          placeholder="Your Paper Trading API Key"
                          value={apiKey}
                          onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                          className="w-full bg-white border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                      />
                  </div>
                  <div className="relative">
                      <label className="text-sm font-semibold text-slate-600 block mb-1.5">Alpaca Secret Key</label>
                      <input 
                          type={showSecret ? 'text' : 'password'}
                          placeholder="Your Paper Trading Secret Key"
                          value={apiSecret}
                          onChange={(e) => { setApiSecret(e.target.value); setError(''); }}
                          className="w-full bg-white border border-slate-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                      />
                      <button onClick={() => setShowSecret(!showSecret)} title={showSecret ? "Hide secret" : "Show secret"} className="absolute bottom-0 right-0 h-[46px] px-3 flex items-center text-gray-400 hover:text-gray-600">
                          {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                  </div>
                </div>
                {error && <p className="text-red-500 text-center mt-4 text-sm">{error}</p>}
             </div>
          </div>
          
          {/* Investment Simulator */}
          <div id="prediction" className="lg:col-span-3 w-full">
            <InvestmentSimulator />
          </div>

        </main>
        
        {/* Integrations & Insights Section */}
        <section id="connect" className="w-full mt-16 pt-8">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Power Up Your Gameplay</h2>
            <p className="text-center text-slate-500 mb-8 max-w-2xl mx-auto">Connect your financial world to Alpha Infinity to get personalized insights and a hyper-realistic gaming experience.</p>
            
            <div className="mb-12">
                <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><Link size={22} /> Connect Your Universe</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ConnectCard icon={<Banknote />} service={INTEGRATION_DATA.robinhood} onConnect={() => setModalService(INTEGRATION_DATA.robinhood)} />
                  <ConnectCard icon={<Wallet />} service={INTEGRATION_DATA.moonshot} onConnect={() => setModalService(INTEGRATION_DATA.moonshot)} />
                  <ConnectCard icon={<BotMessageSquare />} service={INTEGRATION_DATA.discord} onConnect={() => setModalService(INTEGRATION_DATA.discord)} />
                  <ConnectCard icon={<Banknote />} service={INTEGRATION_DATA.fidelity} onConnect={() => setModalService(INTEGRATION_DATA.fidelity)} />
                  <ConnectCard icon={<Send />} service={INTEGRATION_DATA.telegram} onConnect={() => setModalService(INTEGRATION_DATA.telegram)} />
                </div>
            </div>

             <div>
                <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={22} /> Master the Market</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InsightCard 
                        icon={<PercentCircle className="text-rose-500" />} 
                        title="Risk Management" 
                        description="Learn to protect your capital. Master concepts like stop-loss, position sizing, and risk/reward ratios." 
                    />
                    <InsightCard 
                        icon={<Bot className="text-sky-500" />} 
                        title="Trading Algorithms" 
                        description="Demystify how automated trading works, from simple moving averages to complex AI-driven strategies." 
                    />
                    <InsightCard 
                        icon={<TrendingUp className="text-amber-500" />} 
                        title="The Math Behind Markets" 
                        description="Understand the numbers that matter, from calculating ROI and probabilities to understanding volatility." 
                    />
                </div>
            </div>
        </section>

      </div>
      
      <footer className="relative z-10 w-full bg-white/30 backdrop-blur-md mt-auto">
        <div className="w-full max-w-6xl mx-auto py-6 px-4 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="text-slate-600">
                    <h4 className="font-bold text-slate-700 mb-1">Compound Interest</h4>
                    <p className="text-sm">Often called the "eighth wonder of the world," it's your money making money for you.</p>
                </div>
                 <div className="text-slate-600">
                    <h4 className="font-bold text-slate-700 mb-1">Diversification</h4>
                    <p className="text-sm">Don't put all your eggs in one basket. Spreading investments reduces risk.</p>
                </div>
                 <div className="text-slate-600">
                    <h4 className="font-bold text-slate-700 mb-1">Long-Term Horizon</h4>
                    <p className="text-sm">Time in the market often beats timing the market. Think in years, not days.</p>
                </div>
            </div>
        </div>
      </footer>
    </div>
    {modalService && (
        <ConnectionModal
            isOpen={!!modalService}
            onClose={() => setModalService(null)}
            service={modalService}
        />
    )}
    </>
  );
};

const ConnectCard: React.FC<{ service: IntegrationService; onConnect: () => void; icon: React.ReactNode; }> = ({ service, onConnect, icon }) => (
    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md border border-slate-200/80 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg mb-3 text-slate-600">{icon}</div>
          {service.comingSoon && <div className="text-xs font-bold bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">Coming Soon</div>}
        </div>
        <h4 className="font-bold text-slate-700 mb-1">{service.name}</h4>
        <p className="text-xs text-slate-500 mb-3">{service.description}</p>
      </div>
      <button 
        onClick={onConnect}
        className="w-full mt-auto py-1.5 px-3 bg-cyan-500 text-white rounded-md text-sm font-semibold hover:bg-cyan-600 transition-colors"
      >
        Connect
      </button>
    </div>
);


const InsightCard: React.FC<{ icon: React.ReactNode, title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md border border-slate-200/80 flex flex-col items-start">
        <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg mb-3">{icon}</div>
        <h4 className="font-bold text-slate-700 mb-1">{title}</h4>
        <p className="text-sm text-slate-500">{description}</p>
    </div>
);


export default HomePage;