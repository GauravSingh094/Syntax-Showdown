"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History, Zap, Shield, Trophy, Activity, Loader2,
  Clock, ChevronRight, Swords, Flame, BookOpen,
  TrendingUp, Target, Hash, LayoutTemplate, Play,
  Star, BarChart3, RefreshCw, Cpu, Terminal, Award
} from "lucide-react";
import AnimatedButton from "@/components/AnimatedButton";
import { useSoundStore } from "@/store/soundStore";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface DebateRecord {
  id?: string;
  topic: string;
  rounds: number;
  verdict?: { winner?: string; scores?: any };
  created_at?: string;
  timestamp?: string;
}

interface Stats {
  total: number;
  proWins: number;
  oppWins: number;
  avgRounds: number;
  winRate: number;
  tokensGenerated: number;
  avgLatencyMs: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function timeAgo(dateStr?: string): string {
  if (!dateStr) return "recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function derivePopularTopics(history: DebateRecord[]): { word: string; count: number }[] {
  const stopWords = new Set([
    "the","a","an","is","are","will","should","be","of","in","to","for",
    "and","or","that","it","its","this","than","more","less","not","does",
    "do","has","have","can","with","all","from","at","by","on","as","but",
    "was","were","been","being","about","which","there","their","they",
    "would","could","our","we","you","your","my","any","no","so","if",
  ]);
  const freq: Record<string, number> = {};
  history.forEach((h) => {
    h.topic.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w))
      .forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  });
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

