

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Player, PlayerState, Particle, ParticleType } from '../types';
import { createPlayer, updatePlayer, GROUND_Y, PLAYER_WIDTH, PLAYER_HEIGHT } from '../utils/gameLogic';
import { playSound, startMusic, stopMusic } from '../utils/sounds';

interface GameCanvasProps {
  onGameOver: (winner: Player, loser: Player, duration: number) => void;
  gameStatus: 'MENU' | 'PLAYING' | 'GAME_OVER';
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, gameStatus }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  
  // Game State Refs
  const p1Ref = useRef<Player>(createPlayer(1, 150, 'Blue Ronin', '#3b82f6'));
  const p2Ref = useRef<Player>(createPlayer(2, 600, 'Red Samurai', '#ef4444'));
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);
  const bgParticlesRef = useRef<Particle[]>([]); // Sakura petals

  // Sync health/energy to React state for UI updates
  const [p1Stats, setP1Stats] = useState({ health: 100, energy: 100 });
  const [p2Stats, setP2Stats] = useState({ health: 100, energy: 100 });

  const resetGame = useCallback(() => {
    p1Ref.current = createPlayer(1, 150, 'Blue Ronin', '#3b82f6');
    p2Ref.current = createPlayer(2, 600, 'Red Samurai', '#ef4444');
    particlesRef.current = [];
    startTimeRef.current = Date.now();
    setP1Stats({ health: 100, energy: 100 });
    setP2Stats({ health: 100, energy: 100 });
    keysRef.current.clear();
    
    // Init background sakura
    bgParticlesRef.current = [];
    for(let i=0; i<30; i++) {
        bgParticlesRef.current.push({
            x: Math.random() * 800,
            y: Math.random() * 500,
            vx: -0.5 - Math.random(),
            vy: 0.5 + Math.random(),
            life: 100,
            color: '#ffb7b2',
            size: Math.random() * 3 + 1,
            type: ParticleType.SAKURA
        });
    }
    
    playSound('START');
  }, []);

  // Music Control
  useEffect(() => {
    if (gameStatus === 'PLAYING') {
      resetGame();
      startMusic();
    } else {
      stopMusic();
    }
    return () => stopMusic();
  }, [gameStatus, resetGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Virtual Control Helpers
  const handleVirtualDown = (key: string) => {
    keysRef.current.add(key);
  };
  
  const handleVirtualUp = (key: string) => {
    keysRef.current.delete(key);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Sky Gradient (Sunset)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a103c'); // Deep purple
    gradient.addColorStop(0.5, '#ad4a28'); // Sunset Orange
    gradient.addColorStop(1, '#ff9068'); // Light peach
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Sun
    ctx.fillStyle = '#b91c1c'; // Deep Red Sun
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.6, 120, 0, Math.PI * 2);
    ctx.fill();

    // Mountains (Silhouette)
    ctx.fillStyle = '#0f0518';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(200, 250);
    ctx.lineTo(400, 350);
    ctx.lineTo(600, 200);
    ctx.lineTo(800, GROUND_Y);
    ctx.lineTo(800, height);
    ctx.lineTo(0, height);
    ctx.fill();

    // Pagoda/Torii hint in background
    ctx.fillStyle = '#1a0b2e';
    ctx.fillRect(650, 280, 10, 120);
    ctx.fillRect(720, 280, 10, 120);
    ctx.fillRect(630, 300, 120, 10);
    ctx.fillRect(640, 320, 100, 10);

    // Ground
    ctx.fillStyle = '#1c1917'; // Dark earth
    ctx.fillRect(0, GROUND_Y, width, height - GROUND_Y);
    
    // Tatami/Wood floor details
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 10);
    ctx.lineTo(width, GROUND_Y + 10);
    ctx.stroke();
  };

  const drawAnimePlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
    const { position, width, height, color, direction, state, frameTimer } = player;
    
    ctx.save();
    ctx.translate(position.x + width / 2, position.y + height);
    ctx.scale(direction, 1);

    // Animation vars
    let bounce = 0;
    let armRot = 0;
    let legRot = 0;
    let bodyTilt = 0;
    let hairSway = Math.sin(frameTimer * 0.1) * 5;

    if (state === PlayerState.IDLE) {
      bounce = Math.sin(frameTimer * 0.15) * 2;
    } else if (state === PlayerState.WALK) {
      bounce = Math.abs(Math.sin(frameTimer * 0.3)) * 5;
      legRot = Math.sin(frameTimer * 0.3) * 0.6;
      armRot = -Math.sin(frameTimer * 0.3) * 0.6;
    } else if (state === PlayerState.ATTACK) {
      armRot = -Math.PI / 2.5; 
      bodyTilt = 0.2;
    } else if (state === PlayerState.JUMP) {
      legRot = 0.5;
      armRot = -0.5;
    } else if (state === PlayerState.SLIDE) {
      bodyTilt = 1.2;
      bounce = -30;
      legRot = 1.4;
    } else if (state === PlayerState.JUMP_ATTACK) {
      bodyTilt = 0.8;
      armRot = Math.PI / 2; // Overhead
      legRot = 1.0;
      bounce = -10;
    } else if (state === PlayerState.HURT) {
      bodyTilt = -0.5;
      armRot = -2;
    } else if (state === PlayerState.DEAD) {
      bodyTilt = -1.5;
      bounce = 30; // On floor
    } else if (state === PlayerState.WIN) {
      armRot = -2.5; // Victory pose
      bounce = Math.sin(frameTimer * 0.2) * 5;
    }

    ctx.rotate(bodyTilt);
    ctx.translate(0, bounce);

    // --- Draw Character ---

    // 1. Back Leg (Hakama)
    ctx.fillStyle = '#111';
    ctx.save();
    ctx.rotate(-legRot);
    ctx.fillRect(-15, -40, 25, 45); 
    ctx.restore();

    // 2. Back Arm (Sleeve)
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(0, -70);
    ctx.rotate(-armRot);
    ctx.fillRect(-10, 0, 15, 30);
    // Hand
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(0, 35, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Body (Kimono/Gi)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-15, -90); // Shoulder L
    ctx.lineTo(15, -90);  // Shoulder R
    ctx.lineTo(20, -40);  // Hip R
    ctx.lineTo(-20, -40); // Hip L
    ctx.fill();

    // Belt
    ctx.fillStyle = '#000';
    ctx.fillRect(-22, -45, 44, 8);

    // 4. Front Leg (Hakama)
    ctx.fillStyle = '#222';
    ctx.save();
    ctx.rotate(legRot);
    ctx.fillRect(-10, -40, 25, 45);
    // Foot
    ctx.fillStyle = '#eee'; // Socks/Tabi
    ctx.fillRect(-5, 5, 20, 8);
    ctx.restore();

    // 5. Head
    ctx.fillStyle = '#ffdbac'; // Skin
    ctx.beginPath();
    ctx.arc(0, -100, 14, 0, Math.PI*2);
    ctx.fill();

    // Face details
    ctx.fillStyle = '#000';
    // Eye
    if (state === PlayerState.HURT || state === PlayerState.DEAD) {
        ctx.beginPath();
        ctx.moveTo(2, -102); ctx.lineTo(8, -98);
        ctx.moveTo(8, -102); ctx.lineTo(2, -98);
        ctx.stroke();
    } else {
        ctx.fillRect(4, -102, 4, 2); // Eye
        ctx.fillRect(4, -105, 6, 1); // Eyebrow
    }
    // Headband
    ctx.fillStyle = color;
    ctx.fillRect(-14, -110, 28, 6);
    // Headband tails
    ctx.beginPath();
    ctx.moveTo(-14, -107);
    ctx.lineTo(-30 - hairSway, -100);
    ctx.lineTo(-30 - hairSway, -115);
    ctx.fill();

    // Hair (Spiky anime style)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(-14, -110);
    ctx.lineTo(-10, -130 + hairSway/2);
    ctx.lineTo(0, -115);
    ctx.lineTo(10, -135 - hairSway/2);
    ctx.lineTo(14, -110);
    ctx.fill();

    // 6. Front Arm (Sleeve) & Sword
    ctx.save();
    ctx.translate(0, -70);
    ctx.rotate(armRot);
    
    // Sleeve
    ctx.fillStyle = color;
    ctx.fillRect(-5, 0, 20, 25);
    
    // Arm/Hand
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(0, 25, 10, 10);

    // Katana
    if (state === PlayerState.ATTACK || state === PlayerState.JUMP_ATTACK) {
        // Drawn sword
        ctx.translate(5, 30);
        ctx.rotate(-Math.PI/4); // Angle blade
        
        // Handle
        ctx.fillStyle = '#000';
        ctx.fillRect(-4, -5, 8, 20);
        
        // Guard
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-8, 15, 16, 4);

        // Blade
        ctx.fillStyle = '#e5e7eb';
        ctx.beginPath();
        ctx.moveTo(-3, 19);
        ctx.lineTo(-3, 70); // Long blade
        ctx.lineTo(0, 75); // Tip
        ctx.lineTo(3, 70);
        ctx.lineTo(3, 19);
        ctx.fill();
        
        // Shine
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(0, 65);
        ctx.stroke();

        // Trail effect for sword
        if (state === PlayerState.JUMP_ATTACK) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.moveTo(0, 75);
            ctx.lineTo(-30, 20);
            ctx.lineTo(30, 20);
            ctx.fill();
        }

    } else {
        // Sheathed sword on hip (simplified)
        // Usually handled separately, but let's put it in hand for idle for simplicity or hide it
        // Let's just draw a handle sticking out of the belt area if idle
    }
    ctx.restore();

    // Hip Sheath (always visible on body)
    if (state !== PlayerState.ATTACK && state !== PlayerState.JUMP_ATTACK) {
        ctx.fillStyle = '#333';
        ctx.save();
        ctx.translate(-10, -45);
        ctx.rotate(-0.5);
        ctx.fillRect(-2, -5, 4, 40); // Scabbard
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-4, -5, 8, 2); // Guard
        ctx.fillStyle = '#000';
        ctx.fillRect(-3, -15, 6, 10); // Handle
        ctx.restore();
    }

    ctx.restore();
  };

  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Dynamic Background
    drawBackground(ctx, canvas.width, canvas.height);

    // Update & Draw Background Particles (Sakura)
    bgParticlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.x += Math.sin(Date.now() * 0.001) * 0.5; // Wobble

        if (p.x < 0) p.x = canvas.width;
        if (p.y > GROUND_Y) p.y = 0; // Wrap vertical
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    });

    if (gameStatus === 'PLAYING' || gameStatus === 'GAME_OVER') {
      const p1 = p1Ref.current;
      const p2 = p2Ref.current;

      // Update Logic
      if (gameStatus === 'PLAYING') {
        const newParticles1 = updatePlayer(p1, p2, keysRef.current, { width: canvas.width, height: canvas.height });
        const newParticles2 = updatePlayer(p2, p1, keysRef.current, { width: canvas.width, height: canvas.height });
        particlesRef.current.push(...newParticles1, ...newParticles2);

        setP1Stats({ health: p1.health, energy: p1.energy });
        setP2Stats({ health: p2.health, energy: p2.energy });

        if (p1.state === PlayerState.DEAD || p2.state === PlayerState.DEAD) {
          const winner = p1.health > 0 ? p1 : p2;
          const loser = p1.health > 0 ? p2 : p1;
          const duration = (Date.now() - startTimeRef.current) / 1000;
          onGameOver(winner, loser, duration);
        }
      }

      // Draw Players
      drawAnimePlayer(ctx, p1);
      drawAnimePlayer(ctx, p2);

      // Draw FG Particles (Blood/Sparks)
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life -= 0.05;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // Gravity for blood
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        if (p.type === ParticleType.BLOOD) {
           ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        } else if (p.type === ParticleType.SPARK) {
           ctx.moveTo(p.x, p.y - p.size);
           ctx.lineTo(p.x + p.size, p.y);
           ctx.lineTo(p.x, p.y + p.size);
           ctx.lineTo(p.x - p.size, p.y);
        } else {
           ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        }
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }
    }

    requestRef.current = requestAnimationFrame(drawLoop);
  }, [gameStatus, onGameOver]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [drawLoop]);

  const Btn = ({ k, icon, className }: { k: string, icon: React.ReactNode, className?: string }) => (
    <button
      className={`w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/30 active:bg-white/30 active:scale-95 transition-all flex items-center justify-center text-white/80 shadow-lg select-none touch-none ${className}`}
      onPointerDown={(e) => { e.preventDefault(); handleVirtualDown(k); }}
      onPointerUp={(e) => { e.preventDefault(); handleVirtualUp(k); }}
      onPointerLeave={(e) => { e.preventDefault(); handleVirtualUp(k); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );

  return (
    <div className="relative group select-none">
      <div className="absolute top-4 left-4 right-4 flex justify-between text-white font-arcade z-10 pointer-events-none">
        {/* P1 Stats */}
        <div className="w-1/3 pointer-events-auto">
           <div className="flex justify-between mb-1 text-sm font-samurai tracking-widest">
             <span className="text-blue-400">P1 RONIN</span>
             <span>{Math.ceil(p1Stats.health)}</span>
           </div>
           <div className="h-4 bg-gray-900 border border-blue-600 mb-1 rounded-sm overflow-hidden">
             <div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-100" style={{ width: `${p1Stats.health}%` }}></div>
           </div>
           <div className="h-2 bg-gray-900 border border-yellow-600 w-3/4 rounded-sm">
             <div className="h-full bg-yellow-400 transition-all duration-100" style={{ width: `${p1Stats.energy}%` }}></div>
           </div>
        </div>

        {/* Timer/VS */}
        <div className="text-4xl text-red-600 font-samurai mt-[-10px] drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">VS</div>

        {/* P2 Stats */}
        <div className="w-1/3 pointer-events-auto">
           <div className="flex justify-between mb-1 text-sm font-samurai tracking-widest">
             <span>{Math.ceil(p2Stats.health)}</span>
             <span className="text-red-500">P2 SAMURAI</span>
           </div>
           <div className="h-4 bg-gray-900 border border-red-600 mb-1 rounded-sm overflow-hidden">
             <div className="h-full bg-gradient-to-l from-red-700 to-red-400 transition-all duration-100 float-right" style={{ width: `${p2Stats.health}%` }}></div>
           </div>
           <div className="h-2 bg-gray-900 border border-yellow-600 w-3/4 ml-auto rounded-sm">
             <div className="h-full bg-yellow-400 transition-all duration-100 float-right" style={{ width: `${p2Stats.energy}%` }}></div>
           </div>
        </div>
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={500} 
        className="border-4 border-gray-900 bg-black rounded shadow-2xl w-full max-w-[800px] block mx-auto"
      />

      {/* Virtual Controls Overlay - Only visible during play ideally, but keeping always for simplicity if desired, or conditional */}
      {gameStatus === 'PLAYING' && (
        <>
          {/* P1 Controls (Left) */}
          <div className="absolute bottom-4 left-4 flex gap-4 z-20">
            <div className="grid grid-cols-3 gap-1">
              <div className="col-start-2"><Btn k="w" icon="▲" /></div>
              <div className="col-start-1 row-start-2"><Btn k="a" icon="◀" /></div>
              <div className="col-start-2 row-start-2"><Btn k="s" icon="▼" /></div>
              <div className="col-start-3 row-start-2"><Btn k="d" icon="▶" /></div>
            </div>
            <div className="flex items-center mt-4">
              <button
                className="w-16 h-16 rounded-full bg-red-500/20 backdrop-blur border-2 border-red-500/50 active:bg-red-500/50 active:scale-95 transition-all flex items-center justify-center text-red-200 font-bold shadow-lg select-none touch-none"
                onPointerDown={(e) => { e.preventDefault(); handleVirtualDown(' '); }}
                onPointerUp={(e) => { e.preventDefault(); handleVirtualUp(' '); }}
                onPointerLeave={(e) => { e.preventDefault(); handleVirtualUp(' '); }}
                onContextMenu={(e) => e.preventDefault()}
              >
                ATTK
              </button>
            </div>
          </div>

          {/* P2 Controls (Right) */}
          <div className="absolute bottom-4 right-4 flex flex-row-reverse gap-4 z-20">
            <div className="grid grid-cols-3 gap-1">
              <div className="col-start-2"><Btn k="ArrowUp" icon="▲" /></div>
              <div className="col-start-1 row-start-2"><Btn k="ArrowLeft" icon="◀" /></div>
              <div className="col-start-2 row-start-2"><Btn k="ArrowDown" icon="▼" /></div>
              <div className="col-start-3 row-start-2"><Btn k="ArrowRight" icon="▶" /></div>
            </div>
            <div className="flex items-center mt-4">
              <button
                className="w-16 h-16 rounded-full bg-blue-500/20 backdrop-blur border-2 border-blue-500/50 active:bg-blue-500/50 active:scale-95 transition-all flex items-center justify-center text-blue-200 font-bold shadow-lg select-none touch-none"
                onPointerDown={(e) => { e.preventDefault(); handleVirtualDown('Enter'); }}
                onPointerUp={(e) => { e.preventDefault(); handleVirtualUp('Enter'); }}
                onPointerLeave={(e) => { e.preventDefault(); handleVirtualUp('Enter'); }}
                onContextMenu={(e) => e.preventDefault()}
              >
                ATTK
              </button>
            </div>
          </div>
        </>
      )}
      
      <div className="text-center text-gray-500 mt-3 text-xs font-mono">
        <span className="mr-6 border-b-2 border-blue-500 pb-1">P1: WASD + SPACE (Cut) + S (Slide)</span>
        <span className="border-b-2 border-red-500 pb-1">P2: ARROWS + ENTER (Cut) + DOWN (Slide)</span>
      </div>
    </div>
  );
};

export default GameCanvas;
