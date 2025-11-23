
import React from 'react';

interface MenuProps {
  onStart: () => void;
}

const Menu: React.FC<MenuProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 backdrop-blur-sm">
      <div className="relative">
        {/* Japanese text behind */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-9xl text-red-900/30 font-samurai whitespace-nowrap select-none">
            侍 決 闘
        </div>
        <h1 className="relative text-7xl font-samurai text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-yellow-500 mb-2 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-center leading-tight">
          BUSHIDO<br/>
          <span className="text-4xl text-gray-200 tracking-[0.5em]">BLADE</span>
        </h1>
      </div>
      
      <div className="space-y-8 text-center mt-12">
        <button 
          onClick={onStart}
          className="px-12 py-4 bg-red-800 hover:bg-red-700 border-2 border-yellow-600 text-yellow-100 font-bold font-samurai tracking-widest text-xl rounded shadow-[0_0_20px_rgba(220,38,38,0.6)] transition transform hover:scale-105"
        >
          BEGIN DUEL
        </button>
        
        <div className="bg-black/60 p-6 rounded border border-gray-700 text-gray-400 mt-8 text-sm max-w-md mx-auto">
          <p className="font-samurai text-yellow-500 mb-4 text-lg">Controls</p>
          <div className="grid grid-cols-2 gap-8 text-left font-mono">
            <div>
              <strong className="text-blue-400 block mb-2 border-b border-blue-900">RONIN (P1)</strong>
              Move: A / D<br/>
              Jump: W<br/>
              Attack: Space<br/>
              Slide: S
            </div>
            <div>
              <strong className="text-red-500 block mb-2 border-b border-red-900">SAMURAI (P2)</strong>
              Move: Arrows<br/>
              Jump: Up<br/>
              Attack: Enter<br/>
              Slide: Down
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;