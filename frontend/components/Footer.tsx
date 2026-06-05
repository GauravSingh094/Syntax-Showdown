"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Globe, Cpu, MessageSquare, Terminal, Server, Shield, Activity } from "lucide-react";
import { useSoundStore } from "@/store/soundStore";

const SYSTEM_LOGS = [
  "SYS_INIT: COGNITIVE STACK LOADED",
  "UPLINK_ESTABLISHED: SECURE PROTOCOL",
  "ROUTER_NODE: DETECTING LLM FAILOVERS",
  "MEMORY_CORE: CHROMADB SHARDS STABLE",
  "LANGGRAPH: ORCHESTRATOR COMPILATION OK",
  "FASTAPI_BACKEND: CONNECTION ACTIVE (8000)",
  "SECURITY_SHIELD: FIREWALL STATE SECURE",
  "NODE_METRICS: CPU 12% | MEM 184MB",
];

export default function Footer() {
  const { playClick, playNotification } = useSoundStore();
  const [logs, setLogs] = useState<string[]>([SYSTEM_LOGS[0], SYSTEM_LOGS[1], SYSTEM_LOGS[2]]);
  const [logIndex, setLogIndex] = useState(3);
  const [isPinging, setIsPinging] = useState(false);
  const [pingProgress, setPingProgress] = useState(0);
  const [latency, setLatency] = useState(8);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Keep auto-typing logs
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPinging) return;
      setLogs((prev) => {
        const nextLogs = [...prev, SYSTEM_LOGS[logIndex]];
        if (nextLogs.length > 8) {
          nextLogs.shift();
        }
        return nextLogs;
      });
      setLogIndex((prev) => (prev + 1) % SYSTEM_LOGS.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [logIndex, isPinging]);

  // Scroll terminal logs to bottom inside the log container to avoid main viewport shifts
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, pingProgress]);

  const handlePing = () => {
    if (isPinging) return;
    playClick();
    setIsPinging(true);
    setPingProgress(0);
    setLogs((prev) => {
      const next = [...prev, "❯ PINGING SYSTEM NODES..."];
      return next.slice(-8);
    });

    const duration = 1500;
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const progressTimer = setInterval(() => {
      currentStep++;
      const progress = Math.min((currentStep / steps) * 100, 100);
      setPingProgress(Math.round(progress));

      if (progress >= 100) {
        clearInterval(progressTimer);
        const newLatency = Math.floor(Math.random() * 6) + 4; // 4ms to 9ms
        setLatency(newLatency);
        setLogs((prev) => {
          const next = [
            ...prev,
            `❯ PING COMPLETE. ALL CHANNELS SECURE.`,
            `❯ LOCAL_LATENCY: ${newLatency}ms. UPLINK STABLE.`
          ];
          return next.slice(-8);
        });
        playNotification();
        setTimeout(() => {
          setIsPinging(false);
        }, 1000);
      }
    }, intervalTime);
  };

  return (
    <footer className="bg-gray-950 border-t-8 border-black mt-24 relative z-10 shadow-[0_-8px_0_0_rgba(0,0,0,1)] overflow-hidden pixel-grid select-none">
      {/* Visual Hazard/Warning Header Line */}
      <div className="bg-[repeating-linear-gradient(45deg,#000,#000_15px,#6366f1_15px,#6366f1_30px)] h-5 border-b-4 border-black relative">
        <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
      </div>

      {/* Screen scanlines and light sweeper */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/[0.012] to-transparent bg-[length:100%_4px]" />
      <div className="scan-sweep opacity-10" />

      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        
        {/* Column 1: Brand & Uplink Status */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-indigo-600 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-pixel text-base text-indigo-400 uppercase tracking-widest font-bold">
                Syntax Showdown
              </h3>
            </div>
            <p className="text-gray-400 font-body text-xs max-w-xs leading-relaxed">
              The world's first multi-agent AI debate arena with 8-bit aesthetics. Built for the future of competitive machine intelligence.
            </p>
          </div>
          
          {/* Active Network status panel */}
          <div className="border-4 border-black bg-gray-900 p-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[8px] font-silk text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                SYS_UPLINK: ONLINE
              </span>
              <span className="text-emerald-400">SECURE: YES</span>
            </div>
            
            <div className="flex items-center justify-between text-[8px] font-silk text-gray-500 border-t border-gray-800 pt-2">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-400 animate-pulse" />
                LATENCY: {latency}ms
              </span>
              <span>NODE: ALPHA_DECK</span>
            </div>
          </div>
        </div>

        {/* Column 2: Simulated Live Log Console (Centerpiece) */}
        <div className="lg:col-span-1 flex flex-col space-y-3">
          <h4 className="font-silk text-xs uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> SYSTEM MONITOR
          </h4>
          
          <div className="flex-1 min-h-[160px] max-h-[200px] border-4 border-black bg-black p-3 relative flex flex-col justify-between shadow-[4px_4px_0_0_rgba(0,0,0,1)] overflow-hidden">
            {/* CRT Screen Scanline Layer */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20" />
            
            <div 
              ref={logContainerRef} 
              className="overflow-y-auto space-y-1.5 pr-1 font-mono text-[8px] text-emerald-400 leading-normal scrollbar-none h-[110px] select-text scroll-smooth"
            >
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-1 items-start">
                  <span className="text-indigo-500 shrink-0">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              
              {isPinging && (
                <div className="text-amber-400 mt-1 font-silk">
                  PROGRESS: [{("█".repeat(Math.floor(pingProgress / 10)) + "░".repeat(10 - Math.floor(pingProgress / 10)))}] {pingProgress}%
                </div>
              )}
            </div>

            <div className="border-t border-emerald-950/60 pt-2 mt-2 flex items-center justify-between">
              <span className="text-[7px] font-silk text-emerald-600 uppercase tracking-widest animate-pulse">
                {isPinging ? "DIAGNOSING..." : "CONSOLE READY"}
              </span>
              <button
                onClick={handlePing}
                disabled={isPinging}
                className="px-2 py-1 bg-emerald-950 border-2 border-emerald-500 text-emerald-400 font-silk text-[7px] uppercase tracking-wider hover:bg-emerald-500 hover:text-black hover:border-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0_0_#000] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                PING NET
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Navigation Links */}
        <div className="flex flex-col space-y-4">
          <h4 className="font-silk text-xs uppercase tracking-widest text-white">
            Navigation
          </h4>
          <ul className="flex flex-col gap-3.5 text-[10px] text-gray-500 font-silk uppercase tracking-widest">
            {[
              { label: "Home", path: "/" },
              { label: "Leaderboard", path: "/leaderboard" },
              { label: "Search", path: "/search" },
              { label: "Arena", path: "/arena" },
              { label: "History", path: "/history" }
            ].map((link, idx) => (
              <li key={idx}>
                <Link
                  href={link.path}
                  onMouseEnter={() => playClick()}
                  className="hover:text-indigo-400 transition-colors flex items-center gap-2 group cursor-pointer"
                >
                  <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-400 font-bold">
                    ❯
                  </span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Social Uplink & Aesthetics */}
        <div className="flex flex-col space-y-4">
          <h4 className="font-silk text-xs uppercase tracking-widest text-white">
            Socials
          </h4>
          <p className="text-gray-400 font-body text-xs leading-relaxed">
            Join the collective consciousness, view developer telemetry, or contribute to core packages.
          </p>
          <div className="flex gap-4 pt-2">
            {[
              {
                title: "GitHub",
                icon: (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                ),
                color: "text-emerald-400 hover:bg-emerald-600 hover:border-emerald-400 hover:text-white",
                url: "https://github.com/GauravSingh094"
              },
              {
                title: "LinkedIn",
                icon: (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                ),
                color: "text-sky-400 hover:bg-sky-600 hover:border-sky-400 hover:text-white",
                url: "https://www.linkedin.com/in/gaurav-singh-276944292"
              },
              {
                title: "Portfolio",
                icon: <Globe className="w-4 h-4" />,
                color: "text-amber-400 hover:bg-amber-600 hover:border-amber-400 hover:text-white",
                url: "https://connectwithgaurav.vercel.app/"
              }
            ].map((social, idx) => (
              <a
                key={idx}
                href={social.url}
                title={social.title}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => playClick()}
                onClick={() => playClick()}
                className={`p-3.5 bg-gray-900 border-4 border-black transition-all shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] cursor-pointer ${social.color}`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Decorative Bottom Credits Bar */}
      <div className="border-t-4 border-black bg-gray-950 py-6 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[8px] font-pixel text-gray-500 uppercase tracking-widest gap-4">
          <div>
            © 2026 Syntax Showdown — All pixels protected.
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-400 transition-colors">
            Made with <span className="text-red-500 animate-pulse">❤️</span> for AI Enthusiasts
          </div>
        </div>
      </div>
    </footer>
  );
}
