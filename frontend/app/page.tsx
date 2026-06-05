"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { Zap, Brain, Terminal, Cpu, Sparkles, Shield, Scale, ChevronRight, Play, BarChart3, GitBranch, ChevronDown, HelpCircle, Activity, Database, Server } from "lucide-react";
import Lenis from "lenis";
import PixelArena from "@/components/PixelArena";
import AnimatedButton from "@/components/AnimatedButton";
import PixelParticlesBg from "@/components/PixelParticlesBg";
import DebatePreviewConsole from "@/components/DebatePreviewConsole";
import { useSoundStore } from "@/store/soundStore";

/* ─── Animated Counter ──────────────────────────────────────────────────── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── Features Configuration ────────────────────────────────────────────── */
const FEATURES = [
  {
    num: "01",
    icon: <Brain className="w-10 h-10 text-indigo-400" />,
    title: "Voxel Reasoning Engine",
    desc: "Two specialized AI agents independently build and defend arguments using deep semantic reasoning.",
    bullets: ["Multi-model provider failover", "LangGraph orchestrator node", "Independent reasoning chains"],
    color: "indigo",
    border: "border-t-indigo-500",
    glow: "hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:border-indigo-400/50",
  },
  {
    num: "02",
    icon: <Sparkles className="w-10 h-10 text-emerald-400" />,
    title: "Hyper-SSE Streamer",
    desc: "Watch arguments materialize in real time via Server-Sent Events — zero page reloads.",
    bullets: ["Live SSE token streaming", "Round progress tracking", "Animated message reveal"],
    color: "emerald",
    border: "border-t-emerald-500",
    glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:border-emerald-400/50",
  },
  {
    num: "03",
    icon: <Scale className="w-10 h-10 text-amber-400" />,
    title: "Logic Adjudicator",
    desc: "An impartial AI judge evaluates logic, evidence, and rebuttal quality — and always delivers a verdict.",
    bullets: ["4-provider failover chain", "Structured score breakdown", "Heuristic safety net"],
    color: "amber",
    border: "border-t-amber-500",
    glow: "hover:shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:border-amber-400/50",
  },
];

const TECH = [
  { label: "LangGraph",  color: "bg-indigo-600/20 border-indigo-500/40 text-indigo-400" },
  { label: "Groq",       color: "bg-cyan-600/20   border-cyan-500/40   text-cyan-400"   },
  { label: "Gemini",     color: "bg-purple-600/20 border-purple-500/40 text-purple-400" },
  { label: "OpenRouter", color: "bg-amber-600/20  border-amber-500/40  text-amber-400"  },
  { label: "Next.js",    color: "bg-gray-600/20   border-gray-500/40   text-gray-300"   },
];

const GLADIATORS = [
  {
    name: "Llama 3.3",
    role: "The Logic Enforcer",
    desc: "A powerhouse of strict logical flow and structural rigor. Excellent at unpacking complex arguments and highlighting technical fallacies.",
    avatar: "🦙",
    stats: [
      { label: "Coherence", val: 95 },
      { label: "Evidence Citation", val: 88 },
      { label: "Rebuttal Speed", val: 82 },
      { label: "Heuristics", val: 78 }
    ],
    color: "indigo",
    glow: "hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:border-indigo-400/50"
  },
  {
    name: "DeepSeek R1",
    role: "The Deep Thinker",
    desc: "Orchestrates long reasoning paths before outputting tokens. DeepSeek R1 handles complex conceptual rebuttals and outmaneuvers opponents structurally.",
    avatar: "🐋",
    stats: [
      { label: "Coherence", val: 88 },
      { label: "Evidence Citation", val: 92 },
      { label: "Rebuttal Speed", val: 75 },
      { label: "Heuristics", val: 95 }
    ],
    color: "emerald",
    glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:border-emerald-400/50"
  },
  {
    name: "Gemini 2.5",
    role: "The Rhetoric Sage",
    desc: "Maintains a balanced tone, presenting fluid arguments and clear summaries. Great at synthesis, logic adjudication, and human-like eloquence.",
    avatar: "♊",
    stats: [
      { label: "Coherence", val: 90 },
      { label: "Evidence Citation", val: 85 },
      { label: "Rebuttal Speed", val: 94 },
      { label: "Heuristics", val: 87 }
    ],
    color: "amber",
    glow: "hover:shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:border-amber-400/50"
  }
];

