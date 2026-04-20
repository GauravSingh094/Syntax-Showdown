"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { History, Loader2, Award, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const { getToken, isLoaded } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    const fetchHistory = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setHistory(data.history || []);
      } catch (e) {
         console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [getToken, isLoaded]);

  if (loading) return <div className="flex justify-center items-center h-[calc(100vh-73px)]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-8 pt-16">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><History className="w-8 h-8 text-indigo-400" /></div>
        <h1 className="text-4xl font-bold tracking-tight">Your Debate History</h1>
      </div>

      <div className="grid gap-6">
        {history.length === 0 ? (
          <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
            <Zap className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No history yet</h3>
            <p className="text-gray-400">Jump into the arena to start your first debate.</p>
          </div>
        ) : (
          history.map((record: any, idx: number) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={idx} className="bg-gray-900 border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex justify-between items-start">
                 <h3 className="text-xl font-bold flex-1 pr-4">"{record.topic}"</h3>
                 <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${record.verdict?.winner === 'Pro' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
                   <Award className="w-3 h-3" /> {record.verdict?.winner} Won
                 </span>
              </div>
              
              <div className="text-gray-400 text-sm bg-gray-950 p-4 rounded-xl border border-white/5">
                <p className="font-semibold mb-2">Judge's Reasoning:</p>
                {record.verdict?.reason}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
