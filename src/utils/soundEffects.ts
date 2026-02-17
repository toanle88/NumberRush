const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
const ctx = new AudioContextClass();

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
  playTone(523.25, 'sine', 0.2, 0.1);
  setTimeout(() => playTone(659.25, 'sine', 0.3, 0.1), 100);
};

export const playIncorrectSound = () => {
  playTone(220, 'triangle', 0.3, 0.1);
};

export const playFinishSound = () => {
  playTone(523.25, 'sine', 0.1, 0.1);
  setTimeout(() => playTone(659.25, 'sine', 0.1, 0.1), 100);
  setTimeout(() => playTone(783.99, 'sine', 0.4, 0.1), 200);
};

export const playTickSound = () => {
  playTone(880, 'sine', 0.05, 0.05);
};

export const playCelebrationSound = () => {
  const now = ctx.currentTime;
  [440, 554.37, 659.25, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.1);
    gain.gain.setValueAtTime(0.1, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.3);
  });
};
