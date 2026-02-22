import React from 'react';
import { Play, RotateCcw, Ghost, Skull } from 'lucide-react';

interface OverlayProps {
  onStart: () => void;
  onRestart: () => void;
  gameState: 'START' | 'GAME_OVER' | 'PLAYING';
  score: number;
  highScore: number;
}

export const GameOverlay: React.FC<OverlayProps> = ({ onStart, onRestart, gameState, score, highScore }) => {
  if (gameState === 'PLAYING') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 transition-all duration-500 backdrop-blur-sm">
      <div className="text-center p-8 bg-slate-900/60 border-2 border-slate-700/50 rounded-3xl shadow-2xl backdrop-blur-md max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300">
        
        {gameState === 'START' && (
          <div className="space-y-8">
            <div className="relative inline-block">
              <Skull className="w-24 h-24 text-slate-400 mx-auto animate-pulse" />
              <Ghost className="w-8 h-8 text-cyan-200/50 absolute -top-2 -right-2 animate-bounce" />
            </div>
            
            <div>
              <h1 className="text-6xl text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-cyan-500 drop-shadow-[0_5px_15px_rgba(34,211,238,0.4)]" style={{ fontFamily: '"Creepster", cursive' }}>
                FREEZER CHALLENGE
              </h1>
              <p className="mt-4 text-slate-400 font-medium tracking-widest text-xs animate-pulse">
                SURVIVE THE ETERNAL FROST
              </p>
            </div>

            <button
              onClick={onStart}
              className="group relative px-12 py-4 bg-slate-100 text-slate-950 font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-cyan-400 translate-y-full transition-transform group-hover:translate-y-0" />
              <div className="relative flex items-center gap-2">
                <Play className="w-6 h-6 fill-current" />
                START CHALLENGE
              </div>
            </button>
            
            <div className="text-xs text-slate-500 italic mt-4">
              Tap to fly. Avoid the hooks.
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="space-y-6">
            <h2 className="text-6xl text-red-700 animate-bounce tracking-widest drop-shadow-[0_0_15px_rgba(185,28,28,0.6)]" style={{ fontFamily: '"Creepster", cursive' }}>
              FROZEN SOLID
            </h2>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Score</p>
                <p className="text-4xl font-black text-white">{score}</p>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Best</p>
                <p className="text-4xl font-black text-cyan-400">{highScore}</p>
              </div>
            </div>

            <button
              onClick={onRestart}
              className="group relative w-full px-12 py-5 bg-red-950 text-red-100 font-black rounded-2xl transition-all hover:bg-red-900 active:scale-95 shadow-[0_0_20px_rgba(153,27,27,0.4)] flex items-center justify-center gap-3 overflow-hidden border border-red-800"
            >
               <RotateCcw className="w-6 h-6 transition-transform group-hover:rotate-180 duration-500" />
               RETRY SOULS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
