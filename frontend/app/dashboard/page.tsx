"use client";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { History, Zap, Shield, Trophy, Activity, Loader2, Gauge, SwatchBook } from "lucide-react";
import AnimatedButton from "@/components/AnimatedButton";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [mode, setMode] = useState("classic");
  const [stats, setStats] = useState({ total: 0, proWins: 0, oppWins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const history = data.history || [];
        
        const proWins = history.filter((h: any) => h.verdict?.winner === 'Pro').length;
        const oppWins = history.filter((h: any) => h.verdict?.winner === 'Opponent').length;
        
        setStats({
          total: history.length,
          proWins,
          oppWins
        });
      } catch (e) {
        console.error("Stats fetch failed", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [isLoaded, getToken]);

  if (!isLoaded || loading) return <div className="flex justify-center items-center h-[calc(100vh-73px)]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pt-12 md:pt-16">
      <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-12">
        <div className="text-center md:text-left">
          <motion.h1 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="font-pixel text-2xl md:text-5xl uppercase tracking-tighter text-white mb-4"
          >
            Terminal: <span className="text-indigo-400">{user?.firstName || "Operator"}</span>
          </motion.h1>
          <p className="font-silk text-[10px] text-gray-500 uppercase tracking-[0.4em]">Subsystem Status: Online</p>
        </div>
        <div className="flex gap-4">
          <Link href="/arena">
            <AnimatedButton className="scale-110">
              UPLINK TO ARENA
            </AnimatedButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
        {[
          { label: "ACADEMIC", value: "Formal & Evidence based", id: "academic" },
          { label: "AGGRESSIVE", value: "High Intensity Debate", id: "aggressive" },
          { label: "FRIENDLY", value: "Collaborative Dialectics", id: "friendly" },
        ].map((m) => (
          <motion.div 
            key={m.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setMode(m.id)}
            className={`
              p-8 border-4 border-black cursor-pointer transition-all relative overflow-hidden
              ${mode === m.id ? 'bg-indigo-600 shadow-[8px_8px_0_0_#000]' : 'bg-gray-900 shadow-[4px_4px_0_0_#000] hover:bg-gray-800'}
            `}
          >
            <div className="flex justify-between items-start mb-4">
               <h3 className="font-pixel text-xs text-white">{m.label}</h3>
               {mode === m.id && <div className="w-3 h-3 bg-white animate-pulse shadow-[0_0_10px_#fff]" />}
            </div>
            <p className="font-silk text-[8px] text-white/60 tracking-widest leading-relaxed uppercase">{m.value}</p>
            {mode === m.id && <div className="absolute bottom-0 right-0 p-2 font-pixel text-[8px] text-white/20">ACTIVE</div>}
          </motion.div>
        ))}
      </div>

      <div className="bg-gray-900 border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-8 bg-gray-800 border-b-4 border-black flex items-center justify-between">
          <h2 className="font-pixel text-xs flex items-center gap-4 text-white uppercase tracking-widest">
            <Gauge className="w-5 h-5 text-indigo-500" /> Performance Metrics
          </h2>
          <div className="font-silk text-[8px] text-gray-500 uppercase tracking-widest">v2.0.4 - LIVE</div>
        </div>
        <div className="p-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { icon: <Activity />, label: "Matches", val: stats.total },
              { icon: <Shield />, label: "Security", val: "Optimal" },
              { icon: <Trophy />, label: "Pro Victories", val: stats.proWins },
              { icon: <Trophy />, label: "Opponent Wins", val: stats.oppWins },
            ].map((item, i) => (
               <div key={i} className="flex flex-col items-center">
                 <div className="w-12 h-12 border-2 border-black bg-gray-800 flex items-center justify-center mb-4 text-indigo-400 shadow-[4px_4px_0_0_#000]">
                    {item.icon}
                 </div>
                 <div className="font-pixel text-lg text-white mb-2">{item.val}</div>
                 <div className="font-silk text-[8px] text-gray-600 uppercase tracking-widest">{item.label}</div>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
