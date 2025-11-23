
export interface Vector2 {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum PlayerState {
  IDLE,
  WALK,
  JUMP,
  ATTACK,
  HURT,
  DEAD,
  WIN,
  SLIDE,
  JUMP_ATTACK
}

export interface Player {
  id: number;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  color: string;
  direction: 1 | -1; // 1 for right, -1 for left
  health: number;
  maxHealth: number;
  energy: number; // For special moves
  state: PlayerState;
  frameTimer: number; // For animation
  isGrounded: boolean;
  attackCooldown: number;
  hitbox: Box | null;
  name: string;
}

export interface GameState {
  player1: Player;
  player2: Player;
  gameStatus: 'MENU' | 'PLAYING' | 'GAME_OVER';
  winner: number | null; // 1 or 2
  timeLeft: number;
}

export enum ParticleType {
  SPARK,
  BLOOD,
  DUST,
  SAKURA
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type: ParticleType;
}

export interface MatchStats {
  winnerName: string;
  loserName: string;
  winnerHealth: number;
  duration: number; // seconds
}