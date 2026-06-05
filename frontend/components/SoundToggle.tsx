"use client";
import { useSoundStore } from "@/store/soundStore";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

export default function SoundToggle() {
  const { muted, setMuted, playClick } = useSoundStore();

  const handleToggle = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (!nextMuted) {
      // Play a quick notification note to confirm sound is active
      setTimeout(() => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(660, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
          console.warn(e);
        }
      }, 50);
    } else {
      playClick();
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleToggle}
      title={muted ? "Sound Off (Click to unmute)" : "Sound On (Click to mute)"}
      className={`p-2 border-2 border-black bg-white dark:bg-gray-900 shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] transition-all flex items-center justify-center group cursor-pointer ${
        !muted ? "text-indigo-400 border-indigo-500/50 shadow-[2px_2px_0_rgba(99,102,241,0.3)]" : "text-gray-500"
      }`}
    >
      {muted ? (
        <VolumeX className="w-4 h-4 group-hover:scale-105 transition-transform" />
      ) : (
        <Volume2 className="w-4 h-4 group-hover:animate-bounce transition-transform" />
      )}
    </motion.button>
  );
}
