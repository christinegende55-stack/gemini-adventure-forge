
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameState, Choice, Character } from './types';
import { generateNextScene, generateSceneImage } from './services/geminiService';
import { 
  Shield, 
  Sword, 
  Brain, 
  Zap, 
  Heart, 
  Backpack, 
  ChevronRight, 
  RefreshCcw,
  Sparkles,
  Gamepad2,
  Terminal,
  History as HistoryIcon
} from 'lucide-react';

const INITIAL_CHARACTER: Character = {
  name: "Adventurer",
  health: 100,
  inventory: ["Basic Gear"],
  stats: {
    strength: 5,
    intelligence: 5,
    agility: 5,
  }
};

const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className="typewriter-text">{displayedText}</span>;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    sceneDescription: "Welcome to Gemini Adventure Forge. Select a theme to begin your journey.",
    choices: [],
    character: INITIAL_CHARACTER,
    history: [],
    isGenerating: false,
    theme: ""
  });
  const [inputTheme, setInputTheme] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBengali = useMemo(() => {
    return /[\u0980-\u09FF]/.test(gameState.sceneDescription) || /[\u0980-\u09FF]/.test(gameState.theme);
  }, [gameState.sceneDescription, gameState.theme]);

  const startNewGame = async (selectedTheme: string) => {
    if (!selectedTheme) return;
    setGameState(prev => ({ ...prev, isGenerating: true, theme: selectedTheme }));
    try {
      const data = await generateNextScene(selectedTheme, [], INITIAL_CHARACTER, "I start my adventure.");
      const imageUrl = await generateSceneImage(data.sceneDescription);
      
      setGameState({
        sceneDescription: data.sceneDescription,
        choices: data.choices,
        character: INITIAL_CHARACTER,
        history: [isBengali ? "গেম শুরু হলো: " + selectedTheme : "Game started: " + selectedTheme],
        currentImage: imageUrl,
        isGenerating: false,
        theme: selectedTheme
      });
    } catch (err) {
      console.error(err);
      setGameState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleChoice = async (choice: Choice) => {
    if (gameState.isGenerating) return;

    setGameState(prev => ({ ...prev, isGenerating: true }));
    
    try {
      const data = await generateNextScene(
        gameState.theme,
        gameState.history,
        gameState.character,
        choice.action
      );
      
      const updatedCharacter = { ...gameState.character };
      if (data.healthChange) updatedCharacter.health = Math.max(0, Math.min(100, updatedCharacter.health + data.healthChange));
      if (data.inventoryUpdate) updatedCharacter.inventory = [...new Set([...updatedCharacter.inventory, ...data.inventoryUpdate])];
      if (data.statChanges) {
        updatedCharacter.stats.strength += data.statChanges.strength || 0;
        updatedCharacter.stats.intelligence += data.statChanges.intelligence || 0;
        updatedCharacter.stats.agility += data.statChanges.agility || 0;
      }

      const imgPromise = generateSceneImage(data.sceneDescription);

      setGameState(prev => ({
        ...prev,
        sceneDescription: data.sceneDescription,
        choices: data.choices,
        character: updatedCharacter,
        history: [...prev.history, choice.text],
        isGenerating: false
      }));

      imgPromise.then(img => {
        if (img) setGameState(prev => ({ ...prev, currentImage: img }));
      });

    } catch (err) {
      console.error(err);
      setGameState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [gameState.sceneDescription]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-950 overflow-hidden text-gray-200 selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-800 p-6 flex flex-col gap-6 z-10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/40">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">Adventure Forge</h1>
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">v2.0 Beta</span>
          </div>
        </div>

        {gameState.theme && (
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Vitality</span>
                <span className={`text-sm font-bold ${gameState.character.health < 30 ? 'text-red-500 animate-pulse' : 'text-red-400'}`}>
                  {gameState.character.health}%
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${gameState.character.health < 30 ? 'bg-red-600' : 'bg-red-500'}`} 
                  style={{ width: `${gameState.character.health}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <StatCard icon={<Sword size={14} />} label="STR" value={gameState.character.stats.strength} color="border-orange-500/30 text-orange-400" />
              <StatCard icon={<Brain size={14} />} label="INT" value={gameState.character.stats.intelligence} color="border-blue-500/30 text-blue-400" />
              <StatCard icon={<Zap size={14} />} label="AGI" value={gameState.character.stats.agility} color="border-green-500/30 text-green-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Backpack size={14} /> Inventory
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {gameState.character.inventory.map((item, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-800/50 rounded-md text-[11px] border border-gray-700/50 text-gray-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <HistoryIcon size={14} /> Journey
              </h3>
              <div className="text-[10px] space-y-1 font-mono text-gray-500 max-h-40 overflow-y-auto">
                {gameState.history.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="opacity-30">[{i+1}]</span>
                    <span className="truncate">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-800/50">
          <button 
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-800 hover:bg-red-950/30 hover:text-red-400 border border-gray-700 hover:border-red-900/50 rounded-xl transition-all text-xs font-semibold"
          >
            <RefreshCcw size={14} /> {isBengali ? 'রিসেট করুন' : 'Reset Universe'}
          </button>
        </div>
      </aside>

      {/* Game Content */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-gray-950">
        <div className="flex-1 overflow-y-auto p-4 md:p-12" ref={scrollRef}>
          {gameState.theme === "" ? (
            <div className="max-w-xl mx-auto mt-12 space-y-10 animate-in fade-in zoom-in-95 duration-700">
              <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-indigo-500/10 rounded-full mb-2">
                  <Terminal className="w-10 h-10 text-indigo-500" />
                </div>
                <h2 className="text-4xl font-extrabold text-white tracking-tight">গেম শুরু করুন</h2>
                <p className="text-gray-400 text-lg">একটি থিম টাইপ করুন বা নিচের পরামর্শ থেকে একটি বেছে নিন।</p>
              </div>
              
              <div className="relative group">
                <input 
                  type="text" 
                  value={inputTheme}
                  onChange={(e) => setInputTheme(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startNewGame(inputTheme)}
                  placeholder="উদাঃ সাইবারপাঙ্ক ঢাকা, রহস্যময় দ্বীপ..."
                  className="w-full bg-gray-900 border-2 border-gray-800 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-indigo-500 transition-all shadow-2xl focus:shadow-indigo-500/10"
                />
                <button 
                  onClick={() => startNewGame(inputTheme)}
                  disabled={!inputTheme || gameState.isGenerating}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all font-bold flex items-center gap-2"
                >
                  {gameState.isGenerating ? 'অপেক্ষা করুন...' : 'তৈরি করুন'} <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["Classic Fantasy", "Deep Space Horror", "রহস্যময় জঙ্গল", "সাইবারপাঙ্ক ভবিষ্যৎ", "Ancient Egypt", "Steampunk Adventure"].map(t => (
                  <button 
                    key={t}
                    onClick={() => startNewGame(t)}
                    className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-sm font-medium text-gray-300 hover:text-white text-center"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10">
              {/* Scene Visual */}
              <div className={`aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative group transition-opacity duration-1000 ${gameState.isGenerating ? 'opacity-50' : 'opacity-100'}`}>
                {gameState.currentImage ? (
                  <img 
                    src={gameState.currentImage} 
                    alt="Current Scene" 
                    className="w-full h-full object-cover transition-transform duration-[20s] scale-100 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-gray-800 animate-pulse" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80"></div>
                <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
                   <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                     Live Feed
                   </div>
                </div>
              </div>

              {/* Scene Narrative */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                  <Terminal size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Transmission Received</span>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-xl md:text-2xl leading-relaxed text-gray-100 font-medium">
                    <TypewriterText text={gameState.sceneDescription} />
                  </p>
                </div>
              </div>

              {/* Choices Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                {gameState.isGenerating ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-900/30 rounded-2xl animate-pulse border border-gray-800/50"></div>
                  ))
                ) : (
                  gameState.choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleChoice(choice)}
                      className="group p-5 bg-gray-900/60 border-2 border-gray-800/50 rounded-2xl hover:border-indigo-500 hover:bg-indigo-500/10 transition-all text-left flex items-start gap-4 active:scale-[0.98]"
                    >
                      <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl border border-gray-700 bg-gray-950 flex items-center justify-center group-hover:border-indigo-400 group-hover:bg-indigo-600 transition-all duration-300">
                        <ChevronRight size={18} className="text-gray-500 group-hover:text-white" />
                      </div>
                      <span className="text-gray-300 group-hover:text-white font-semibold leading-tight text-lg py-1">
                        {choice.text}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Persistent Loader */}
        {gameState.isGenerating && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-500/30 border border-indigo-400/30 animate-in slide-in-from-bottom-10">
            <div className="flex gap-1">
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white uppercase">
              {isBengali ? 'বাস্তবতা তৈরি হচ্ছে...' : 'Forging Reality...'}
            </span>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string }> = ({ icon, label, value, color }) => (
  <div className={`flex items-center justify-between p-3 bg-gray-950 border rounded-xl ${color.split(' ')[0]}`}>
    <div className="flex items-center gap-3">
      <div className={`p-1.5 bg-gray-900 rounded-lg shadow-inner ${color.split(' ')[1]}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-gray-500 tracking-tighter">{label}</span>
    </div>
    <span className="text-sm font-mono font-bold text-white">{value.toString().padStart(2, '0')}</span>
  </div>
);

export default App;
