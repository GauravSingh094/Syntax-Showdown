"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { History, Calendar, Award, ChevronRight, Loader2, Search, X, MessageSquare, Scale, Terminal } from "lucide-react";

export default function HistoryPage() {
  const { getToken, isLoaded } = useAuth();
  const [debates, setDebates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebate, setSelectedDebate] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    async function fetchHistory() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setDebates(data.history || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [isLoaded, getToken]);

  const filteredDebates = debates.filter(d => 
    d.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );


  if (loading) return <div className="flex justify-center items-center h-[calc(100vh-100px)]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pt-12">
      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-4">
        <h1 className="font-pixel text-2xl uppercase tracking-tighter flex items-center gap-4">
          <History className="w-8 h-8 text-indigo-500" /> Archives
        </h1>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
           <input 
            type="text" 
            placeholder="FILTER LOGS..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border-4 border-indigo-600/50 hover:border-indigo-500 px-10 py-3 font-silk text-[8px] uppercase tracking-widest text-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)] transition-all"
           />
           {searchQuery && (
             <button 
               onClick={() => setSearchQuery("")}
               className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition-colors"
             >
               <X className="w-4 h-4" />
             </button>
           )}

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredDebates.map((d, i) => (

          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedDebate(d)}
            className="bg-gray-950 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_0_#4f46e5] group cursor-pointer transition-all p-8 relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gray-900 border-2 border-black shadow-[4px_4px_0_0_#000] text-indigo-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h2 className="font-pixel text-xs text-white uppercase truncate max-w-[250px]">{d.topic}</h2>
            </div>
            <div className="flex justify-between items-center text-[10px] font-silk text-gray-500 uppercase tracking-widest">
               <span>Winner: <span className={d.verdict?.winner === 'Pro' ? 'text-indigo-400' : 'text-cyan-400'}>{d.verdict?.winner || "???"}</span></span>
               <div className="flex items-center gap-2 text-indigo-500 group-hover:translate-x-2 transition-transform">
                 REVIEW <ChevronRight className="w-4 h-4" />
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredDebates.length === 0 && !loading && (
        <div className="text-center py-32 opacity-20"><p className="font-pixel text-sm">NO RESULTS MATCH YOUR SEARCH</p></div>
      )}


      {/* Retro Modal for Detailed View */}
      <AnimatePresence>
        {selectedDebate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gray-900 border-8 border-black w-full max-w-4xl max-h-[85vh] flex flex-col shadow-[15px_15px_0_0_#000] overflow-hidden"
            >
              <div className="bg-gray-800 border-b-8 border-black p-6 flex justify-between items-center">
                <h3 className="font-pixel text-sm text-white uppercase tracking-widest truncate max-w-md">SESSION: {selectedDebate.topic}</h3>
                <button onClick={() => setSelectedDebate(null)} className="p-2 border-4 border-black bg-red-600 hover:bg-red-500 shadow-[4px_4px_0_0_#000] transition-all">
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-950 space-y-12 scrollbar-thin scrollbar-thumb-indigo-600">
                {/* Round by Round Feed */}
                {selectedDebate.rounds?.map((r: any, idx: number) => (

                  <div key={idx} className="space-y-6">
                    <div className="flex justify-center">
                       <div className="bg-black border-2 border-black px-6 py-2 font-pixel text-[8px] text-gray-500 uppercase tracking-[0.4em]">PHASE {r.round}</div>
                    </div>
                    {/* Pro Bubble */}
                    <div className="bg-indigo-900/10 border-l-8 border-indigo-600 p-6 shadow-[6px_6px_0_0_#000] md:w-[90%]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-4 h-4 bg-indigo-600" />
                        <span className="font-silk text-[10px] text-indigo-400 uppercase tracking-widest">TRANSMISSION: PRO</span>
                      </div>
                      <div className="text-gray-300 font-body leading-relaxed text-sm space-y-2">
                        {r.pro?.split('\n').map((line: string, li: number) => (
                           <p key={li} className={line.trim().startsWith('-') || line.trim().startsWith('*') ? 'list-item list-inside ml-2' : ''}>
                             {line.replace(/^[-*]\s*/, '')}
                           </p>
                        ))}
                      </div>
                    </div>
                    {/* Opponent Bubble */}
                    <div className="bg-cyan-900/10 border-r-8 border-cyan-600 p-6 shadow-[6px_6px_0_0_#000] ml-auto md:w-[90%]">
                      <div className="flex items-center gap-3 mb-3 flex-row-reverse">
                        <div className="w-4 h-4 bg-cyan-600" />
                        <span className="font-silk text-[10px] text-cyan-400 uppercase tracking-widest">TRANSMISSION: OPPONENT</span>
                      </div>
                      <div className="text-gray-300 font-body leading-relaxed text-sm space-y-2">
                        {r.opponent?.split('\n').map((line: string, li: number) => (
                           <p key={li} className={line.trim().startsWith('-') || line.trim().startsWith('*') ? 'list-item list-inside ml-2' : ''}>
                             {line.replace(/^[-*]\s*/, '')}
                           </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Summaries Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-gray-900 border-4 border-black p-6">
                     <h4 className="font-silk text-[10px] text-indigo-400 mb-4 uppercase">PRO SUMMARY</h4>
                     <div className="text-gray-400 text-xs font-body space-y-2">
                       {selectedDebate.verdict?.pro_summary?.split('\n').map((s: string, si: number) => (
                         <div key={si} className="flex gap-2"><span>•</span> {s.replace(/^[-*]\s*/, '')}</div>
                       ))}
                     </div>
                   </div>
                   <div className="bg-gray-900 border-4 border-black p-6">
                     <h4 className="font-silk text-[10px] text-cyan-400 mb-4 uppercase">OPPONENT SUMMARY</h4>
                     <div className="text-gray-400 text-xs font-body space-y-2">
                       {selectedDebate.verdict?.opponent_summary?.split('\n').map((s: string, si: number) => (
                         <div key={si} className="flex gap-2"><span>•</span> {s.replace(/^[-*]\s*/, '')}</div>
                       ))}
                     </div>
                   </div>
                </div>

                {/* Final Verdict */}
                <div className="bg-gray-900 border-8 border-black p-10 pt-16 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 border-4 border-black px-8 py-3 shadow-[6px_6px_0_0_#000]">
                    <Award className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="font-pixel text-2xl text-center mb-10 mt-6 uppercase">
                    ADJUDICATION: <span className={selectedDebate.verdict?.winner === 'Pro' ? 'text-indigo-400' : 'text-cyan-400'}>
                      {selectedDebate.verdict?.winner} ASCENDANT
                    </span>
                  </h3>
                  <div className="bg-black/50 border-4 border-black p-8">
                    <p className="font-silk text-[8px] text-gray-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3"><Scale className="w-4 h-4" /> JUDGING LOG & HIGHLIGHTS</p>
                    <p className="text-gray-400 font-body text-sm leading-relaxed">{selectedDebate.verdict?.reason}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
