import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Menu from './components/Menu';
import GameOver from './components/GameOver';
import { Player } from './types';

function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  const [lastMatch, setLastMatch] = useState<{winner: Player | null, loser: Player | null, duration: number}>({
    winner: null,
    loser: null,
    duration: 0
  });

  const handleStart = () => {
    setGameState('PLAYING');
  };

  const handleGameOver = (winner: Player, loser: Player, duration: number) => {
    setLastMatch({ winner, loser, duration });
    setGameState('GAME_OVER');
  };

  const handleRestart = () => {
    setGameState('PLAYING');
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-[800px] aspect-[800/500]">
        
        {/* Game Layer */}
        <GameCanvas 
          onGameOver={handleGameOver} 
          gameStatus={gameState} 
        />

        {/* Overlay Menus */}
        {gameState === 'MENU' && <Menu onStart={handleStart} />}
        
        {gameState === 'GAME_OVER' && (
          <GameOver 
            winner={lastMatch.winner} 
            loser={lastMatch.loser} 
            duration={lastMatch.duration}
            onRestart={handleRestart} 
          />
        )}
      </div>
    </div>
  );
}

export default App;
