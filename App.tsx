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
    // 1. Outer Container: Handles the Mobile Viewport (100dvh) and Centering
    <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      
      {/* 2. Inner Wrapper: This is crucial for "stacking" the menu on top of the game */}
      <div className="relative w-full h-full max-w-[1000px] max-h-[600px]"> 
        
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
