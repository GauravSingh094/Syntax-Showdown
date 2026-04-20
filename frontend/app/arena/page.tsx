"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useDebateStore } from "@/store/debateStore";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Award, Zap, ShieldAlert, Terminal, MessageSquare, Scale, Joystick } from "lucide-react";

export default function ArenaPage() {
  const { getToken, isLoaded } = useAuth();
  const { messages, isDebating, setDebating, addMessage, clear } = useDebateStore();
  const [topic, setTopic] = useState("");
  const [rounds, setRounds] = useState(3);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startDebate = async () => {
    if (!topic || !isLoaded) return;
    clear();
    setDebating(true);
    addMessage({ type: 'system', content: `CONNECTION ESTABLISHED... TARGET TOPIC: "${topic}"` });

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, rounds })
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.type === 'done') {
               setDebating(false);
               break;
            }
            if (data.type === 'error') {
               addMessage({ type: 'error', content: data.content });
               setDebating(false);
               break;
            }
            addMessage(data);
          }
        }
      }
    } catch (e: any) {
      addMessage({ type: 'error', content: e.message || "UPLINK FAILURE" });
      setDebating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 h-[calc(100vh-100px)] flex flex-col">
      {/* Control Panel */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 bg-gray-900 border-4 border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative z-10">
        <div className="flex-1 relative">
          <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
          <input 
            type="text" 
            disabled={isDebating}
            placeholder="PROMPT TOPIC..." 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-gray-950 border-2 border-black pl-10 pr-4 py-2 font-silk text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 uppercase tracking-widest placeholder:text-gray-700"
          />
        </div>
        <div className="flex gap-4">
          <select 
            disabled={isDebating}
            value={rounds} 
            onChange={(e) => setRounds(Number(e.target.value))}
            className="bg-gray-950 border-2 border-black px-4 py-2 font-silk text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 uppercase"
          >
            {[1, 3, 5].map(r => <option key={r} value={r}>{r} ROUNDS</option>)}
          </select>
          <button 
            onClick={startDebate} 
            disabled={isDebating}
            className="pixel-button h-full py-0 px-6"
          >
            {isDebating ? <Loader2 className="w-5 h-5 animate-spin" /> : "START"}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 flex flex-col gap-8 overflow-y-auto pb-12 relative z-0 pr-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent">
        <AnimatePresence>
          {messages.length === 0 && !isDebating && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center text-gray-700 flex-col gap-6">
                <div className="w-24 h-24 border-4 border-black bg-gray-900 flex items-center justify-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                  <Joystick className="w-12 h-12 text-gray-800" />
                </div>
                <p className="font-pixel text-[10px] uppercase tracking-widest">Awaiting Command Input...</p>
             </motion.div>
          )}
          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: m.type === 'pro' ? -20 : m.type === 'opponent' ? 20 : 0, y: 10 }} 
              animate={{ opacity: 1, x: 0, y: 0 }} 
              className={`p-6 border-4 border-black relative ${
                m.type === 'pro' ? 'mr-auto w-full md:w-[85%] bg-indigo-900/20 shadow-[6px_6px_0_0_#4f46e5]' : 
                m.type === 'opponent' ? 'ml-auto w-full md:w-[85%] bg-cyan-900/20 shadow-[6px_6px_0_0_#0891b2] text-right' : 
                m.type === 'judge' ? 'mx-auto w-full bg-gray-900 shadow-[8px_8px_0_0_#a855f7]' :
                m.type === 'error' ? 'mx-auto w-full max-w-xl bg-red-900/20 text-red-500 font-silk text-[10px] text-center' :
                'mx-auto font-pixel text-[8px] text-gray-500 bg-black/40 px-6 py-2 border-2 border-black uppercase tracking-widest'
              }`}
            >
              {m.type === 'pro' || m.type === 'opponent' ? (
                 <>
                   <div className={`flex items-center gap-3 mb-4 ${m.type === 'opponent' ? 'flex-row-reverse' : ''}`}>
                     <div className={`p-1.5 border-2 border-black ${m.type === 'pro' ? 'bg-indigo-600' : 'bg-cyan-600'}`}>
                        <MessageSquare className="w-4 h-4 text-white" />
                     </div>
                     <span className="font-silk text-[10px] uppercase tracking-[0.2em] text-white">
                       {m.type} {m.round && `| PHASE ${m.round}`}
                     </span>
                   </div>
                   <div className="font-body text-gray-300 leading-relaxed text-sm md:text-base border-l-4 border-black/20 pl-4">
                     {m.content}
                   </div>
                 </>
              ) : m.type === 'judge' ? (
                 <div className="flex flex-col items-center">
                    <div className="p-4 bg-purple-600 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-6">
                      <Award className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="font-pixel text-xl mb-8 uppercase tracking-tighter">
                      Verdict: <span className={m.content.winner === 'Pro' ? 'text-indigo-400' : 'text-cyan-400'}>{m.content.winner} ASCENDANT</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-6 mb-8 font-silk text-[10px] uppercase">
                      <div className="bg-gray-950 border-4 border-black p-6 shadow-[4px_4px_0_0_#4f46e5]">
                        <h4 className="text-indigo-400 mb-4 tracking-widest">PRO METRICS</h4>
                        {Object.entries(m.content.scores.Pro).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b-2 border-white/5 py-2">
                            <span>{k}:</span> <span>{v as number}/10</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-950 border-4 border-black p-6 shadow-[4px_4px_0_0_#0891b2]">
                        <h4 className="text-cyan-400 mb-4 tracking-widest">OPPONENT METRICS</h4>
                        {Object.entries(m.content.scores.Opponent).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b-2 border-white/5 py-2">
                            <span>{k}:</span> <span>{v as number}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-950 border-4 border-black p-6 w-full">
                       <h4 className="font-silk text-[10px] text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-3">
                         <Scale className="w-4 h-4" /> ADJUDICATION LOG
                       </h4>
                       <p className="text-gray-400 text-sm font-body leading-relaxed">{m.content.reason}</p>
                    </div>
                 </div>
              ) : m.type === 'error' ? (
                 <div className="flex items-center justify-center gap-3 text-red-500">
                   <ShieldAlert className="w-5 h-5" /> {m.content}
                 </div>
              ) : (
                 m.content
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
