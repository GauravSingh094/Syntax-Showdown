"use client";
import { useEffect, useState, useRef } from "react";
import { Terminal, Shield, Swords, Scale } from "lucide-react";
import { motion } from "framer-motion";

const SCRIPTS = [
  { agent: "pro", name: "PRO AI · DEFENDER", text: "Target established. Core argument: Large multi-agent LLM systems exhibit emergent reasoning features that scale exponentially. The synergy of parallel cognitive paths guarantees AGI before 2030." },
  { agent: "opponent", name: "OPPONENT AI · CHALLENGER", text: "Uplink verified. Counterspecs: Parametric scaling is hitting a wall of diminishing returns. True cognitive mastery requires physical embodiment and active self-supervised error validation, not just raw token processing." },
  { agent: "judge", name: "JUDGE AI · ARBITER", text: "Systems stabilized. Adjudicating debate parameters... Pro scores high on empirical scaling vectors, Opponent leads on structural grounding. Final verdict imminent..." }
];

export default function DebatePreviewConsole() {
  const [lines, setLines] = useState<Array<{ agent: string; name: string; text: string }>>([]);
  const [activeText, setActiveText] = useState("");
  const [scriptIndex, setScriptIndex] = useState(0);
  const charIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const script = SCRIPTS[scriptIndex];
    charIndexRef.current = 0;
    setActiveText("");

    function typeChar() {
      if (charIndexRef.current < script.text.length) {
        charIndexRef.current += 2; // snap type 2 chars at once to keep it energetic
        setActiveText(script.text.slice(0, charIndexRef.current));
        timerRef.current = setTimeout(typeChar, 18);
      } else {
        // Complete current type, append to history, wait 3 seconds, then start next script
        timerRef.current = setTimeout(() => {
          setLines(prev => [...prev, script].slice(-2)); // Keep only latest 2 lines in terminal buffer
          setScriptIndex((prev) => (prev + 1) % SCRIPTS.length);
        }, 2500);
      }
    }

    timerRef.current = setTimeout(typeChar, 500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scriptIndex]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-black border-4 border-indigo-500/50 p-5 shadow-[0_0_25px_rgba(99,102,241,0.25)] relative overflow-hidden rounded-none text-left font-mono text-xs text-gray-300">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent bg-[length:100%_4px] animate-pulse" />
      
      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-4 text-indigo-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 animate-pulse" />
          <span className="font-silk text-[8px] uppercase tracking-widest">NEURAL ARENA MONITOR (MOCK FEED)</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-none animate-ping" />
          <span className="font-silk text-[6px] text-red-500 uppercase tracking-wider">LIVE FEED</span>
        </div>
      </div>

      {/* Console Content */}
      <div className="space-y-4 min-h-[140px] flex flex-col justify-end">
        {/* Render historic logs */}
        {lines.map((line, idx) => (
          <div key={idx} className="space-y-1 opacity-50 transition-opacity">
            <div className="flex items-center gap-2">
              {line.agent === "pro" ? (
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
              ) : line.agent === "opponent" ? (
                <Swords className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Scale className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className={`font-silk text-[8px] uppercase tracking-wider ${
                line.agent === "pro" ? "text-indigo-400" :
                line.agent === "opponent" ? "text-emerald-400" : "text-amber-400"
              }`}>
                {line.name}
              </span>
            </div>
            <p className="pl-5 leading-relaxed">{line.text}</p>
          </div>
        ))}

        {/* Render currently typing log */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {SCRIPTS[scriptIndex].agent === "pro" ? (
              <Shield className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            ) : SCRIPTS[scriptIndex].agent === "opponent" ? (
              <Swords className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <Scale className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
            <span className={`font-silk text-[8px] uppercase tracking-wider ${
              SCRIPTS[scriptIndex].agent === "pro" ? "text-indigo-400" :
              SCRIPTS[scriptIndex].agent === "opponent" ? "text-emerald-400" : "text-amber-400"
            }`}>
              {SCRIPTS[scriptIndex].name}
            </span>
          </div>
          <p className="pl-5 leading-relaxed text-white">
            {activeText}
            <span className="typing-cursor-solid ml-0.5 inline-block text-current font-bold" style={{ animation: "cyberBlink 0.5s steps(2, start) infinite" }}>█</span>
          </p>
        </div>
      </div>
    </div>
  );
}
