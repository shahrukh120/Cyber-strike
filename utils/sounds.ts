

// Simple audio synthesizer using Web Audio API

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playSound = (type: 'JUMP' | 'ATTACK' | 'HIT' | 'WIN' | 'START' | 'SLIDE' | 'JUMP_ATTACK') => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Resume context if suspended (browser policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case 'JUMP':
      // Whoosh
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'ATTACK':
      // Sword Swing (High pitch noise/swoosh)
      osc.type = 'sawtooth'; 
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'JUMP_ATTACK':
      // Heavy overhead swing
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'HIT':
      // Cut sound
      osc.type = 'sawtooth'; 
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'WIN':
      // Oriental riff approximation
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(523.25, now + 0.2); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.4); // E5
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
      break;
      
    case 'START':
      // Gong-like sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 1.5);
      
      // Add some metallic dissonance
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(155, now);
      osc2.frequency.exponentialRampToValueAtTime(42, now + 1.5);
      osc2.connect(gainNode);
      osc2.start(now);
      osc2.stop(now + 1.5);

      gainNode.gain.setValueAtTime(0.5, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
      break;

    case 'SLIDE':
      // Dirt slide
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
  }
};

// --- Music Generator ---

let musicRunning = false;
let nextNoteTime = 0;
let schedulerTimer: number | null = null;
let currentBeat = 0;

// Hirajoshi Scale: A, B, C, E, F (approx freq)
const SCALE = [
  220.00, // A3
  246.94, // B3
  261.63, // C4
  329.63, // E4
  349.23, // F4
  440.00, // A4
  493.88, // B4
  523.25, // C5
  659.25, // E5
  698.46  // F5
];

const scheduleNote = (beat: number, time: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Percussion (Taiko-ish) - Irregular rhythm
  if (beat % 8 === 0 || (beat % 8 === 5 && Math.random() > 0.6)) {
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     osc.connect(gain);
     gain.connect(ctx.destination);
     
     // Deep thud
     osc.frequency.setValueAtTime(100, time);
     osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.4);
     
     gain.gain.setValueAtTime(0.4, time);
     gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
     
     osc.start(time);
     osc.stop(time + 0.4);
  }

  // Wood block click
  if (beat % 4 === 2 && Math.random() > 0.5) {
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     osc.connect(gain);
     gain.connect(ctx.destination);
     
     osc.type = 'square';
     osc.frequency.setValueAtTime(800, time);
     osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
     
     gain.gain.setValueAtTime(0.05, time);
     gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
     
     osc.start(time);
     osc.stop(time + 0.05);
  }

  // Koto Melody (Procedural) - Sparse
  if (Math.random() < 0.25) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const note = SCALE[Math.floor(Math.random() * SCALE.length)];
      
      osc.type = 'triangle'; // Sharp string
      osc.frequency.setValueAtTime(note, time);
      
      // Pluck envelope
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
      
      // Slight detune for that traditional vibe
      osc.detune.setValueAtTime(Math.random() * 10 - 5, time);

      osc.start(time);
      osc.stop(time + 0.8);
  }
  
  // Shakuhachi (Flute) Drone - Occasional
  if (beat % 32 === 0 && Math.random() > 0.3) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(SCALE[0], time); // A3
      
      // Breath-like envelope
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.05, time + 1);
      gain.gain.linearRampToValueAtTime(0.03, time + 2);
      gain.gain.linearRampToValueAtTime(0, time + 5);
      
      // Vibrato
      const vib = ctx.createOscillator();
      vib.frequency.value = 4; // 4Hz
      const vibGain = ctx.createGain();
      vibGain.gain.value = 4; 
      vib.connect(vibGain);
      vibGain.connect(osc.frequency);
      vib.start(time);
      vib.stop(time + 5);

      osc.start(time);
      osc.stop(time + 5);
  }
}

const scheduler = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Schedule ahead
    while (nextNoteTime < ctx.currentTime + 0.1) {
        scheduleNote(currentBeat, nextNoteTime);
        nextNoteTime += 0.25; // 8th note speed approx
        currentBeat++;
    }
    
    if (musicRunning) {
        schedulerTimer = window.setTimeout(scheduler, 25);
    }
}

export const startMusic = () => {
    if (musicRunning) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    musicRunning = true;
    currentBeat = 0;
    nextNoteTime = ctx.currentTime + 0.1;
    scheduler();
}

export const stopMusic = () => {
    musicRunning = false;
    if (schedulerTimer) clearTimeout(schedulerTimer);
}
