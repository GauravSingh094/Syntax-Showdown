import { create } from 'zustand';

interface SoundState {
  muted: boolean;
  setMuted: (muted: boolean) => void;
  playClick: () => void;
  playComplete: () => void;
  playJudge: () => void;
  playNotification: () => void;
}

export const useSoundStore = create<SoundState>((set, get) => {
  let audioCtx: AudioContext | null = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  return {
    muted: true, // MUST remain muted by default
    setMuted: (muted) => set({ muted }),

    playClick: () => {
      if (get().muted) return;
      try {
        const ctx = initAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {
        console.warn("Sound play failed", e);
      }
    },

    playComplete: () => {
      if (get().muted) return;
      try {
        const ctx = initAudio();
        const now = ctx.currentTime;
        
        // Triumphant 8-bit fanfare (3 rapid rising notes)
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          
          gain.gain.setValueAtTime(0.12, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.25);
        });
      } catch (e) {
        console.warn("Sound play failed", e);
      }
    },

    playJudge: () => {
      if (get().muted) return;
      try {
        const ctx = initAudio();
        const now = ctx.currentTime;

        // Dramatic sci-fi sweeping chord
        const frequencies = [130.81, 164.81, 196.00]; // C3, E3, G3
        frequencies.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.linearRampToValueAtTime(freq * 2, now + 1.2);
          
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 1.2);
        });
      } catch (e) {
        console.warn("Sound play failed", e);
      }
    },

    playNotification: () => {
      if (get().muted) return;
      try {
        const ctx = initAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) {
        console.warn("Sound play failed", e);
      }
    }
  };
});
