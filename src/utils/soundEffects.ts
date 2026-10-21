let ctx: AudioContext | null = null;

const getContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!ctx) ctx = new AudioContextClass();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number) => {
  const audioContext = getContext();
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + duration);
};

export const playCorrectSound = (enabled = true) => {
  if (!enabled) return;
  playTone(523.25, 'sine', 0.2, 0.1);
  setTimeout(() => { if (enabled) playTone(659.25, 'sine', 0.3, 0.1); }, 100);
};

export const playIncorrectSound = (enabled = true) => {
  if (!enabled) return;
  playTone(220, 'triangle', 0.3, 0.1);
};

export const playFinishSound = (enabled = true) => {
  if (!enabled) return;
  playTone(523.25, 'sine', 0.1, 0.1);
  setTimeout(() => { if (enabled) playTone(659.25, 'sine', 0.1, 0.1); }, 100);
  setTimeout(() => { if (enabled) playTone(783.99, 'sine', 0.4, 0.1); }, 200);
};

export const playTickSound = (enabled = true) => {
  if (!enabled) return;
  playTone(880, 'sine', 0.05, 0.05);
};

export const playCelebrationSound = (enabled = true) => {
  if (!enabled) return;
  const audioContext = getContext();
  if (!audioContext) return;
  const now = audioContext.currentTime;
  [440, 554.37, 659.25, 880].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.1);
    gain.gain.setValueAtTime(0.1, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.3);
  });
};
