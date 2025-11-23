
import { Player, PlayerState, GameState, Vector2, Box, Particle, ParticleType } from '../types';
import { playSound } from './sounds';

export const GRAVITY = 0.8;
export const JUMP_FORCE = -16;
export const MOVE_SPEED = 6;
export const GROUND_Y = 400; // Y position of the floor
export const FRICTION = 0.8;
export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 100;

// Attack Constants
export const ATTACK_COOLDOWN = 25; // frames
export const ATTACK_DURATION = 10; // frames
export const ATTACK_DAMAGE = 10;
export const JUMP_ATTACK_DAMAGE = 15;
export const JUMP_ATTACK_COST = 25;
export const JUMP_ATTACK_DURATION = 15;

export const KNOCKBACK_X = 10;
export const KNOCKBACK_Y = -5;

// Slide Constants
export const SLIDE_SPEED = 14;
export const SLIDE_DURATION = 25;
export const SLIDE_COST = 30;
export const ENERGY_REGEN = 0.3;

export const createPlayer = (id: number, x: number, name: string, color: string): Player => ({
  id,
  name,
  position: { x, y: 0 }, // Will fall to ground
  velocity: { x: 0, y: 0 },
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  color,
  direction: id === 1 ? 1 : -1,
  health: 100,
  maxHealth: 100,
  energy: 100,
  state: PlayerState.IDLE,
  frameTimer: 0,
  isGrounded: false,
  attackCooldown: 0,
  hitbox: null
});

const checkCollision = (box1: Box, box2: Box): boolean => {
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  );
};

