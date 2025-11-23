import React, { useEffect, useState } from 'react';
import { Player } from '../types';
import { generateMatchCommentary } from '../services/geminiService';
import { playSound } from '../utils/sounds';

interface GameOverProps {
  winner: Player | null;
  loser: Player | null;
  duration: number;
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ winner, loser, duration, onRestart }) => {
  const [commentary, setCommentary] = useState<string>("Analyzing fight data...");

  useEffect(() => {
    if (winner && loser) {
      // Fetch Gemini commentary
      generateMatchCommentary({
        winnerName: winner.name,
        loserName: loser.name,
        winnerHealth: Math.ceil(winner.health),
        duration: Math.floor(duration),
      }).then(setCommentary);
    }
  }, [winner, loser, duration]);

  if (!winner) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30">
      <h2 className="text-5xl font-arcade text-yellow-400 mb-2">KO!</h2>
      <h3 className="text-3xl font-arcade text-white mb-6">
        <span style={{ color: winner.color }}>{winner.name}</span> WINS
      </h3>

      <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full mb-8 border border-gray-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-pink-500"></div>
        <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold">Gemini Match Analysis</h4>
        <p className="text-lg italic text-gray-200 font-serif leading-relaxed">
          "{commentary}"
        </p>
      </div>

      <button 
        onClick={() => {
          playSound('START');
          onRestart();
        }}
        className="px-6 py-2 border-2 border-white hover:bg-white hover:text-black text-white font-arcade transition"
      >
        REMATCH
      </button>
    </div>
  );
};

export default GameOver;