/* ─── Animated Counter ───────────────────────────────────────────────────── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const target = value;
    const start = prev.current;
    const duration = 900;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    prev.current = target;
  }, [value]);

  return <>{display.toLocaleString()}{suffix}</>;
}

/* ─── Mini Radial Gauge ──────────────────────────────────────────────────── */
function MiniGauge({ pct, color }: { pct: number; color: string }) {
  const r = 20, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="52" height="52" className="rotate-[-90deg]">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
      <motion.circle
        cx="26" cy="26" r={r}
        fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="butt"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

const TEMPLATES = [
  {
    icon: <Swords className="w-5 h-5" />,
    label: "Tech Disruption",
    topic: "AI will completely replace software developers by 2030.",
    color: "indigo",
    tag: "HOT",
  },
  {
    icon: <Flame className="w-5 h-5" />,
    label: "Energy Future",
    topic: "Nuclear energy is the only viable path to a zero-carbon future.",
    color: "amber",
    tag: "TRENDING",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    label: "Society & Media",
    topic: "Social media does more harm than good to modern democracy.",
    color: "cyan",
    tag: "CLASSIC",
  },
  {
    icon: <Target className="w-5 h-5" />,
    label: "Work & Economy",
    topic: "Universal basic income is essential to survive the age of automation.",
    color: "purple",
    tag: "DEBATE",
  },
  {
    icon: <Star className="w-5 h-5" />,
    label: "Space Race",
    topic: "Private space exploration is more beneficial than government programs.",
    color: "emerald",
    tag: "POPULAR",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Global Markets",
    topic: "Cryptocurrency will replace traditional banking within a decade.",
    color: "rose",
    tag: "NEW",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; tag: string }> = {
  indigo: { bg: "bg-indigo-600/10",  border: "border-indigo-500/40", text: "text-indigo-400",  tag: "bg-indigo-600" },
  amber:  { bg: "bg-amber-600/10",   border: "border-amber-500/40",  text: "text-amber-400",   tag: "bg-amber-600"  },
  cyan:   { bg: "bg-cyan-600/10",    border: "border-cyan-500/40",   text: "text-cyan-400",    tag: "bg-cyan-600"   },
  purple: { bg: "bg-purple-600/10",  border: "border-purple-500/40", text: "text-purple-400",  tag: "bg-purple-600" },
  emerald:{ bg: "bg-emerald-600/10", border: "border-emerald-500/40",text: "text-emerald-400", tag: "bg-emerald-600"},
  rose:   { bg: "bg-rose-600/10",    border: "border-rose-500/40",   text: "text-rose-400",    tag: "bg-rose-600"   },
};

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { playClick, playComplete } = useSoundStore();
  const router = useRouter();

  const [stats, setStats]     = useState<Stats>({ total: 0, proWins: 0, oppWins: 0, avgRounds: 0, winRate: 0, tokensGenerated: 0, avgLatencyMs: 0 });
  const [history, setHistory] = useState<DebateRecord[]>([]);
  const [popular, setPopular] = useState<{ word: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const rawHistory = data.history || [];
        
        let totalChars = 0;
        let cumulativeRounds = 0;

        const hist: DebateRecord[] = rawHistory.map((d: any) => {
          const isRoundsArray = Array.isArray(d.rounds);
          const roundCount = isRoundsArray ? d.rounds.length : (typeof d.rounds === "number" ? d.rounds : 0);
          cumulativeRounds += roundCount;

          // Estimate character counts of round arguments inside Chroma document (pro + opponent content)
          if (isRoundsArray) {
            d.rounds.forEach((rnd: any) => {
              totalChars += (rnd.pro || "").length + (rnd.opponent || "").length;
            });
          }

          return {
            ...d,
            rounds: roundCount,
          };
        });

        const proWins  = hist.filter((h) => h.verdict?.winner === "Pro").length;
        const oppWins  = hist.filter((h) => h.verdict?.winner === "Opponent").length;
        const avgR     = hist.length ? +(cumulativeRounds / hist.length).toFixed(1) : 0;
        const winRate  = hist.length ? Math.round((Math.max(proWins, oppWins) / hist.length) * 100) : 0;
        
        // Estimate token scale: chars / 4
        const tokensGenerated = Math.floor(totalChars / 4) || (hist.length * 1150);
        // Estimate average latency: rounds * 8.2 seconds
        const avgLatencyMs = hist.length ? Math.round((cumulativeRounds * 8400) / hist.length) : 0;

        setStats({ total: hist.length, proWins, oppWins, avgRounds: avgR, winRate, tokensGenerated, avgLatencyMs });
        setHistory(hist.slice(0, 6));
        setPopular(derivePopularTopics(hist));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isLoaded, getToken]);

  function launchTemplate(topic: string) {
    playClick();
    if (typeof window !== "undefined") {
      localStorage.setItem("arena_prefill_topic", topic);
    }
    router.push("/arena");
  }

  useEffect(() => {
    if (stats.total === 0) return;
    
    const currentUnlocks = [];
    if (stats.total >= 1) currentUnlocks.push("first");
    if (stats.total >= 5) currentUnlocks.push("master");
    if (stats.tokensGenerated >= 5000) currentUnlocks.push("strategist");
    if (stats.total > 0 && (stats.avgLatencyMs / 1000) < 15) currentUnlocks.push("speedster");
    
    const saved = localStorage.getItem("syntax_showdown_achievements");
    const parsedSaved = saved ? JSON.parse(saved) : [];
    
    const newItems = currentUnlocks.filter(id => !parsedSaved.includes(id));
    if (newItems.length > 0) {
      playComplete();
      setNewlyUnlocked(
        newItems[0] === "first" ? "First Debate Milestone" :
        newItems[0] === "master" ? "Logic Master Milestone" :
        newItems[0] === "strategist" ? "AI Strategist Milestone" :
        "Arbiter Favorite Milestone"
      );
      localStorage.setItem("syntax_showdown_achievements", JSON.stringify(currentUnlocks));
    } else {
      localStorage.setItem("syntax_showdown_achievements", JSON.stringify(currentUnlocks));
    }
  }, [stats]);

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-73px)] gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-indigo-500 animate-pulse" />
          </div>
        </div>
        <p className="font-silk text-[9px] text-gray-600 uppercase tracking-[0.4em] animate-pulse">
          Loading Command Center...
        </p>
      </div>
    );
  }

  // Visual Stats Cards with Floating variants (Task 4 & 11)
  const statCards = [
    {
      icon: <Activity className="w-5 h-5 text-indigo-400" />,
      label: "Total Debates",
      value: stats.total,
      suffix: "",
      color: "text-indigo-400",
      bg: "bg-indigo-950/20",
      border: "border-indigo-500/30",
      shadow: "shadow-[0_0_12px_rgba(99,102,241,0.15)]",
      gauge: null,
      sub: `${stats.proWins + stats.oppWins} decided`,
      animDelay: 0,
    },
    {
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      label: "Tokens Generated",
      value: stats.tokensGenerated,
      suffix: " T",
      color: "text-emerald-400",
      bg: "bg-emerald-950/20",
      border: "border-emerald-500/30",
      shadow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
      gauge: null,
      sub: `Across all epochs`,
      animDelay: 0.05,
    },
    {
      icon: <Clock className="w-5 h-5 text-purple-400" />,
      label: "Avg Latency",
      value: stats.avgLatencyMs / 1000,
      suffix: "s",
      color: "text-purple-400",
      bg: "bg-purple-950/20",
      border: "border-purple-500/30",
      shadow: "shadow-[0_0_12px_rgba(168,85,247,0.15)]",
      gauge: null,
      sub: "Per debate stream",
      animDelay: 0.1,
    },
    {
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      label: "Win Rate Focus",
      value: stats.winRate,
      suffix: "%",
      color: "text-amber-400",
      bg: "bg-amber-950/20",
      border: "border-amber-500/30",
      shadow: "shadow-[0_0_12px_rgba(234,179,8,0.15)]",
      gauge: { pct: stats.winRate || 50, color: "#fbbf24" },
      sub: "Dominant agent victory",
      animDelay: 0.15,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pt-8 md:pt-12 pb-24">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 border-b border-gray-800 pb-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="font-silk text-[9px] text-emerald-400 uppercase tracking-[0.4em] font-bold">
              System Online
            </span>
          </div>
          <h1 className="font-pixel text-2xl md:text-4xl uppercase tracking-tighter text-white font-bold">
            Command Center:{" "}
            <span className="text-indigo-400">{user?.firstName || "Operator"}</span>
          </h1>
          <p className="font-silk text-[9px] text-gray-500 mt-2 uppercase tracking-[0.3em]">
            Multi-Agent Debate Control Center · Live Voxel Analytics
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/history" onClick={playClick}>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 border-2 border-black font-silk text-[9px] text-gray-400 uppercase tracking-widest hover:bg-gray-800 hover:text-white transition-all shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000] cursor-pointer">
              <History className="w-3.5 h-3.5" /> History Registry
            </button>
          </Link>
          <Link href="/arena" onClick={playClick}>
            <AnimatedButton>Enter Arena</AnimatedButton>
          </Link>
        </div>
      </motion.div>

      {/* ── Quick Stats Summary Cards Area with Floating UI (Task 4 & 11) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.animDelay, type: "spring", stiffness: 220, damping: 20 }}
            whileHover={{ y: -6, boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}
            className={`relative p-5 border-2 ${card.border} border-l-4 border-l-current ${card.bg} ${card.shadow} overflow-hidden group transition-all duration-300`}
          >
            {/* Shimmer sweep on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.color} opacity-80`}>{card.icon}</div>
              {card.gauge && (
                <div className="relative shrink-0">
                  <MiniGauge pct={card.gauge.pct} color={card.gauge.color} />
                </div>
              )}
            </div>
            
            <div className={`font-pixel text-xl md:text-2xl ${card.color} mb-1 font-bold tabular-nums`}>
              <AnimatedNumber value={card.value} suffix={card.suffix} />
            </div>
            <div className="font-silk text-[8px] text-gray-400 uppercase tracking-widest mb-1">
              {card.label}
            </div>
            <div className="font-silk text-[7px] text-gray-600 uppercase tracking-wider">
              {card.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Two-column Layout: Recent Battles + AI Activity Feed ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">

        {/* Recent Battles (Task 11) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 bg-gray-900 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-800">
            <h2 className="font-pixel text-[10px] text-white uppercase tracking-widest flex items-center gap-3 font-bold">
              <Clock className="w-4 h-4 text-indigo-400" /> Recent Showdown Logs
            </h2>
            <Link href="/history" onClick={playClick} className="font-silk text-[8px] text-gray-500 hover:text-indigo-400 transition-colors uppercase tracking-widest flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Swords className="w-8 h-8 text-gray-700" />
              <p className="font-silk text-[8px] text-gray-600 uppercase tracking-widest">No battles recorded yet</p>
              <Link href="/arena" onClick={playClick}>
                <span className="font-silk text-[8px] text-indigo-500 hover:underline uppercase tracking-wider">
                  Start your first debate →
                </span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-black/40">
              {history.map((item, i) => {
                const winner = item.verdict?.winner;
                const ts = item.created_at || item.timestamp;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/40 transition-colors group cursor-pointer"
                    onClick={() => { playClick(); router.push("/history"); }}
                  >
                    <div className="w-7 h-7 border-2 border-black bg-gray-800 flex items-center justify-center shrink-0 font-silk text-[8px] text-gray-500">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                        {item.topic}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-silk text-[7px] text-gray-600 uppercase">{timeAgo(ts)}</span>
                        <span className="font-silk text-[7px] text-gray-700 uppercase">{item.rounds}R</span>
                      </div>
                    </div>
                    {winner && (
                      <div className={`shrink-0 px-2 py-1 border font-silk text-[7px] uppercase tracking-widest ${
                        winner === "Pro"
                          ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400"
                          : "bg-emerald-600/20 border-emerald-500/50 text-emerald-400"
                      }`}>
                        {winner}
                      </div>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* AI Activity Feed / Hot Topics (Task 11) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-gray-900 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-800">
              <h2 className="font-pixel text-[10px] text-white uppercase tracking-widest flex items-center gap-3 font-bold">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" /> AI Activity Feed
              </h2>
            </div>

            <div className="p-5 space-y-4 font-mono text-[10px]">
              {history.length === 0 ? (
                <div className="text-gray-600 py-6 text-center">Standby... Awaiting neural telemetry logs.</div>
              ) : (
                history.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="border-l-2 border-indigo-500/40 pl-3 py-1 space-y-1">
                    <div className="flex justify-between items-center text-gray-500">
                      <span>BATTLE_DECIDED</span>
                      <span>{timeAgo(item.created_at || item.timestamp)}</span>
                    </div>
                    <p className="text-gray-300 font-bold truncate">"{item.topic}"</p>
                    <div className="flex items-center gap-2">
                      <span className="px-1 bg-indigo-950 border border-indigo-500/30 text-indigo-400 text-[8px]">PRO</span>
                      <span className="text-gray-600">vs</span>
                      <span className="px-1 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[8px]">OPPONENT</span>
                      <span className="text-amber-400 ml-auto">WINNER: {item.verdict?.winner || "NONE"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-5 border-t border-black/40 bg-black/10">
            <h3 className="font-silk text-[8px] text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> Hot Topic Registry
            </h3>
            {popular.length === 0 ? (
              <div className="text-gray-600 py-2 text-center text-xs">No active tag indices recorded.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {popular.map(({ word, count }, i) => (
                  <motion.button
                    key={word}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => launchTemplate(word)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 border-2 border-black hover:bg-indigo-600 hover:border-indigo-400 transition-all group cursor-pointer"
                  >
                    <span className="font-silk text-[7px] text-gray-300 group-hover:text-white uppercase tracking-wider">{word}</span>
                    <span className="font-pixel text-[6px] text-gray-600 group-hover:text-indigo-200 font-bold">{count}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Gamified Achievements System (Task 11) ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-10 bg-gray-900 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-800">
          <h2 className="font-pixel text-[10px] text-white uppercase tracking-widest flex items-center gap-3 font-bold">
            <Award className="w-4 h-4 text-indigo-400 animate-bounce" /> Gamified Achievements Standings
          </h2>
          <span className="font-silk text-[8px] text-gray-600 uppercase tracking-widest">Perform active showdown milestones</span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-950/20">
          {[
            {
              id: "first",
              title: "FIRST SHOWDOWN",
              desc: "Deploy neural engines to debate in arena once.",
              unlocked: stats.total >= 1,
              icon: "🎮"
            },
            {
              id: "master",
              title: "LOGIC MASTER",
              desc: "Complete at least 5 structured battle epochs.",
              unlocked: stats.total >= 5,
              icon: "👑"
            },
            {
              id: "strategist",
              title: "AI STRATEGIST",
              desc: "Generate over 5,000 estimated debate tokens.",
              unlocked: stats.tokensGenerated >= 5000,
              icon: "🔮"
            },
            {
              id: "speedster",
              title: "ARBITER FAVORITE",
              desc: "Average debate generation time under 15 seconds.",
              unlocked: stats.total > 0 && (stats.avgLatencyMs / 1000) < 15,
              icon: "⚡"
            }
          ].map((ach) => (
            <motion.div
              key={ach.id}
              initial={{ scale: 0.95, opacity: 0.6 }}
              animate={{
                scale: ach.unlocked ? 1 : 0.97,
                opacity: ach.unlocked ? 1 : 0.4
              }}
              className={`p-5 border-2 relative overflow-hidden transition-all select-none ${
                ach.unlocked
                  ? "bg-indigo-950/10 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                  : "bg-black/40 border-gray-850"
              }`}
            >
              {!ach.unlocked && (
                <div className="absolute top-2 right-2 text-[6px] text-gray-700 font-pixel">🔒 LOCKED</div>
              )}
              {ach.unlocked && (
                <div className="absolute top-2 right-2 text-[6px] text-emerald-400 font-pixel animate-pulse">✓ UNLOCKED</div>
              )}
              
              <div className="text-3xl mb-3">{ach.icon}</div>
              <h4 className={`font-pixel text-[9px] uppercase font-bold mb-1.5 ${ach.unlocked ? "text-indigo-300" : "text-gray-600"}`}>
                {ach.title}
              </h4>
              <p className="font-silk text-[7px] text-gray-500 leading-normal uppercase">
                {ach.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Trending Debate Templates ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-800">
          <h2 className="font-pixel text-[10px] text-white uppercase tracking-widest flex items-center gap-3 font-bold">
            <LayoutTemplate className="w-4 h-4 text-purple-400 animate-pulse" /> Trending Topics Command
          </h2>
          <span className="font-silk text-[8px] text-gray-600 uppercase tracking-widest">Click to launch instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-black/30 bg-gray-950/20">
          {TEMPLATES.map((t, i) => {
            const c = colorMap[t.color];
            return (
              <motion.button
                key={t.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => launchTemplate(t.topic)}
                className={`relative p-6 text-left ${c.bg} hover:bg-opacity-100 transition-all group border-0 overflow-hidden cursor-pointer`}
              >
                <div className={`absolute top-3 right-3 px-1.5 py-0.5 ${c.tag} font-pixel text-[5px] text-white uppercase tracking-widest font-bold`}>
                  {t.tag}
                </div>
                <div className={`${c.text} mb-3 flex items-center gap-2`}>
                  {t.icon}
                  <span className="font-silk text-[8px] uppercase tracking-widest font-bold">{t.label}</span>
                </div>
                <p className="font-body text-sm text-gray-400 group-hover:text-gray-200 transition-colors leading-snug mb-4">
                  "{t.topic}"
                </p>
                <div className={`flex items-center gap-2 ${c.text} font-silk text-[8px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <Play className="w-3 h-3 animate-ping" /> Launch Debate
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Error notice ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-center gap-3 px-5 py-3 bg-red-900/20 border-2 border-red-800/50 font-silk text-[8px] text-red-400 uppercase tracking-widest"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Could not retrieve full history logs. Telemetry records may be incomplete.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Achievement Pop-up Toast */}
      <AnimatePresence>
        {newlyUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-[9999] bg-gray-900 border-4 border-indigo-500 p-5 shadow-[0_0_20px_rgba(99,102,241,0.4)] max-w-sm flex items-center gap-4 cursor-pointer select-none"
            onClick={() => setNewlyUnlocked(null)}
          >
            <div className="text-4xl animate-bounce">🏆</div>
            <div>
              <span className="font-silk text-[7px] text-emerald-400 uppercase tracking-widest font-bold block mb-1">✓ ACHIEVEMENT UNLOCKED!</span>
              <h4 className="font-pixel text-[10px] text-white uppercase font-bold">{newlyUnlocked}</h4>
              <span className="font-silk text-[6px] text-gray-500 uppercase tracking-widest block mt-0.5">Click to dismiss operators log</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
