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
    // UPDATED: Full screen, black background, no padding
    <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <div className="relative w-full h-full">
        
        {/* Game Layer */}
        <GameCanvas 
          onGameOver={handleGameOver} 
          gameStatus={gameState} 
        />

        {/* Overlay Menus */}
        {/* These will sit on top of the full-screen canvas */}
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
