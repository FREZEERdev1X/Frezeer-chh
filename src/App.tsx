import { useState, useCallback, useEffect } from 'react';
import { Game } from './components/Game';
import { GameOverlay } from './components/GameOverlay';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

export function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('freezer-challenge-highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setGameState('GAME_OVER');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('freezer-challenge-highscore', finalScore.toString());
    }
  }, [highScore]);

  const handleStart = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setGameState('PLAYING');
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden select-none touch-none">
      <Game 
        onGameOver={handleGameOver} 
        isStarted={gameState === 'PLAYING'} 
        onStart={handleStart} 
      />
      
      <GameOverlay 
        gameState={gameState} 
        score={score} 
        highScore={highScore}
        onStart={handleStart}
        onRestart={handleRestart}
      />
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] mix-blend-overlay"></div>
      
      <div className="absolute top-4 left-4 pointer-events-none text-slate-600 font-mono text-xs opacity-50 uppercase tracking-widest">
        Freezer Prototype v1.0.4
      </div>
    </div>
  );
}
