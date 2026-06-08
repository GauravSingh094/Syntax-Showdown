"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy, Medal, Flame, Cpu, Loader2, RefreshCw,
  Clock, Gamepad2, ArrowRight, ShieldAlert, Award, Star
} from "lucide-react";
import { useSoundStore } from "@/store/soundStore";
import PixelParticlesBg from "@/components/PixelParticlesBg";
import AnimatedButton from "@/components/AnimatedButton";

interface LeaderboardData {
  top_topics: { topic: string; count: number }[];
  highest_scoring: { id: string; topic: string; winner: string; total_score: number; timestamp: string }[];
  model_trends: { model: string; count: number }[];
  total_debates_count: number;
}

export default function LeaderboardPage() {
  const { playClick } = useSoundStore();
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"scores" | "topics" | "models">("scores");

  async function fetchLeaderboard() {
    try {
      setError(false);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://syntax-showdown.onrender.com"}/history/leaderboard`
      );
      if (!res.ok) throw new Error("Failed to fetch leaderboard data");
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  function handleTabChange(tab: "scores" | "topics" | "models") {
    playClick();
    setActiveTab(tab);
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-73px)] bg-gray-950 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="font-silk text-[8px] text-gray-600 uppercase tracking-[0.4em] animate-pulse">Syncing global standings...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-73px)] bg-gray-950 p-6 text-center gap-4">
        <div className="p-4 bg-red-950/20 border-2 border-red-500 shadow-[4px_4px_0_#000] text-red-500">
          <ShieldAlert className="w-12 h-12 mx-auto animate-bounce" />
        </div>
        <h2 className="font-pixel text-lg text-white uppercase">STANDINGS CORRUPTED</h2>
        <p className="font-silk text-[8px] text-gray-500 uppercase tracking-widest max-w-sm">Failed to establish connection to ChromaDB cluster</p>
        <button onClick={() => { playClick(); setLoading(true); fetchLeaderboard(); }} className="pixel-button px-5 py-2 mt-4 cursor-pointer flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry Link
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-950 pb-24 pt-8 md:pt-12">
      <PixelParticlesBg />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/[0.01] to-transparent bg-[length:100%_4px] z-10" />

      <div className="max-w-6xl mx-auto p-4 relative z-10">
        
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 border-b border-gray-800 pb-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-indigo-500 animate-pulse shadow-[0_0_8px_#6366f1]" />
              <span className="font-silk text-[9px] text-indigo-400 uppercase tracking-[0.4em] font-bold">
                Standings Live
              </span>
            </div>
            <h1 className="font-pixel text-2xl md:text-4xl uppercase tracking-tighter text-white font-bold">
              Global Voxel Leaderboard
            </h1>
            <p className="font-silk text-[9px] text-gray-500 mt-2 uppercase tracking-[0.3em]">
              Real-time rankings across {data.total_debates_count} battles orchestrated by AI agents
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/arena" onClick={playClick}>
              <AnimatedButton>Fight in Arena</AnimatedButton>
            </Link>
          </div>
        </motion.div>

        {/* ── Quick Stats Grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-indigo-950/15 border-2 border-indigo-500/30 p-5 shadow-[0_0_12px_rgba(99,102,241,0.1)]">
            <div className="flex justify-between items-start mb-2">
              <Trophy className="w-5 h-5 text-indigo-400" />
              <span className="font-silk text-[7px] text-gray-500 uppercase tracking-widest">Global Index</span>
            </div>
            <div className="font-pixel text-xl text-indigo-400 mb-1">{data.total_debates_count}</div>
            <div className="font-silk text-[8px] text-gray-400 uppercase tracking-widest">Total Showdowns</div>
          </div>
          <div className="bg-emerald-950/15 border-2 border-emerald-500/30 p-5 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            <div className="flex justify-between items-start mb-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              <span className="font-silk text-[7px] text-gray-500 uppercase tracking-widest">Hot Topic</span>
            </div>
            <div className="font-pixel text-xs text-emerald-400 mb-1 uppercase truncate max-w-full">
              {data.top_topics[0]?.topic || "Neural Networks"}
            </div>
            <div className="font-silk text-[8px] text-gray-400 uppercase tracking-widest">Most Popular Conflict</div>
          </div>
          <div className="bg-amber-950/15 border-2 border-amber-500/30 p-5 shadow-[0_0_12px_rgba(234,179,8,0.1)]">
            <div className="flex justify-between items-start mb-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span className="font-silk text-[7px] text-gray-500 uppercase tracking-widest">Dominant Chip</span>
            </div>
            <div className="font-pixel text-xs text-amber-400 mb-1 uppercase">
              {data.model_trends[0]?.model || "Gemini"}
            </div>
            <div className="font-silk text-[8px] text-gray-400 uppercase tracking-widest">Preferred Model Node</div>
          </div>
        </div>

        {/* ── Selection Tabs ─────────────────────────────────────────────── */}
        <div className="flex border-b-4 border-black bg-gray-900 overflow-hidden mb-8">
          {[
            { id: "scores", label: "Scores", fullLabel: "Highest Scoring Showdowns", icon: <Award className="w-4 h-4 shrink-0" /> },
            { id: "topics", label: "Topics", fullLabel: "Hot Topics Registry", icon: <Flame className="w-4 h-4 shrink-0" /> },
            { id: "models", label: "Models", fullLabel: "Model Utilization Trends", icon: <Cpu className="w-4 h-4 shrink-0" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex-1 py-4 px-2 font-silk text-[8px] md:text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer border-r-2 border-black last:border-r-0 transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white font-bold"
                  : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
              }`}
            >
              {tab.icon} 
              <span className="hidden sm:inline">{tab.fullLabel}</span>
              <span className="inline sm:hidden">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Views ──────────────────────────────────────────────────── */}
        <div className="bg-gray-900 border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
          <AnimatePresence mode="wait">
            
            {/* View 1: Scores */}
            {activeTab === "scores" && (
              <motion.div
                key="scores"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                  <h3 className="font-pixel text-[10px] text-white uppercase tracking-widest">Platform High Scores</h3>
                  <span className="font-silk text-[7px] text-gray-500 uppercase tracking-widest">Click battle logs to audit</span>
                </div>

                {data.highest_scoring.length === 0 ? (
                  <p className="text-gray-600 text-center font-silk text-[8px] py-12">No high scoring neural clashes indexed.</p>
                ) : (
                  <div className="divide-y divide-black/30">
                    {data.highest_scoring.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between py-4 group cursor-pointer hover:bg-black/20 px-3 transition-colors"
                        onClick={() => { playClick(); router.push(`/debate/${item.id}`); }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-8 h-8 border-2 border-black flex items-center justify-center shrink-0 font-pixel text-xs ${
                            idx === 0 ? "bg-amber-500 text-black shadow-[2px_2px_0_#000]" :
                            idx === 1 ? "bg-slate-400 text-black shadow-[2px_2px_0_#000]" :
                            idx === 2 ? "bg-amber-700 text-white shadow-[2px_2px_0_#000]" :
                            "bg-gray-800 text-gray-500"
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-body text-sm text-gray-200 truncate group-hover:text-indigo-400 transition-colors uppercase">
                              {item.topic}
                            </p>
                            <div className="flex items-center gap-2.5 mt-1 font-silk text-[7px] text-gray-500">
                              <span>DECISION: {item.winner.toUpperCase()} ASCENDANT</span>
                              <span className="border-l border-gray-800 pl-2">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="font-pixel text-[11px] text-indigo-400 font-bold tracking-wider">{item.total_score} PTS</div>
                            <div className="font-silk text-[6px] text-gray-600 uppercase tracking-widest">Logical Aggregations</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* View 2: Topics */}
            {activeTab === "topics" && (
              <motion.div
                key="topics"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                  <h3 className="font-pixel text-[10px] text-white uppercase tracking-widest">Most Disputed Topics</h3>
                  <span className="font-silk text-[7px] text-gray-500 uppercase tracking-widest">High conflict density tags</span>
                </div>

                {data.top_topics.length === 0 ? (
                  <p className="text-gray-600 text-center font-silk text-[8px] py-12">No hot topics mapped yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    {data.top_topics.map((t, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-black/30 border-2 border-black p-4 flex justify-between items-center hover:border-indigo-500/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          playClick();
                          if (typeof window !== "undefined") {
                            localStorage.setItem("arena_prefill_topic", t.topic);
                          }
                          router.push("/arena");
                        }}
                      >
                        <div className="min-w-0 pr-4">
                          <p className="font-body text-xs text-gray-300 truncate uppercase font-bold group-hover:text-white transition-colors">
                            "{t.topic}"
                          </p>
                          <span className="font-silk text-[7px] text-gray-500 mt-1 uppercase tracking-wider block">
                            Platform Conflict Pill
                          </span>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <div className="text-right">
                            <span className="font-pixel text-xs text-emerald-400 font-bold">{t.count}</span>
                            <span className="font-silk text-[6px] text-gray-500 uppercase tracking-widest block">battles</span>
                          </div>
                          <Gamepad2 className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* View 3: Models */}
            {activeTab === "models" && (
              <motion.div
                key="models"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                  <h3 className="font-pixel text-[10px] text-white uppercase tracking-widest">Model Nodes Utilization</h3>
                  <span className="font-silk text-[7px] text-gray-500 uppercase tracking-widest">Active neural parameters</span>
                </div>

                {data.model_trends.length === 0 ? (
                  <p className="text-gray-600 text-center font-silk text-[8px] py-12">No model telemetry reports found.</p>
                ) : (
                  <div className="space-y-5 pt-3">
                    {data.model_trends.map((m, idx) => {
                      const maxVal = data.model_trends[0]?.count || 1;
                      const pct = (m.count / maxVal) * 100;
                      return (
                        <motion.div
                          key={m.model}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <div className="flex justify-between font-silk text-[8px] uppercase tracking-wider mb-1.5">
                            <span className="text-gray-300 font-bold flex items-center gap-2">
                              <Star className="w-3 h-3 text-indigo-400" /> {m.model}
                            </span>
                            <span className="text-indigo-400">{m.count} Invocations</span>
                          </div>
                          <div className="score-track">
                            <motion.div
                              className="score-fill-pro"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: idx * 0.08 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
