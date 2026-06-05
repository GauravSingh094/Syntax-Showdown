"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  History, Calendar, Award, ChevronRight, Search, X,
  Scale, Terminal, Trophy, Shield, Swords, Filter,
  RotateCcw, Zap, ChevronLeft, ChevronDown, Play,
  BarChart3, RefreshCw, Volume2, Eye
} from "lucide-react";
import { SkeletonHistoryCard } from "@/components/Skeleton";
import { useSoundStore } from "@/store/soundStore";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface DebateRecord {
  id?: string;
  topic: string;
  rounds: number;
  verdict?: { winner?: string; scores?: any; pro_summary?: any; opponent_summary?: any; reason?: string };
  created_at?: string;
  timestamp?: string;
  debate_rounds?: { round: number; pro: string; opponent: string }[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function timeAgo(d?: string) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${dy}d ago`;
}

function renderSummary(summary: any, color = "text-indigo-500") {
  if (!summary) return <p className="text-gray-600">No summary available.</p>;
  const items: string[] = Array.isArray(summary)
    ? summary
    : typeof summary === "string" ? summary.split("\n").filter(Boolean) : [];
  return items.map((s, i) => (
    <div key={i} className="flex gap-2 items-start mb-1">
      <span className={`${color} mt-0.5 shrink-0`}>•</span>
      <span>{s.replace(/^[-*•]\s*/, "")}</span>
    </div>
  ));
}

/* ─── Typing cursor component for playback (Task 10) ─────────────────────── */
function PlaybackTypewriter({
  text, speed = 10, isPaused = false, onDone
}: {
  text: string; speed?: number; isPaused?: boolean; onDone?: () => void
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone]           = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);
  }, [text]);

  useEffect(() => {
    if (done) return;
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    function tick() {
      if (indexRef.current < text.length) {
        const chunk = text.slice(indexRef.current, indexRef.current + 4);
        indexRef.current += chunk.length;
        setDisplayed(text.slice(0, indexRef.current));
        timerRef.current = setTimeout(tick, speed);
      } else {
        setDone(true);
        onDone?.();
      }
    }
    timerRef.current = setTimeout(tick, speed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text, speed, isPaused, done]);

  return (
    <span>
      {displayed.split("\n").map((line, li) => (
        <span key={li} className="block">
          {line}
        </span>
      ))}
      {!done && (
        <span
          className="typing-cursor-solid ml-0.5 inline-block text-current font-bold"
          style={{ animation: "cyberBlink 0.6s steps(2, start) infinite" }}
        >
          █
        </span>
      )}
    </span>
  );
}

/* ─── Animated score bar ─────────────────────────────────────────────────── */
function AnimScoreBar({ label, value, side, delay = 0 }: {
  label: string; value: number; side: "pro" | "opp"; delay?: number;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="font-silk text-[8px] uppercase tracking-widest text-gray-500">{label}</span>
        <span className={`font-pixel text-[8px] ${side === "pro" ? "text-indigo-400" : "text-emerald-400"}`}>{value}/10</span>
      </div>
      <div className="score-track">
        <motion.div
          className={side === "pro" ? "score-fill-pro" : "score-fill-opp"}
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
    </div>
  );
}

type FilterKey = "all" | "pro" | "opponent" | "r1" | "r3" | "r5";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",      label: "All"       },
  { key: "pro",      label: "Pro Wins"  },
  { key: "opponent", label: "Opp Wins"  },
  { key: "r1",       label: "1 Round"   },
  { key: "r3",       label: "3 Rounds"  },
  { key: "r5",       label: "5 Rounds"  },
];

type SortKey = "newest" | "oldest" | "topic" | "winner";

/* ═══════════════════════════════════════════════════════════════════════════
   HISTORY PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function HistoryPage() {
  const { getToken, isLoaded } = useAuth();
  const { playClick, playComplete } = useSoundStore();
  const router = useRouter();

  const [debates, setDebates]           = useState<DebateRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState<DebateRecord | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy]             = useState<SortKey>("newest");
  const [activeRound, setActiveRound]   = useState(0);         // modal round tab
  const [hoveredCard, setHoveredCard]   = useState<number | null>(null);

  // Rewatch Playback States (Task 10)
  const [isRewatching, setIsRewatching] = useState(false);
  const [rewatchRound, setRewatchRound] = useState(0);
  const [rewatchState, setRewatchState] = useState<"pro" | "opponent" | "done">("pro");
  const [isPaused, setIsPaused] = useState(false);
  const [rewatchSpeed, setRewatchSpeed] = useState(6);

  useEffect(() => {
    async function fetchHistory() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        if (!token) return;
        const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const rawHistory = data.history || [];
        const normalized = rawHistory.map((d: any) => {
          const isRoundsArray = Array.isArray(d.rounds);
          return {
            ...d,
            debate_rounds: isRoundsArray ? d.rounds : (d.debate_rounds || []),
            rounds: isRoundsArray ? d.rounds.length : (typeof d.rounds === "number" ? d.rounds : 0),
          };
        });
        setDebates(normalized);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchHistory();
  }, [isLoaded, getToken]);

  /* Sorting & Filtering (Task 10) */
  const filtered = debates
    .filter((d) => {
      const matchSearch = d.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter =
        activeFilter === "all"      ? true :
        activeFilter === "pro"      ? d.verdict?.winner === "Pro" :
        activeFilter === "opponent" ? d.verdict?.winner === "Opponent" :
        activeFilter === "r1"       ? d.rounds === 1 :
        activeFilter === "r3"       ? d.rounds === 3 :
                                      d.rounds === 5;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        const ta = new Date(a.created_at || a.timestamp || 0).getTime();
        const tb = new Date(b.created_at || b.timestamp || 0).getTime();
        return tb - ta;
      }
      if (sortBy === "oldest") {
        const ta = new Date(a.created_at || a.timestamp || 0).getTime();
        const tb = new Date(b.created_at || b.timestamp || 0).getTime();
        return ta - tb;
      }
      if (sortBy === "topic") {
        return a.topic.localeCompare(b.topic);
      }
      if (sortBy === "winner") {
        const wa = a.verdict?.winner || "";
        const wb = b.verdict?.winner || "";
        return wa.localeCompare(wb);
      }
      return 0;
    });

  const filterCount = (key: FilterKey) =>
    debates.filter((d) => {
      if (key === "all")      return true;
      if (key === "pro")      return d.verdict?.winner === "Pro";
      if (key === "opponent") return d.verdict?.winner === "Opponent";
      if (key === "r1")       return d.rounds === 1;
      if (key === "r3")       return d.rounds === 3;
      return d.rounds === 5;
    }).length;

  function openDebate(d: DebateRecord) {
    playClick();
    setSelected(d);
    setActiveRound(0);
    setIsRewatching(false);
  }

  function rerun(topic: string, e: React.MouseEvent) {
    e.stopPropagation();
    playClick();
    localStorage.setItem("arena_prefill_topic", topic);
    router.push("/arena");
  }

  // Trigger rewatch typing replay (Task 10)
  function startRewatch() {
    playClick();
    setIsPaused(false);
    setRewatchSpeed(6);
    setIsRewatching(true);
    setRewatchRound(0);
    setRewatchState("pro");
  }

  /* ── Skeleton loading ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 pt-12">
        <div className="flex items-center justify-between mb-12">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonHistoryCard key={i} />)}
        </div>
      </div>
    );
  }

  const rounds = selected?.debate_rounds || [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pt-10 pb-24">
      {/* Dynamic blink styling */}
      <style>{`
        @keyframes cyberBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .typing-cursor-solid {
          animation: cyberBlink 0.6s steps(2, start) infinite;
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-gray-800 pb-6"
      >
        <div>
          <h1 className="font-pixel text-2xl md:text-3xl uppercase tracking-tighter text-white flex items-center gap-3 font-bold">
            <History className="w-7 h-7 text-indigo-500 animate-pulse" /> Battle Registry
          </h1>
          <p className="font-silk text-[8px] text-gray-500 mt-1.5 uppercase tracking-widest font-bold">
            {debates.length} session{debates.length !== 1 ? "s" : ""} recorded inside memory banks
          </p>
        </div>

        {/* Search & Sort Panel (Task 10) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border-2 border-gray-850 pl-10 pr-9 py-2.5 font-silk text-[9px] uppercase tracking-widest text-white focus:outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_12px_rgba(99,102,241,0.2)]"
            />
            {searchQuery && (
              <button
                onClick={() => { playClick(); setSearchQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-indigo-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => { playClick(); setSortBy(e.target.value as SortKey); }}
            className="bg-gray-950 border-2 border-gray-850 px-3.5 py-2.5 font-silk text-[9px] text-white focus:outline-none focus:border-indigo-500 uppercase cursor-pointer"
          >
            <option value="newest">NEWEST FIRST</option>
            <option value="oldest">OLDEST FIRST</option>
            <option value="topic">ALPHABETICAL</option>
            <option value="winner">WINNER AGENT</option>
          </select>
        </div>
      </motion.div>

      {/* ── Filter Pills ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2 mb-8 items-center"
      >
        <Filter className="w-3.5 h-3.5 text-gray-600 mr-2" />
        {FILTERS.map(({ key, label }) => {
          const count = filterCount(key);
          const active = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => { playClick(); setActiveFilter(key); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-silk text-[8px] uppercase tracking-widest transition-all cursor-pointer ${
                active
                  ? "bg-indigo-600 border-indigo-400 text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  : "bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-350"
              }`}
            >
              {label}
              <span className={`px-1 py-0.5 text-[6px] font-pixel font-bold ${active ? "bg-white/20" : "bg-gray-800"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Cards Grid with staggered entries (Task 3 & 10) ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnimatePresence>
          {filtered.map((d, i) => {
            const winner  = d.verdict?.winner;
            const ts      = d.created_at || d.timestamp;
            const isHov   = hoveredCard === i;
            const preview = (d.debate_rounds?.[0]?.pro || "").slice(0, 110);

            return (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 220, damping: 20 }}
                onClick={() => openDebate(d)}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                className="bg-gray-950 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[0_0_18px_rgba(99,102,241,0.2)] hover:border-indigo-500/40 group relative overflow-hidden transition-all duration-350 cursor-pointer p-6"
              >
                {/* Winner ribbon */}
                {winner && (
                  <div className={`absolute top-0 right-0 px-3.5 py-1.5 font-pixel text-[7px] uppercase border-l-4 border-b-4 border-black font-bold z-10 ${
                    winner === "Pro"
                      ? "bg-indigo-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}>
                    {winner} Win
                  </div>
                )}

                {/* Card Header */}
                <div className="flex items-start gap-4 mb-4 pr-16">
                  <div className="p-2.5 bg-gray-900 border-2 border-black text-indigo-400 shrink-0 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <h2 className="font-body text-sm text-white font-medium leading-snug line-clamp-2">
                    {d.topic}
                  </h2>
                </div>

                {/* Preview argument content */}
                {preview && (
                  <p className="font-body text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 pl-12">
                    "{preview}..."
                  </p>
                )}

                {/* Meta details row */}
                <div className="flex items-center justify-between pl-12 border-t border-gray-900 pt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-900 border border-gray-800 font-silk text-[7px] text-gray-500 uppercase font-bold">
                      <Zap className="w-2.5 h-2.5 text-indigo-400" /> {d.rounds}R
                    </div>
                    <div className="flex items-center gap-1.5 font-silk text-[7px] text-gray-600 uppercase font-bold">
                      <Calendar className="w-2.5 h-2.5" /> {timeAgo(ts)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Hover Replay */}
                    <AnimatePresence>
                      {isHov && (
                        <motion.button
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          onClick={(e) => rerun(d.topic, e)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 border-2 border-black font-silk text-[7px] text-white uppercase tracking-wider hover:bg-indigo-500 transition-all shadow-[2px_2px_0_0_#000] cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Replay
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <div className="flex items-center gap-1 font-silk text-[8px] text-gray-500 group-hover:text-indigo-400 transition-colors">
                      Review <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty Search state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32"
        >
          <div className="w-16 h-16 border-4 border-black bg-gray-900 flex items-center justify-center mx-auto mb-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
            <Search className="w-8 h-8 text-gray-700 animate-bounce" />
          </div>
          <p className="font-pixel text-xs text-gray-700 uppercase tracking-widest">No matches found</p>
          <button
            onClick={() => { playClick(); setSearchQuery(""); setActiveFilter("all"); }}
            className="mt-4 font-silk text-[8px] text-indigo-500 hover:text-indigo-300 uppercase tracking-widest transition-colors cursor-pointer"
          >
            Clear active filters
          </button>
        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          DETAIL VIEW MODAL (Task 10 rewatch battle system)
          ───────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => { playClick(); setSelected(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 24, filter: "blur(4px)" }}
              animate={{ scale: 1,   y: 0,  filter: "blur(0px)" }}
              exit={{    scale: 0.9, y: 16, filter: "blur(2px)" }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="bg-gray-900 border-4 sm:border-8 border-black w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[8px_8px_0_0_#000] sm:shadow-[16px_16px_0_0_#000] overflow-hidden rounded-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-gray-800 border-b-4 border-black p-5 flex items-center justify-between shrink-0">
                <div className="min-w-0 mr-4">
                  <p className="font-silk text-[8px] text-gray-500 uppercase tracking-widest mb-1">Session Audit Log</p>
                  <h3 className="font-body text-sm text-white font-medium truncate">{selected.topic}</h3>
                </div>
                <button
                  onClick={() => { playClick(); setSelected(null); }}
                  className="p-2 border-4 border-black bg-red-750 hover:bg-red-650 shadow-[3px_3px_0_0_#000] transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Winner banner */}
              {selected.verdict?.winner && (
                <div className={`shrink-0 p-5 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b-4 border-black ${
                  selected.verdict.winner === "Pro"
                    ? "bg-gradient-to-r from-indigo-950 via-indigo-900/30 to-transparent"
                    : "bg-gradient-to-r from-emerald-950 via-emerald-900/30 to-transparent"
                }`}>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className={`p-2.5 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] shrink-0 ${
                      selected.verdict.winner === "Pro" ? "bg-indigo-600" : "bg-emerald-600"
                    }`}>
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-silk text-[7px] text-gray-400 uppercase tracking-widest">Verdict Outcome</p>
                      <p className={`font-pixel text-base uppercase ${
                        selected.verdict.winner === "Pro" ? "text-indigo-300" : "text-emerald-300"
                      }`}>
                        {selected.verdict.winner} Ascendant
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:ml-auto justify-end mt-2 sm:mt-0">
                    <button
                      onClick={startRewatch}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-650 border-2 border-black font-silk text-[7px] text-white uppercase tracking-widest hover:bg-purple-550 transition-colors shadow-[2px_2px_0_0_#000] cursor-pointer font-bold"
                    >
                      <Eye className="w-3.5 h-3.5 animate-pulse" /> Rewatch Battle
                    </button>
                    <button
                      onClick={(e) => rerun(selected.topic, e)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 border-2 border-black font-silk text-[7px] text-gray-300 uppercase tracking-widest hover:bg-indigo-650 hover:text-white transition-colors shadow-[2px_2px_0_0_#000] cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Replay
                    </button>
                  </div>
                </div>
              )}

              {/* Round tabs (Static view) */}
              {!isRewatching && rounds.length > 0 && (
                <div className="flex items-center gap-0 shrink-0 border-b-4 border-black bg-gray-850 overflow-x-auto">
                  {rounds.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => { playClick(); setActiveRound(idx); }}
                      className={`px-5 py-3.5 font-silk text-[8px] uppercase tracking-widest shrink-0 border-r-2 border-black transition-all cursor-pointer ${
                        activeRound === idx
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                      }`}
                    >
                      Round {r.round}
                    </button>
                  ))}
                  <button
                    onClick={() => { playClick(); setActiveRound(-1); }}
                    className={`px-5 py-3.5 font-silk text-[8px] uppercase tracking-widest shrink-0 transition-all cursor-pointer ${
                      activeRound === -1
                        ? "bg-amber-600 text-white font-bold"
                        : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    }`}
                  >
                    Verdict Summary
                  </button>
                </div>
              )}

              {/* Playback Rewatch Indicator bar (Task 3 Replay controls) */}
              {isRewatching && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 bg-purple-950/30 border-b-4 border-black font-silk text-[8px] text-purple-400 uppercase tracking-widest font-bold">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-2 ${isPaused ? "" : "animate-pulse"}`}>
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                      PLAYBACK MODE: {isPaused ? "PAUSED" : "STREAMING LIVE"}
                    </span>
                  </div>
                  
                  {/* Playback action items */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Play / Pause Toggle */}
                    <button
                      onClick={() => { playClick(); setIsPaused(!isPaused); }}
                      className="px-3 py-1 bg-purple-900/40 border border-purple-500/50 hover:bg-purple-800/40 text-purple-300 hover:text-white cursor-pointer transition-colors"
                    >
                      {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
                    </button>

                    {/* Speed Controls */}
                    <div className="flex items-center gap-1.5 border border-purple-500/30 px-2 py-1 bg-black/40">
                      <span className="text-gray-500 mr-1.5">SPEED:</span>
                      {[
                        { label: "1X", speed: 6 },
                        { label: "2X", speed: 3 },
                        { label: "5X", speed: 1.2 },
                        { label: "10X", speed: 0.1 }
                      ].map((sp) => (
                        <button
                          key={sp.label}
                          onClick={() => { playClick(); setRewatchSpeed(sp.speed); }}
                          className={`px-1.5 py-0.5 hover:text-white transition-colors cursor-pointer ${
                            rewatchSpeed === sp.speed ? "bg-purple-600 text-white" : "text-gray-600"
                          }`}
                        >
                          {sp.label}
                        </button>
                      ))}
                    </div>

                    {/* Stop Replay */}
                    <button
                      onClick={() => { playClick(); setIsRewatching(false); }}
                      className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer border border-gray-800 hover:border-red-500/40 px-3 py-1"
                    >
                      [ EXIT ]
                    </button>
                  </div>
                </div>
              )}

              {/* Scroll body */}
              <div className="flex-1 overflow-y-auto bg-gray-950 p-6 space-y-6">

                {/* Rewatch battle dynamic typing screen (Task 10) */}
                {isRewatching && rounds[rewatchRound] && (
                  <div className="space-y-6">
                    <div className="flex justify-center mb-1">
                      <div className="bg-black border-2 border-black px-5 py-1.5 font-pixel text-[7px] text-gray-500 uppercase tracking-[0.4em] font-bold">
                        PLAYBACK: ROUND {rounds[rewatchRound].round} / {rounds.length}
                      </div>
                    </div>

                    {/* Pro Typing playback */}
                    {rewatchState === "pro" && (
                      <div className="bg-indigo-950/10 border-l-4 border-indigo-650 p-5 shadow-[inset_0_0_12px_rgba(99,102,241,0.02)]">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-4 h-4 text-indigo-400" />
                          <span className="font-silk text-[8px] text-indigo-400 uppercase tracking-widest font-bold">PRO AI DEFENDER</span>
                        </div>
                        <p className="text-gray-350 font-body leading-relaxed text-sm">
                          <PlaybackTypewriter
                            text={rounds[rewatchRound].pro || ""}
                            speed={rewatchSpeed}
                            isPaused={isPaused}
                            onDone={() => {
                              const transition = () => {
                                if (isPaused) {
                                  setTimeout(transition, 500);
                                } else {
                                  setRewatchState("opponent");
                                }
                              };
                              setTimeout(transition, 2000);
                            }}
                          />
                        </p>
                      </div>
                    )}

                    {/* Opponent Typing playback */}
                    {(rewatchState === "opponent" || rewatchState === "done") && (
                      <>
                        <div className="bg-indigo-950/10 border-l-4 border-indigo-650 p-5 opacity-40">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-indigo-500" />
                            <span className="font-silk text-[8px] text-indigo-500 uppercase tracking-widest">PRO AI DEFENDER [CONCLUDED]</span>
                          </div>
                          <p className="text-gray-500 font-body text-xs line-clamp-2">"{rounds[rewatchRound].pro}"</p>
                        </div>

                        <div className="bg-emerald-950/10 border-r-4 border-emerald-650 p-5 shadow-[inset_0_0_12px_rgba(16,185,129,0.02)]">
                          <div className="flex items-center gap-2 mb-3 flex-row-reverse">
                            <Swords className="w-4 h-4 text-emerald-400" />
                            <span className="font-silk text-[8px] text-emerald-400 uppercase tracking-widest font-bold">OPPONENT CHALLENGER</span>
                          </div>
                          <p className="text-gray-350 font-body leading-relaxed text-sm">
                            <PlaybackTypewriter
                              text={rounds[rewatchRound].opponent || ""}
                              speed={rewatchSpeed}
                              isPaused={isPaused}
                              onDone={() => {
                                const transition = () => {
                                  if (isPaused) {
                                    setTimeout(transition, 500);
                                  } else {
                                    if (rewatchRound < rounds.length - 1) {
                                      setRewatchRound(prev => prev + 1);
                                      setRewatchState("pro");
                                    } else {
                                      setRewatchState("done");
                                      playComplete();
                                      setTimeout(() => setIsRewatching(false), 2000);
                                    }
                                  }
                                };
                                setTimeout(transition, 3000);
                              }}
                            />
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}


                {/* Static Round content */}
                {!isRewatching && activeRound >= 0 && rounds[activeRound] && (
                  <div className="space-y-5">
                    <div className="flex justify-center mb-2">
                      <div className="bg-black border-2 border-black px-5 py-1.5 font-pixel text-[7px] text-gray-500 uppercase tracking-[0.4em] font-bold">
                        ROUND {rounds[activeRound].round}
                      </div>
                    </div>

                    {/* Pro */}
                    <div className="bg-indigo-950/10 border-l-4 border-indigo-650 p-5 shadow-[inset_0_0_12px_rgba(99,102,241,0.02)]">
                      <div className="flex items-center gap-3 mb-3">
                        <Shield className="w-4 h-4 text-indigo-400" />
                        <span className="font-silk text-[8px] text-indigo-400 uppercase tracking-widest font-bold">Pro AI Defender</span>
                      </div>
                      <div className="text-gray-300 font-body leading-relaxed text-sm space-y-2">
                        {rounds[activeRound].pro?.split("\n").map((line, li) => (
                          <p key={li}>{line.replace(/^[-*]\s*/, "")}</p>
                        ))}
                      </div>
                    </div>

                    {/* Opponent */}
                    <div className="bg-emerald-950/10 border-r-4 border-emerald-655 p-5 shadow-[inset_0_0_12px_rgba(16,185,129,0.02)]">
                      <div className="flex items-center gap-3 mb-3 flex-row-reverse">
                        <Swords className="w-4 h-4 text-emerald-400" />
                        <span className="font-silk text-[8px] text-emerald-400 uppercase tracking-widest font-bold">Opponent AI Challenger</span>
                      </div>
                      <div className="text-gray-300 font-body leading-relaxed text-sm space-y-2">
                        {rounds[activeRound].opponent?.split("\n").map((line, li) => (
                          <p key={li}>{line.replace(/^[-*]\s*/, "")}</p>
                        ))}
                      </div>
                    </div>

                    {/* Round navigation controller */}
                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => { playClick(); setActiveRound(Math.max(0, activeRound - 1)); }}
                        disabled={activeRound === 0}
                        className="flex items-center gap-1 font-silk text-[8px] text-gray-600 hover:text-indigo-400 disabled:opacity-30 transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" /> Prev Round
                      </button>
                      <button
                        onClick={() => { playClick(); setActiveRound(Math.min(rounds.length - 1, activeRound + 1)); }}
                        disabled={activeRound >= rounds.length - 1}
                        className="flex items-center gap-1 font-silk text-[8px] text-gray-600 hover:text-indigo-400 disabled:opacity-30 transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        Next Round <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Static Verdict panel (tab = -1) or always shown when no rounds */}
                {!isRewatching && (activeRound === -1 || rounds.length === 0) && (
                  <motion.div
                    key="verdict"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Summaries */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-900 border-2 border-black p-5 shadow-[3px_3px_0_0_#4f46e5]">
                        <h4 className="font-silk text-[8px] text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2 font-bold">
                          <Shield className="w-3 h-3" /> Pro AI Key Arguments
                        </h4>
                        <div className="text-gray-400 text-xs font-body space-y-2">
                          {renderSummary(selected.verdict?.pro_summary, "text-indigo-400")}
                        </div>
                      </div>
                      <div className="bg-gray-900 border-2 border-black p-5 shadow-[3px_3px_0_0_#10b981]">
                        <h4 className="font-silk text-[8px] text-emerald-400 mb-4 uppercase tracking-widest flex items-center gap-2 font-bold">
                          <Swords className="w-3 h-3" /> Opponent Key Arguments
                        </h4>
                        <div className="text-gray-400 text-xs font-body space-y-2">
                          {renderSummary(selected.verdict?.opponent_summary, "text-emerald-400")}
                        </div>
                      </div>
                    </div>

                    {/* Score bars */}
                    {(selected.verdict?.scores?.Pro || selected.verdict?.scores?.Opponent) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900 border-2 border-black p-5">
                          <h4 className="font-silk text-[8px] text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2 font-bold">
                            <Shield className="w-3 h-3" /> Pro Neural Scores
                          </h4>
                          {Object.entries(selected.verdict?.scores?.Pro || {}).map(([k, v], idx) => (
                            <AnimScoreBar key={k} label={k} value={v as number} side="pro" delay={idx * 0.1} />
                          ))}
                        </div>
                        <div className="bg-gray-900 border-2 border-black p-5">
                          <h4 className="font-silk text-[8px] text-emerald-400 mb-4 uppercase tracking-widest flex items-center gap-2 font-bold">
                            <Swords className="w-3 h-3" /> Opponent Neural Scores
                          </h4>
                          {Object.entries(selected.verdict?.scores?.Opponent || {}).map(([k, v], idx) => (
                            <AnimScoreBar key={k} label={k} value={v as number} side="opp" delay={idx * 0.1} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Adjudication log */}
                    <div className="bg-gray-900 border-2 border-black p-5">
                      <h4 className="font-silk text-[8px] text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2 font-bold">
                        <Scale className="w-3 h-3" /> Adjudicator Analysis Log
                      </h4>
                      <p className="text-gray-400 font-body text-sm leading-relaxed">
                        {selected.verdict?.reason || "No reasoning recorded."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