const FAQS = [
  {
    q: "How is a winner decided in a debate?",
    a: "Our Logic Adjudicator uses a multi-tier assessment criteria, scoring each agent out of 10 points across logic coherence, evidence citations, and rebuttal density. If the primary LLM provider fails, a dynamic local text heuristic takes over to count word count, citation density, and response volumes to guarantee a fair result."
  },
  {
    q: "What role does LangGraph play in the orchestrator?",
    a: "LangGraph manages the multi-agent cognitive loop. It compiles the debate state, routes execution from the user initialization node to the Pro and Opponent argument generator nodes, checks round limits, and pipes the final transcript to the Adjudicator node for live scoring."
  },
  {
    q: "Why use Server-Sent Events (SSE) instead of standard REST?",
    a: "Debate generation requires multiple LLM calls which can take up to 30 seconds. SSE allows the backend to stream tokens live as they are generated, giving you a real-time terminal feed of the arguments, round by round, with zero lag or page refreshes."
  },
  {
    q: "Are the debates saved in a persistent database?",
    a: "Yes! Every debate, round argument, and judge score sheet is saved in our backend vector database cluster (ChromaDB). This allows global keyword searches, scoring analytics, and direct rewatch telemetry on the Leaderboard and History panels."
  }
];

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="mb-3">
      <div className="flex justify-between font-silk text-[7px] uppercase tracking-wider mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={
          color === "indigo" ? "text-indigo-400" :
          color === "emerald" ? "text-emerald-400" : "text-amber-400"
        }>{value}%</span>
      </div>
      <div className="h-2 bg-black border border-gray-800 relative overflow-hidden">
        <motion.div
          className={
            color === "indigo" ? "bg-indigo-500 h-full" :
            color === "emerald" ? "bg-emerald-500 h-full" : "bg-amber-500 h-full"
          }
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : {}}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        />
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { playClick } = useSoundStore();
  return (
    <div className="border-4 border-black bg-gray-900 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:border-indigo-500/40 transition-colors">
      <button
        onClick={() => { playClick(); setIsOpen(!isOpen); }}
        className="w-full text-left p-5 flex items-center justify-between font-pixel text-xs text-white uppercase tracking-wider cursor-pointer select-none"
      >
        <span>{q}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-indigo-400 shrink-0 ml-4"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t-2 border-black bg-black/20"
          >
            <p className="p-5 font-body text-sm text-gray-400 leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArchitectureMap() {
  return (
    <div className="w-full bg-gray-900 border-4 border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative overflow-hidden">
      <div className="scan-sweep opacity-10" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 font-silk text-[8px] uppercase tracking-widest text-center select-none font-bold">
        
        {/* Node 1 */}
        <div className="flex flex-col items-center justify-center p-5 bg-indigo-950/20 border-2 border-indigo-500/30 relative shadow-[0_0_12px_rgba(99,102,241,0.1)] group hover:border-indigo-500 transition-colors">
          <div className="w-10 h-10 border-2 border-black bg-indigo-600 flex items-center justify-center text-[16px] mb-3 group-hover:scale-105 transition-transform shadow-[2px_2px_0_#000]">💻</div>
          <span className="text-white font-bold mb-1">Next.js Client</span>
          <span className="text-gray-505 text-[6px] normal-case font-mono">React · Framer · Zustand</span>
        </div>

        {/* Node 2 */}
        <div className="flex flex-col items-center justify-center p-5 bg-emerald-950/20 border-2 border-emerald-500/30 relative shadow-[0_0_12px_rgba(16,185,129,0.1)] group hover:border-emerald-500 transition-colors">
          <div className="w-10 h-10 border-2 border-black bg-emerald-600 flex items-center justify-center text-[16px] mb-3 group-hover:scale-105 transition-transform shadow-[2px_2px_0_#000]">⚡</div>
          <span className="text-white font-bold mb-1">FastAPI Backend</span>
          <span className="text-gray-505 text-[6px] normal-case font-mono">Uvicorn · SSE Stream · CORS</span>
        </div>

        {/* Node 3 */}
        <div className="flex flex-col items-center justify-center p-5 bg-purple-950/20 border-2 border-purple-500/30 relative shadow-[0_0_12px_rgba(168,85,247,0.1)] group hover:border-purple-500 transition-colors">
          <div className="w-10 h-10 border-2 border-black bg-purple-650 flex items-center justify-center text-[16px] mb-3 group-hover:scale-105 transition-transform shadow-[2px_2px_0_#000]">🧠</div>
          <span className="text-white font-bold mb-1">LangGraph Router</span>
          <span className="text-gray-505 text-[6px] normal-case font-mono">Multi-Agent Loops · State Graph</span>
        </div>

        {/* Node 4 */}
        <div className="flex flex-col items-center justify-center p-5 bg-amber-950/20 border-2 border-amber-500/30 relative shadow-[0_0_12px_rgba(234,179,8,0.1)] group hover:border-amber-500 transition-colors">
          <div className="w-10 h-10 border-2 border-black bg-amber-600 flex items-center justify-center text-[16px] mb-3 group-hover:scale-105 transition-transform shadow-[2px_2px_0_#000]">🗄️</div>
          <span className="text-white font-bold mb-1">ChromaDB DB</span>
          <span className="text-gray-505 text-[6px] normal-case font-mono">Vector Embeddings · History logs</span>
        </div>

      </div>
      
      {/* SVG Connecting lines in background */}
      <div className="absolute inset-0 pointer-events-none hidden md:block opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 180 82 L 280 82" stroke="#6366f1" strokeWidth="2" strokeDasharray="6 6" fill="none" />
          <path d="M 460 82 L 560 82" stroke="#10b981" strokeWidth="2" strokeDasharray="6 6" fill="none" />
          <path d="M 740 82 L 840 82" stroke="#a855f7" strokeWidth="2" strokeDasharray="6 6" fill="none" />
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { playClick } = useSoundStore();

  useEffect(() => {
    // Lenis smooth scroll initialization (Task 2)
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });
    
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    setTimeout(() => setIsLoading(false), 1000);
    
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative">
      {/* Sound stylesheet injection */}
      <style>{`
        @keyframes cyberBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .typing-cursor-solid {
          animation: cyberBlink 0.6s steps(2, start) infinite;
        }
        @keyframes scanSweep {
          0% { transform: translateY(-20vh); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan-sweep {
          animation: scanSweep 12s linear infinite;
        }
      `}</style>

      {/* ── Boot Screen ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center flex-col gap-6"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-indigo-600/30 animate-ping" />
              <div className="w-16 h-16 border-4 border-white border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-indigo-500 animate-pulse" />
              </div>
            </div>
            <p className="font-pixel text-[9px] text-white animate-pulse uppercase tracking-[0.5em]">
              Stabilizing Sound & Uplink...
            </p>
            <div className="flex gap-1 mt-2">
              {[0,1,2,3,4].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-indigo-500"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero & Live Debate Monitor (Task 1 & 7) ─────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden bg-black/10">
        <PixelArena />
        <PixelParticlesBg />

        {/* Floating background retro decoration */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-10 text-gray-700/20 text-4xl hidden md:block"
          >
            🎮
          </motion.div>
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-12 text-gray-700/20 text-4xl hidden md:block"
          >
            ⚡
          </motion.div>
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-12 right-1/4 text-gray-700/10 text-6xl hidden lg:block"
          >
            👾
          </motion.div>
          {/* Vertical Scanner Line sweep */}
          <div className="absolute left-0 w-full h-[3px] bg-indigo-500/10 shadow-[0_0_8px_rgba(99,102,241,0.3)] animate-scan-sweep pointer-events-none" />
        </div>

        <div className="max-w-5xl text-center z-10 relative mt-6">
          {/* Badge strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-8 px-4"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 bg-black/60 border border-indigo-500/40 px-3 py-1.5 backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.15)] text-[7px] xs:text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                <span className="font-silk text-[8px] text-emerald-400 uppercase tracking-widest font-bold">Online</span>
              </div>
              <div className="w-px h-3 bg-white/20" />
              <span className="font-silk text-[8px] text-gray-400 uppercase tracking-widest">Multi-Agent V2</span>
              <div className="w-px h-3 bg-white/20 hidden xs:inline" />
              <span className="font-silk text-[8px] text-gray-400 uppercase tracking-widest font-bold text-indigo-400">Recruiter Showcase</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-pixel text-2xl xs:text-3xl sm:text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight text-white uppercase tracking-tighter"
          >
            Witness the<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-500 bg-[length:200%_auto] animate-shimmer drop-shadow-[4px_4px_0_rgba(0,0,0,1)] font-bold">
              Ultimate
            </span><br />
            <span className="text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)] font-bold">AI Showdown</span>
          </motion.h1>

          {/* Subheadline with animated supporting text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto space-y-3 mb-8"
          >
            <p className="font-body text-gray-300 text-lg md:text-xl leading-relaxed">
              Watch intelligent agents battle in real time.
            </p>
            <p className="font-silk text-[10px] text-indigo-400 uppercase tracking-[0.25em] font-bold">
              Reason · Argue · Judge · Conclude
            </p>
          </motion.div>

          {/* Dual CTA Magnetic Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12"
          >
            <Link href="/arena" onClick={playClick}>
              <AnimatedButton size="lg" className="text-sm">
                <Play className="w-4 h-4" /> Start Battle
              </AnimatedButton>
            </Link>
            <Link href="/history" onClick={playClick}>
              <AnimatedButton variant="secondary" size="lg" className="text-sm">
                <BarChart3 className="w-4 h-4" /> View History
              </AnimatedButton>
            </Link>
          </motion.div>

          {/* Live AI vs AI Debate Preview Box (Task 1) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 100, damping: 15 }}
            className="w-full px-4"
          >
            <DebatePreviewConsole />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        >
          <div className="w-5 h-8 border-2 border-white/20 flex items-start p-1 bg-black/40">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="w-full h-2 bg-indigo-500"
            />
          </div>
          <span className="font-silk text-[6px] text-gray-500 uppercase tracking-widest">SCROLL LOBBY</span>
        </motion.div>
      </section>

      {/* ── Feature Cards (Task 3 & 4) ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-silk text-[9px] text-indigo-400 uppercase tracking-[0.4em] mb-4">SYSTEM PIPELINES</p>
          <h2 className="font-pixel text-2xl md:text-4xl text-white uppercase tracking-tighter font-bold">
            Three Pillars of Combat
          </h2>
        </motion.div>

        {/* Staggered Element Reveals (Task 3 & 4) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 45 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, ease: [0.22, 1, 0.36, 1], duration: 0.8 }}
              whileHover={{ y: -10 }}
              className={`p-8 bg-gray-900 border-4 border-black border-t-4 ${feat.border} shadow-[8px_8px_0_0_rgba(0,0,0,1)] group cursor-crosshair transform-gpu transition-all duration-300 ${feat.glow} relative overflow-hidden`}
            >
              {/* Step number */}
              <div className="absolute top-4 right-5 font-pixel text-[24px] text-white/5 select-none font-bold">
                {feat.num}
              </div>

              {/* Icon */}
              <div className="mb-6 w-16 h-16 bg-gray-800 border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all duration-300">
                {feat.icon}
              </div>

              {/* Step badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`font-silk text-[7px] uppercase tracking-[0.35em] ${
                  feat.color === "indigo" ? "text-indigo-400" :
                  feat.color === "emerald" ? "text-emerald-400" : "text-amber-400"
                } font-bold`}>Step {feat.num}</span>
              </div>

              <h3 className="font-pixel text-sm font-bold mb-4 uppercase tracking-wider text-white leading-snug">
                {feat.title}
              </h3>
              <p className="text-gray-500 font-body text-sm leading-relaxed mb-5">{feat.desc}</p>

              {/* Bullet list */}
              <ul className="space-y-2">
                {feat.bullets.map((b, bi) => (
                  <li key={bi} className="flex items-center gap-2 font-silk text-[8px] text-gray-600 uppercase tracking-wider">
                    <div className={`w-1 h-1 shrink-0 ${
                      feat.color === "indigo" ? "bg-indigo-500" :
                      feat.color === "emerald" ? "bg-emerald-500" : "bg-amber-500"
                    }`} />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Neural Gladiators Showcase (New Section) ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-24 relative z-10 border-t-4 border-black/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-silk text-[9px] text-emerald-400 uppercase tracking-[0.4em] mb-4">NEURAL MATRIX ENGINE</p>
          <h2 className="font-pixel text-2xl md:text-4xl text-white uppercase tracking-tighter font-bold">
            Active Combat Nodes
          </h2>
          <p className="font-body text-gray-500 text-sm max-w-lg mx-auto mt-4 leading-relaxed">
            Audit the specifications and cognitive ratings of our primary LLM orchestrator agents.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {GLADIATORS.map((glad, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.7 }}
              whileHover={{ y: -8 }}
              className={`bg-gray-900 border-4 border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all duration-300 ${glad.glow} flex flex-col justify-between relative`}
            >
              <div>
                {/* Gladiator Header */}
                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-800 border-2 border-black flex items-center justify-center text-3xl shadow-[2px_2px_0_#000]">
                      {glad.avatar}
                    </div>
                    <div>
                      <h3 className="font-pixel text-sm text-white font-bold leading-none mb-1.5">{glad.name}</h3>
                      <span className="font-silk text-[7px] text-gray-500 uppercase tracking-wider">{glad.role}</span>
                    </div>
                  </div>
                </div>

                <p className="font-body text-xs text-gray-400 leading-relaxed mb-6">
                  {glad.desc}
                </p>
              </div>

              {/* Stats Block */}
              <div className="border-t-2 border-black/30 pt-4 mt-auto">
                <span className="font-silk text-[7px] text-gray-500 uppercase tracking-widest block mb-3 font-bold">Cognitive Weights</span>
                {glad.stats.map((st, idx) => (
                  <StatBar key={idx} label={st.label} value={st.val} color={glad.color} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── System Architecture Visual Grid (New Section) ───────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 relative z-10 border-t-4 border-black/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="font-silk text-[9px] text-indigo-400 uppercase tracking-[0.4em] mb-4">TOPOLOGY DIAGRAM</p>
          <h2 className="font-pixel text-2xl md:text-3xl text-white uppercase tracking-tighter font-bold">
            Cognitive Pipeline Stack
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ArchitectureMap />
        </motion.div>
      </section>

      {/* ── Social Proof / Tech Strip ────────────────────────────────────── */}
      <section className="border-y-4 border-black bg-gray-900 py-16 relative overflow-hidden">
        <div className="scan-sweep opacity-20" />
        <div className="max-w-5xl mx-auto px-8">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { val: 4,    suffix: "×",  label: "AI Providers"    },
              { val: 100,  suffix: "%",  label: "Verdict Rate"    },
              { val: 3,    suffix: "",   label: "Rounds Options"  },
              { val: 12,   suffix: "",   label: "Retry Attempts"  },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <div className="font-pixel text-3xl md:text-4xl text-white mb-1 font-bold">
                  <AnimatedNumber value={s.val} suffix={s.suffix} />
                </div>
                <div className="font-silk text-[8px] text-gray-600 uppercase tracking-widest">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tech badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="font-silk text-[8px] text-gray-700 uppercase tracking-widest mr-2">Powered by</span>
            {TECH.map((t) => (
              <div key={t.label} className={`px-3 py-1.5 border font-silk text-[8px] uppercase tracking-widest ${t.color}`}>
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to Use / Steps ───────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-silk text-[9px] text-cyan-400 uppercase tracking-[0.4em] mb-4">QUICK START</p>
          <h2 className="font-pixel text-2xl md:text-3xl text-white uppercase tracking-tighter font-bold">
            Battle in 3 Steps
          </h2>
        </motion.div>

        <div className="space-y-6">
          {[
            { step: "01", title: "Choose a Topic", desc: "Type any debatable topic — or pick from our curated templates on the dashboard.", icon: <Terminal className="w-5 h-5" /> },
            { step: "02", title: "Watch the Battle", desc: "Two AI agents stream their arguments live, round by round. Watch logic clash in real time.", icon: <Zap className="w-5 h-5" /> },
            { step: "03", title: "Judge Decides", desc: "An impartial AI judge scores logic, evidence, and rebuttal. The verdict is always delivered.", icon: <Scale className="w-5 h-5" /> },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-6 p-6 bg-gray-900 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-600 border-2 border-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-pixel text-[9px] text-indigo-500 font-bold">{s.step}</span>
                  <h3 className="font-pixel text-xs text-white uppercase tracking-wider font-bold">{s.title}</h3>
                </div>
                <p className="font-body text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Interactive Intel Core FAQ (New Section) ────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 md:px-8 py-24 relative z-10 border-t-4 border-black/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-silk text-[9px] text-amber-400 uppercase tracking-[0.4em] mb-4">INTEL DATABASE</p>
          <h2 className="font-pixel text-2xl md:text-3xl text-white uppercase tracking-tighter font-bold">
            System Specifications FAQ
          </h2>
          <p className="font-body text-gray-505 text-sm max-w-md mx-auto mt-4 leading-relaxed">
            Expand nodes to audit operational logic, state machines, and API connections.
          </p>
        </motion.div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
            >
              <FAQItem q={faq.q} a={faq.a} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="bg-indigo-600 border-y-8 border-black py-28 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 pixel-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-600/20" />
        <PixelParticlesBg />

        <div className="relative z-10">
          <p className="font-silk text-[9px] text-indigo-200 uppercase tracking-[0.4em] mb-6">READY TO WITNESS?</p>
          <h2 className="font-pixel text-3xl md:text-5xl text-white mb-6 uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.4)] leading-tight font-bold">
            Command Your<br />Intelligence
          </h2>
          <p className="font-body text-indigo-100 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Start a debate on any topic and watch AI agents battle it out in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
            <Link href="/arena" onClick={playClick}>
              <AnimatedButton variant="secondary" size="lg">
                <Play className="w-4 h-4" /> Enter the Arena
              </AnimatedButton>
            </Link>
            <Link href="/dashboard" onClick={playClick}>
              <AnimatedButton variant="secondary" size="lg">
                <GitBranch className="w-4 h-4" /> Open Dashboard
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
