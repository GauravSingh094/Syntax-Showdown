"use client";
import { useEffect, useState } from "react";
import { Gamepad2, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BootLoader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");
  const [step, setStep] = useState(0);

  const steps = [
    "INITIALIZING CORE SYSTEM DECK...",
    "ESTABLISHING SECURE LOBBY UPLINK...",
    "MOUNTING CHROMADB VECTOR INDEX...",
    "LOADING LANGGRAPH REASONING ROUTER...",
    "SYNCING GLADIATOR TRANSCRIPTS...",
    "SYSTEM READY. DECRUNCHING SCREEN...",
  ];

  useEffect(() => {
    // Lock body scrolling during load
    document.body.style.overflow = "hidden";

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setLoading(false);
            document.body.style.overflow = "";
          }, 300); // Small pause at 100%
          return 100;
        }
        const increment = Math.floor(Math.random() * 12) + 6;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 300);

    return () => {
      clearInterval(progressInterval);
      clearInterval(dotsInterval);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const currentStep = Math.floor((progress / 100) * (steps.length - 1));
    setStep(currentStep);
  }, [progress]);

  const blocksCount = Math.floor(progress / 10);
  const progressBar = "█".repeat(blocksCount) + "░".repeat(10 - blocksCount);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col items-center justify-center p-6 select-none pixel-grid"
        >
          {/* Scanline sweep and phosphor glow overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30" />
          <div className="scan-sweep opacity-20" />

          {/* Cyber deck screen box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 12 }}
            className="w-full max-w-md border-4 border-black bg-black p-6 relative shadow-[8px_8px_0_0_#000] glow-indigo flex flex-col gap-6"
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b-2 border-indigo-950 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-indigo-600 border border-black shadow-[1px_1px_0_0_#000]">
                  <Gamepad2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-silk text-xs tracking-wider text-indigo-400">
                  SYS_BOOT // MAIN_DECK
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="font-mono text-[8px] text-indigo-600 uppercase">LOAD_MODE</span>
              </div>
            </div>

            {/* Console Log Screen */}
            <div className="font-mono text-[9px] text-emerald-400 space-y-2 leading-relaxed min-h-[90px]">
              <div className="flex items-center gap-1.5 text-gray-500">
                <span>[SYS STATUS]</span>
                <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span>ONLINE</span>
              </div>
              
              <div className="space-y-1">
                {steps.slice(0, step).map((txt, idx) => (
                  <div key={idx} className="flex gap-1.5 items-start text-emerald-600">
                    <span>✓</span>
                    <span>{txt}</span>
                  </div>
                ))}
                
                <div className="flex gap-1.5 items-start text-emerald-400">
                  <span className="animate-pulse">&gt;</span>
                  <span>
                    {steps[step]}
                    {step < steps.length - 1 && dots}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar container */}
            <div className="border-2 border-indigo-950/50 bg-gray-950 p-2.5">
              <div className="flex justify-between items-center text-[8px] font-silk text-indigo-400 mb-1.5 uppercase tracking-wider">
                <span>LOADING_TRANSLATOR</span>
                <span>{progress}%</span>
              </div>
              <div className="font-mono text-xs text-indigo-500 tracking-tighter select-none">
                [{progressBar}]
              </div>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between text-[7px] font-pixel text-gray-600 uppercase tracking-widest pt-2 border-t border-indigo-950/35">
              <span>PORT: 8000</span>
              <span>NODE: ALPHA_DECK</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