export const updatePlayer = (player: Player, opponent: Player, keys: Set<string>, bounds: { width: number, height: number }): Particle[] => {
  const particles: Particle[] = [];
  
  if (player.state === PlayerState.DEAD || player.state === PlayerState.WIN) return particles;

  // Energy Regen
  player.energy = Math.min(100, player.energy + ENERGY_REGEN);

  // Input Handling
  let moveX = 0;
  const isP1 = player.id === 1;
  const KEY_LEFT = isP1 ? 'a' : 'ArrowLeft';
  const KEY_RIGHT = isP1 ? 'd' : 'ArrowRight';
  const KEY_JUMP = isP1 ? 'w' : 'ArrowUp';
  const KEY_DOWN = isP1 ? 's' : 'ArrowDown';
  const KEY_ATTACK = isP1 ? ' ' : 'Enter'; // Space for P1, Enter for P2

  const canControl = player.state !== PlayerState.HURT && player.state !== PlayerState.SLIDE;

  if (canControl) {
    if (keys.has(KEY_LEFT)) moveX = -1;
    if (keys.has(KEY_RIGHT)) moveX = 1;
    
    // Jump
    if (keys.has(KEY_JUMP) && player.isGrounded) {
      player.velocity.y = JUMP_FORCE;
      player.isGrounded = false;
      player.state = PlayerState.JUMP;
      playSound('JUMP');
    }

    // Slide (Down Button)
    if (keys.has(KEY_DOWN) && player.isGrounded && player.energy >= SLIDE_COST) {
      player.state = PlayerState.SLIDE;
      player.frameTimer = 0;
      player.energy -= SLIDE_COST;
      player.velocity.x = player.direction * SLIDE_SPEED;
      playSound('SLIDE');
      
      // Add dust particles
      for(let i=0; i<5; i++) {
        particles.push({
          x: player.position.x + player.width/2,
          y: player.position.y + player.height,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 2,
          life: 0.8,
          color: '#e3d5c8', // Dust color
          size: Math.random() * 4 + 2,
          type: ParticleType.DUST
        });
      }
    }

    // Attacks
    if (keys.has(KEY_ATTACK) && player.attackCooldown <= 0) {
      // Jump Attack
      if (!player.isGrounded && player.energy >= JUMP_ATTACK_COST) {
        player.state = PlayerState.JUMP_ATTACK;
        player.attackCooldown = ATTACK_COOLDOWN;
        player.frameTimer = 0;
        player.energy -= JUMP_ATTACK_COST;
        playSound('JUMP_ATTACK');

        // Initial small hover boost
        player.velocity.y = Math.min(player.velocity.y, 0);

        const hitboxX = player.direction === 1 
          ? player.position.x + player.width/2 
          : player.position.x - 30;

        // Hitbox hits below and in front
        player.hitbox = {
          x: hitboxX,
          y: player.position.y + player.height - 20,
          width: 50,
          height: 60
        };

      } 
      // Ground Attack
      else if (player.isGrounded) {
        player.state = PlayerState.ATTACK;
        player.attackCooldown = ATTACK_COOLDOWN;
        player.frameTimer = 0;
        playSound('ATTACK');
        
        const hitboxX = player.direction === 1 
          ? player.position.x + player.width 
          : player.position.x - 60;
          
        player.hitbox = {
          x: hitboxX,
          y: player.position.y + 20,
          width: 60,
          height: 40
        };
      }
    }
  }

  // Physics Application
  
  // Slide Physics
  if (player.state === PlayerState.SLIDE) {
    player.velocity.x = player.direction * (SLIDE_SPEED * (1 - player.frameTimer / (SLIDE_DURATION * 1.5))); // Decelerate slightly
    
    player.frameTimer++;
    if (player.frameTimer > SLIDE_DURATION) {
      player.state = PlayerState.IDLE;
      player.velocity.x = 0;
    }
  } else if (player.state !== PlayerState.HURT) {
    player.velocity.x += moveX * 1.5; // Acceleration
    player.velocity.x *= FRICTION; // Friction
  } else {
    // Hurt state friction
    player.velocity.x *= 0.9;
  }

  player.velocity.y += GRAVITY;

  player.position.x += player.velocity.x;
  player.position.y += player.velocity.y;

  // Ground Collision
  if (player.position.y + player.height >= GROUND_Y) {
    player.position.y = GROUND_Y - player.height;
    player.velocity.y = 0;
    player.isGrounded = true;
    
    // Land from Jump or Jump Attack
    if (player.state === PlayerState.JUMP || 
        player.state === PlayerState.JUMP_ATTACK || 
        player.state === PlayerState.HURT) {
      player.state = PlayerState.IDLE;
      player.hitbox = null; // Cancel hitbox on landing
    }
  }

  // Wall Collision
  if (player.position.x < 0) {
    player.position.x = 0;
    player.velocity.x = 0;
  }
  if (player.position.x + player.width > bounds.width) {
    player.position.x = bounds.width - player.width;
    player.velocity.x = 0;
  }

  // State Management & Direction
  if (canControl) {
    // Cannot turn during attack frames
    if (player.state !== PlayerState.ATTACK && player.state !== PlayerState.JUMP_ATTACK) {
      if (moveX !== 0) {
        player.direction = moveX as 1 | -1;
        if (player.isGrounded) player.state = PlayerState.WALK;
      } else if (player.isGrounded && player.state !== PlayerState.SLIDE) {
        player.state = PlayerState.IDLE;
      }
    }
  }

  // Cooldowns
  if (player.attackCooldown > 0) {
    player.attackCooldown--;
    
    // Handle Jump Attack Duration
    if (player.state === PlayerState.JUMP_ATTACK && player.frameTimer > JUMP_ATTACK_DURATION) {
       player.hitbox = null;
       if (!player.isGrounded) player.state = PlayerState.JUMP; // Go back to jump state if still in air
    }

    // Handle Ground Attack Duration
    if (player.state === PlayerState.ATTACK && player.frameTimer > ATTACK_DURATION) {
      player.hitbox = null; 
      if (player.isGrounded) player.state = PlayerState.IDLE;
    }
  }

  // Hit Detection
  if (player.hitbox) {
    // Calculate Opponent Hurtbox - Reduce height if sliding
    const opIsSliding = opponent.state === PlayerState.SLIDE;
    
    const opponentBox: Box = {
      x: opponent.position.x,
      y: opIsSliding ? opponent.position.y + opponent.height / 2 : opponent.position.y,
      width: opponent.width,
      height: opIsSliding ? opponent.height / 2 : opponent.height
    };

    if (checkCollision(player.hitbox, opponentBox)) {
      // Hit confirmed
      const damage = player.state === PlayerState.JUMP_ATTACK ? JUMP_ATTACK_DAMAGE : ATTACK_DAMAGE;
      
      player.hitbox = null; // Consume hitbox so it hits only once per swing
      
      // Apply Damage
      opponent.health = Math.max(0, opponent.health - damage);
      opponent.state = PlayerState.HURT;
      opponent.frameTimer = 0; // Reset animation for hurt
      
      // Apply Knockback
      opponent.velocity.x = player.direction * KNOCKBACK_X * (player.state === PlayerState.JUMP_ATTACK ? 1.2 : 1);
      opponent.velocity.y = KNOCKBACK_Y;
      opponent.isGrounded = false;
      
      playSound('HIT');

      // Spawn blood/spark particles
      for(let i=0; i<12; i++) {
        const isSpark = Math.random() > 0.7;
        particles.push({
          x: opponent.position.x + opponent.width/2,
          y: opponent.position.y + opponent.height/3,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          life: 1.0,
          color: isSpark ? '#FFF' : '#b30000', // Blood red
          size: Math.random() * 6 + 2,
          type: isSpark ? ParticleType.SPARK : ParticleType.BLOOD
        });
      }
    }
  }

  // Check Death
  if (opponent.health <= 0 && opponent.state !== PlayerState.DEAD) {
    opponent.state = PlayerState.DEAD;
    player.state = PlayerState.WIN;
    playSound('WIN');
  }

  player.frameTimer++;
  return particles;
};