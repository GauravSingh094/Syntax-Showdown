"use client";
import { useEffect, useState, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Trophy, Shield, Swords, Scale, ChevronLeft, Calendar,
  Zap, Clock, Cpu, BarChart3, Activity, Terminal, Share2, Gamepad2, Loader2
} from "lucide-react";
import { useSoundStore } from "@/store/soundStore";
import PixelParticlesBg from "@/components/PixelParticlesBg";
import AnimatedButton from "@/components/AnimatedButton";

interface DebateRecord {
  id?: string;
  topic: string;
  rounds: number;
  verdict?: { winner?: string; scores?: any; pro_summary?: any; opponent_summary?: any; reason?: string };
  created_at?: string;
  timestamp?: string;
  debate_rounds?: { round: number; pro: string; opponent: string }[];
  provider_used?: string;
  model_used?: string;
  cost?: number;
  latency_ms?: number;
}

function timeAgo(d?: string) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${dy}d ago`;
}

function renderSummary(summary: any, color = "text-indigo-400") {
  if (!summary) return <p className="text-gray-600">No summary available.</p>;
  const items: string[] = Array.isArray(summary)
    ? summary
    : typeof summary === "string" ? summary.split("\n").filter(Boolean) : [];
  return items.map((s, i) => (
    <div key={i} className="flex gap-2 items-start mb-1 text-xs">
      <span className={`${color} mt-0.5 shrink-0`}>•</span>
      <span>{s.replace(/^[-*•]\s*/, "")}</span>
    </div>
  ));
}

function ScoreBar({ label, value, side }: { label: string; value: number; side: "pro" | "opp" }) {
  return (
    <div className="mb-3 text-xs">
      <div className="flex justify-between mb-1">
        <span className="font-silk text-[8px] uppercase tracking-widest text-gray-500">{label}</span>
        <span className={`font-pixel text-[8px] ${side === "pro" ? "text-indigo-400" : "text-emerald-400"}`}>{value}/10</span>
      </div>
      <div className="score-track">
        <motion.div
          className={side === "pro" ? "score-fill-pro" : "score-fill-opp"}
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default function PublicDebatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { playClick } = useSoundStore();
  const [debate, setDebate] = useState<DebateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeRound, setActiveRound] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchPublicDebate() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/debate/public/${id}`);
        if (!res.ok) throw new Error("Debate not found");
        const data = await res.json();
        
        const d = data.debate || {};
        const isRoundsArray = Array.isArray(d.rounds);
        
        setDebate({
          ...d,
          debate_rounds: isRoundsArray ? d.rounds : (d.debate_rounds || []),
          rounds: isRoundsArray ? d.rounds.length : (typeof d.rounds === "number" ? d.rounds : 0),
        });
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicDebate();
  }, [id]);

  const handleShare = () => {
    playClick();
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-950 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="font-silk text-[8px] text-gray-600 uppercase tracking-[0.4em] animate-pulse">Syncing public feed...</p>
      </div>
    );
  }

  if (error || !debate) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-950 p-6 text-center gap-4">
        <div className="p-4 bg-red-950/20 border-2 border-red-500 shadow-[4px_4px_0_#000] text-red-500 mb-2">
          <Shield className="w-12 h-12 mx-auto animate-bounce" />
        </div>
        <h2 className="font-pixel text-lg text-white uppercase">RECORDS EXPUNGED</h2>
        <p className="font-silk text-[8px] text-gray-500 uppercase tracking-widest max-w-sm">The target battle record ID does not exist inside our ChromaDB cluster</p>
        <Link href="/" onClick={playClick}>
          <button className="pixel-button px-5 py-2 mt-4 cursor-pointer">Return Home</button>
        </Link>
      </div>
    );
  }

  const rounds = debate.debate_rounds || [];
  const winner = debate.verdict?.winner;

  return (
    <div className="relative min-h-screen bg-gray-950 pb-20">
      <PixelParticlesBg />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/[0.015] to-transparent bg-[length:100%_4px] z-10" />

      {/* Public Header */}
      <div className="w-full bg-black/40 border-b-4 border-black p-4 flex items-center justify-between sticky top-0 backdrop-blur-sm z-30 px-6">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-5 h-5 text-indigo-400" />
          <span className="font-silk text-[8px] text-indigo-400 uppercase tracking-widest font-bold">PUBLIC OBSERVATION TERMINAL (READ ONLY)</span>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-650 border-2 border-black font-silk text-[7px] text-white uppercase tracking-widest hover:bg-indigo-550 transition-all shadow-[2px_2px_0_0_#000] cursor-pointer font-bold shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" /> {copied ? "COPIED" : "SHARE BATTLE"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 pt-8">
        {/* Back Link */}
        <Link href="/" onClick={playClick} className="flex items-center gap-1.5 font-silk text-[8px] text-gray-500 hover:text-indigo-400 transition-colors uppercase tracking-widest mb-6">
          <ChevronLeft className="w-3.5 h-3.5" /> Return Home
        </Link>

        {/* Card Arena Box */}
        <div className="bg-gray-900 border-8 border-black shadow-[16px_16px_0_0_#000] overflow-hidden flex flex-col relative z-10">
          
          {/* Main Battle Title Header */}
          <div className="bg-gray-800 border-b-4 border-black p-6">
            <span className="font-silk text-[7px] text-indigo-400 uppercase tracking-[0.3em] font-bold block mb-1">COGNITIVE CLASH REGISTRY</span>
            <h1 className="font-pixel text-base md:text-lg text-white uppercase leading-snug font-bold">{debate.topic}</h1>
            <div className="flex items-center gap-4 mt-3 font-mono text-[9px] text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeAgo(debate.timestamp || debate.created_at)}</span>
              <span className="border-l border-gray-800 pl-3 flex items-center gap-1 text-indigo-400"><Zap className="w-3.5 h-3.5" /> {debate.rounds} ROUND CAPACITY</span>
            </div>
          </div>

          {/* Winner Showcase Banner */}
          {winner && (
            <div className={`px-6 py-5 flex items-center gap-5 border-b-4 border-black ${
              winner === "Pro"
                ? "bg-gradient-to-r from-indigo-950 via-indigo-900/40 to-transparent border-indigo-500/30"
                : "bg-gradient-to-r from-emerald-950 via-emerald-900/40 to-transparent border-emerald-500/30"
            }`}>
              <div className={`p-3 border-4 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] shrink-0 ${
                winner === "Pro" ? "bg-indigo-600" : "bg-emerald-600"
              }`}>
                <Trophy className="w-8 h-8 text-white animate-bounce" />
              </div>
              <div>
                <span className="font-silk text-[7px] text-gray-400 uppercase tracking-widest block mb-0.5">NEURAL DECISION</span>
                <h3 className={`font-pixel text-lg uppercase winner-glow-anim ${
                  winner === "Pro" ? "text-indigo-300" : "text-emerald-300"
                }`}>
                  {winner} ASCENDANT
                </h3>
              </div>
            </div>
          )}

          {/* Round selector tabs */}
          {rounds.length > 0 && (
            <div className="flex items-center gap-0 border-b-4 border-black bg-gray-850 overflow-x-auto shrink-0">
              {rounds.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => { playClick(); setActiveRound(idx); }}
                  className={`px-5 py-3.5 font-silk text-[8px] uppercase tracking-widest border-r-2 border-black transition-all cursor-pointer shrink-0 ${
                    activeRound === idx
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-gray-500 hover:bg-gray-800"
                  }`}
                >
                  Round {r.round}
                </button>
              ))}
              <button
                onClick={() => { playClick(); setActiveRound(-1); }}
                className={`px-5 py-3.5 font-silk text-[8px] uppercase tracking-widest transition-all cursor-pointer shrink-0 ${
                  activeRound === -1
                    ? "bg-amber-600 text-white font-bold"
                    : "text-gray-500 hover:bg-gray-800"
                }`}
              >
                Verdict Analysis
              </button>
            </div>
          )}

          {/* Content Display */}
          <div className="p-6 bg-gray-950 flex-1 overflow-y-auto space-y-6 max-h-[60vh]">
            {activeRound >= 0 && rounds[activeRound] && (
              <div className="space-y-5">
                <div className="flex justify-center mb-1">
                  <div className="bg-black border-2 border-black px-5 py-1.5 font-pixel text-[7px] text-gray-500 uppercase tracking-[0.4em] font-bold">
                    ROUND {rounds[activeRound].round} ARGUMENTS
                  </div>
                </div>

                {/* Pro Card */}
                <div className="bg-indigo-950/10 border-l-4 border-indigo-650 p-5 shadow-[inset_0_0_12px_rgba(99,102,241,0.02)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span className="font-silk text-[8px] text-indigo-400 uppercase tracking-widest font-bold">PRO DEFENDER</span>
                  </div>
                  <div className="text-gray-300 font-body leading-relaxed text-sm space-y-2">
                    {rounds[activeRound].pro?.split("\n").map((line, li) => (
                      <p key={li}>{line.replace(/^[-*]\s*/, "")}</p>
                    ))}
                  </div>
                </div>

                {/* Opponent Card */}
                <div className="bg-emerald-950/10 border-r-4 border-emerald-655 p-5 shadow-[inset_0_0_12px_rgba(16,185,129,0.02)]">
                  <div className="flex items-center gap-3 mb-3 flex-row-reverse">
                    <Swords className="w-4 h-4 text-emerald-400" />
                    <span className="font-silk text-[8px] text-emerald-400 uppercase tracking-widest font-bold">OPPONENT CHALLENGER</span>
                  </div>
                  <div className="text-gray-300 font-body leading-relaxed text-sm space-y-2 text-right md:text-left">
                    {rounds[activeRound].opponent?.split("\n").map((line, li) => (
                      <p key={li}>{line.replace(/^[-*]\s*/, "")}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Verdict Audit (Tab = -1) */}
            {activeRound === -1 && (
              <div className="space-y-6">
                
                {/* Score breakdown */}
                {(debate.verdict?.scores?.Pro || debate.verdict?.scores?.Opponent) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900 border-2 border-black p-5">
                      <h4 className="font-silk text-[8px] text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2 font-bold">
                        <Shield className="w-3 h-3" /> Pro AI Metrics
                      </h4>
                      {Object.entries(debate.verdict?.scores?.Pro || {}).map(([k, v], idx) => (
                        <ScoreBar key={k} label={k} value={v as number} side="pro" />
                      ))}
                    </div>
                    <div className="bg-gray-900 border-2 border-black p-5">
                      <h4 className="font-silk text-[8px] text-emerald-400 mb-4 uppercase tracking-widest flex items-center gap-2 font-bold">
                        <Swords className="w-3 h-3" /> Opponent AI Metrics
                      </h4>
                      {Object.entries(debate.verdict?.scores?.Opponent || {}).map(([k, v], idx) => (
                        <ScoreBar key={k} label={k} value={v as number} side="opp" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Takeaways summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-900 border-2 border-black p-5 shadow-[3px_3px_0_0_#4f46e5]">
                    <h4 className="font-silk text-[8px] text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2 font-bold">
                      <Shield className="w-3 h-3" /> Pro Key Arguments
                    </h4>
                    <div className="text-gray-400 space-y-1.5">
                      {renderSummary(debate.verdict?.pro_summary, "text-indigo-400")}
                    </div>
                  </div>
                  <div className="bg-gray-900 border-2 border-black p-5 shadow-[3px_3px_0_0_#10b981]">
                    <h4 className="font-silk text-[8px] text-emerald-400 mb-4 uppercase tracking-widest flex items-center gap-2 font-bold">
                      <Swords className="w-3 h-3" /> Opponent Key Arguments
                    </h4>
                    <div className="text-gray-400 space-y-1.5">
                      {renderSummary(debate.verdict?.opponent_summary, "text-emerald-400")}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-gray-900 border-2 border-black p-5">
                  <h4 className="font-silk text-[8px] text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <Scale className="w-3.5 h-3.5" /> Adjudicator Analysis Log
                  </h4>
                  <p className="text-gray-400 font-body text-xs leading-relaxed">{debate.verdict?.reason}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
