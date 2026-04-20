"use client";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { History, Zap, Shield, Trophy, Activity, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState({ debates: 0, proWins: 0, oppWins: 0 });

  useEffect(() => {
    if (!isLoaded) return;
    setStats({ debates: 12, proWins: 7, oppWins: 5 });
  }, [isLoaded]);

  if (!isLoaded) return <div className="flex justify-center items-center h-[calc(100vh-73px)]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pt-12 md:pt-16">
      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
        <div className="text-center md:text-left">
          <h1 className="font-pixel text-2xl md:text-4xl uppercase tracking-tighter text-white mb-2">
            Welcome, <span className="text-indigo-400">{user?.firstName || "Debater"}</span>
          </h1>
          <p className="font-silk text-[10px] text-gray-500 uppercase tracking-widest leading-none">Rank: Novice Competitor</p>
        </div>
        <Link href="/arena" className="pixel-button scale-110 flex items-center gap-3">
          ENTER ARENA <Zap className="w-5 h-5 fill-current" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          { icon: <Activity className="w-8 h-8 text-purple-400" />, label: "Total Matches", value: stats.debates },
          { icon: <Trophy className="w-8 h-8 text-indigo-400" />, label: "Pro Victories", value: stats.proWins },
          { icon: <Trophy className="w-8 h-8 text-cyan-400" />, label: "Opponent Wins", value: stats.oppWins },
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-gray-900 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center justify-between group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
          >
             <div>
               <p className="font-pixel text-3xl text-white mb-2">{item.value}</p>
               <h3 className="font-silk text-[10px] text-gray-500 uppercase tracking-widest">{item.label}</h3>
             </div>
             <div className="p-3 bg-gray-800 border-2 border-black group-hover:scale-110 transition-transform">
               {item.icon}
             </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-gray-900 border-4 border-black shadow-[10px_10px_0_0_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-6 bg-gray-800 border-b-4 border-black flex items-center justify-between">
          <h2 className="font-pixel text-xs flex items-center gap-3 text-gray-200">
            <Activity className="w-4 h-4 text-indigo-500" /> Recent Sessions
          </h2>
          <Link href="/history" className="font-silk text-[8px] text-indigo-400 hover:underline uppercase tracking-widest">View All Files</Link>
        </div>
        <div className="p-12 text-center text-gray-500 font-body">
          <div className="w-20 h-20 border-4 border-black bg-gray-950 mx-auto mb-6 flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-800" />
          </div>
          <p className="text-sm uppercase tracking-widest font-silk mb-2">No recent anomalies detected.</p>
          <p className="text-xs text-gray-600">Your debate logs will appear here once you complete a match.</p>
        </div>
      </div>
    </div>
  );
}
