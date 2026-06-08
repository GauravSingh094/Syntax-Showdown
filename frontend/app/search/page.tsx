"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Terminal, Loader2, ArrowRight, ShieldAlert,
  Calendar, Zap, Trophy, SlidersHorizontal, RefreshCw
} from "lucide-react";
import { useSoundStore } from "@/store/soundStore";
import PixelParticlesBg from "@/components/PixelParticlesBg";

interface DebateRecord {
  id: string;
  topic: string;
  rounds: any;
  verdict?: { winner?: string; reasoning?: string; scores?: any };
  created_at?: string;
  timestamp?: string;
  model_used?: string;
  provider_used?: string;
}

export default function SearchPage() {
  const { getToken, isLoaded } = useAuth();
  const { playClick } = useSoundStore();
  const router = useRouter();

  const [debates, setDebates] = useState<DebateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [winnerFilter, setWinnerFilter] = useState<"all" | "Pro" | "Opponent">("all");
  const [modelFilter, setModelFilter] = useState<string>("all");

  async function fetchAll() {
    try {
      setError(false);
      const token = await getToken();
      // Fetch user specific history as primary scope for global search
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://syntax-showdown.onrender.com"}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch debates");
      const json = await res.json();
      setDebates(json.history || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded) {
      fetchAll();
    }
  }, [isLoaded]);

  // Extract unique model list for search filters
  const uniqueModels = Array.from(
    new Set(
      debates
        .map((d) => d.model_used || "")
        .flatMap((m) => m.split(", "))
        .map((m) => m.trim().toUpperCase())
        .filter((m) => m && m !== "UNKNOWN")
    )
  );

  // Live matching logic
  const filtered = debates.filter((d) => {
    const term = query.toLowerCase();
    
    // 1. Topic match
    const topicMatch = d.topic.toLowerCase().includes(term);
    
    // 2. Models match
    const modelMatchStr = (d.model_used || "").toLowerCase().includes(term);
    
    // 3. Arguments match (check if content matches query keywords)
    let argumentMatch = false;
    if (Array.isArray(d.rounds)) {
      argumentMatch = d.rounds.some(
        (r) =>
          (r.pro || "").toLowerCase().includes(term) ||
          (r.opponent || "").toLowerCase().includes(term)
      );
    }

    const matchesSearch = topicMatch || modelMatchStr || argumentMatch;
    
    // Filters match
    const matchesWinner = winnerFilter === "all" || d.verdict?.winner === winnerFilter;
    const matchesModelFilter =
      modelFilter === "all" ||
      (d.model_used || "").toUpperCase().includes(modelFilter);

    return matchesSearch && matchesWinner && matchesModelFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-73px)] bg-gray-950 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="font-silk text-[8px] text-gray-600 uppercase tracking-[0.4em] animate-pulse">Synchronizing local registers...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-950 pb-24 pt-8 md:pt-12">
      <PixelParticlesBg />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/[0.015] to-transparent bg-[length:100%_4px] z-10" />

      <div className="max-w-5xl mx-auto p-4 relative z-10">
        
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 border-b border-gray-800 pb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-4 h-4 text-indigo-400" />
            <span className="font-silk text-[9px] text-indigo-400 uppercase tracking-[0.4em] font-bold">Search Database</span>
          </div>
          <h1 className="font-pixel text-2xl md:text-3xl uppercase text-white font-bold">Global Search Console</h1>
          <p className="font-silk text-[9px] text-gray-500 mt-2 uppercase tracking-[0.3em]">Query across topics, arguments, winners, and model weights</p>
        </motion.div>

        {/* ── Search Input and Filter Bar ───────────────────────────────── */}
        <div className="bg-gray-900 border-4 border-black p-5 shadow-[8px_8px_0_0_#000] mb-8 space-y-4">
          <div className="relative">
            <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
            <input
              type="text"
              placeholder="ENTER SEARCH QUERY KEYWORDS (E.G. DEVELOPER, DEEPSEEK, PRO)..."
              value={query}
              onChange={(e) => {
                if (query === "") playClick();
                setQuery(e.target.value);
              }}
              className="w-full bg-gray-950 border-2 border-black pl-11 pr-4 py-3 font-silk text-[9px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest placeholder:text-gray-700"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between font-mono text-[9px] text-gray-400 uppercase tracking-wider">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              <span className="text-gray-600 mr-2">FILTERS:</span>
              
              {/* Winner filter */}
              <select
                value={winnerFilter}
                onChange={(e) => { playClick(); setWinnerFilter(e.target.value as any); }}
                className="bg-gray-950 border border-gray-800 p-1.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer uppercase text-[8px]"
              >
                <option value="all">ALL WINNERS</option>
                <option value="Pro">PRO ASCENDANT</option>
                <option value="Opponent">OPPONENT ASCENDANT</option>
              </select>

              {/* Model filter */}
              {uniqueModels.length > 0 && (
                <select
                  value={modelFilter}
                  onChange={(e) => { playClick(); setModelFilter(e.target.value); }}
                  className="bg-gray-950 border border-gray-800 p-1.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer uppercase text-[8px]"
                >
                  <option value="all">ALL MODELS</option>
                  {uniqueModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-gray-600 font-silk text-[7px] shrink-0 uppercase tracking-widest">
              Found {filtered.length} matching entries
            </div>
          </div>
        </div>

        {/* ── Search Results List ────────────────────────────────────────── */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-gray-900 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]"
              >
                <ShieldAlert className="w-8 h-8 text-gray-700 mx-auto mb-3 animate-pulse" />
                <p className="font-silk text-[8px] text-gray-600 uppercase tracking-widest">No matching registry records found</p>
                <button onClick={() => { playClick(); setQuery(""); setWinnerFilter("all"); setModelFilter("all"); }} className="font-silk text-[7px] text-indigo-500 uppercase tracking-wider hover:underline mt-2">
                  Clear Search Matrix
                </button>
              </motion.div>
            ) : (
              filtered.map((item, idx) => {
                const winner = item.verdict?.winner;
                const ts = item.timestamp || item.created_at;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    whileHover={{ x: 6 }}
                    onClick={() => { playClick(); router.push(`/debate/${item.id}`); }}
                    className="bg-gray-900 border-4 border-black p-5 shadow-[6px_6px_0_0_#000] hover:border-indigo-500/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group cursor-pointer transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {winner && (
                          <span className={`px-2 py-0.5 border font-silk text-[6px] uppercase tracking-widest font-bold ${
                            winner === "Pro"
                              ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-400"
                              : "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                          }`}>
                            {winner} Ascendant
                          </span>
                        )}
                        <span className="font-silk text-[6px] px-2 py-0.5 bg-black/40 border border-gray-800 text-gray-500 uppercase tracking-widest font-bold truncate max-w-[150px]">
                          {item.model_used || "Unknown Weights"}
                        </span>
                      </div>
                      <h3 className="font-body text-sm font-medium text-gray-200 group-hover:text-white transition-colors uppercase leading-snug">
                        {item.topic}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 font-mono text-[8px] text-gray-600 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ts ? new Date(ts).toLocaleDateString() : "—"}</span>
                        <span className="border-l border-gray-800 pl-3 flex items-center gap-1"><Zap className="w-3 h-3" /> {Array.isArray(item.rounds) ? item.rounds.length : (item.rounds || 0)} Rounds</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 self-end md:self-center font-silk text-[7px] text-gray-600 group-hover:text-indigo-400 transition-colors uppercase tracking-widest font-bold">
                      Audit Record <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
