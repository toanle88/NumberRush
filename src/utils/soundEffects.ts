const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const ctx = new AudioContext();

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playCorrectSound = () => {
  playTone(523.25, 'sine', 0.2, 0.1); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.3, 0.1), 100); // E5
};

export const playIncorrectSound = () => {
  playTone(220, 'triangle', 0.3, 0.1); // A3
};

export const playFinishSound = () => {
  playTone(523.25, 'sine', 0.1, 0.1);
  setTimeout(() => playTone(659.25, 'sine', 0.1, 0.1), 100);
  setTimeout(() => playTone(783.99, 'sine', 0.4, 0.1), 200); // C5 E5 G5
};

export const playTickSound = () => {
  playTone(880, 'sine', 0.05, 0.05); // A5 tick
};
