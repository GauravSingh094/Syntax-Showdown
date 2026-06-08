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

  // Live Timer State & Helpers
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDebating) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10);
    } else {
      // Keep final time or let it sit
    }
    return () => clearInterval(interval);
  }, [isDebating]);

  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
  };

  const renderSummary = (summary: any, bulletColor: string = "text-indigo-500") => {
    if (!summary) return <p className="text-gray-500">No summary available.</p>;
    const items = Array.isArray(summary)
      ? summary
      : typeof summary === "string"
      ? summary.split("\n").filter(Boolean)
      : [];
    return items.map((s: string, si: number) => (
      <div key={si} className="flex gap-2">
        <span className={bulletColor}>•</span> 
        <span>{s.replace(/^[-*•]\s*/, "")}</span>
      </div>
    ));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startDebate = async () => {
    if (!topic || !isLoaded) return;
    clear();
    setElapsedTime(0);
    setDebating(true);
    addMessage({
      id: `sys-init-${Date.now()}`,
      role: 'system',
      content: `CONNECTION ESTABLISHED... TARGET TOPIC: "${topic}"`,
      round: 0,
      provider: 'system',
      timestamp: new Date().toISOString()
    });

    try {
      const token = await getToken();
      if (!token) throw new Error("AUTH_FAILED: Please sign in to start a debate.");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://syntax-showdown.onrender.com';
      const response = await fetch(`${apiUrl}/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, rounds })
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 401 || status === 403) throw new Error("AUTH_EXPIRED: Session expired. Please sign in again.");
        if (status === 429) throw new Error("RATE_LIMIT: Too many requests. Please wait a moment and try again.");
        if (status === 422) throw new Error("INVALID_INPUT: Topic must be 3-250 characters.");
        if (status >= 500) throw new Error("SERVER_DOWN: Backend is starting up — please retry in 30 seconds. (Render cold start)");
        throw new Error(`SERVER_ERROR [${status}]: ${response.statusText}`);
      }

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            let data;
            try {
              data = JSON.parse(line.replace('data: ', ''));
            } catch {
              console.error("Failed to parse SSE event:", line);
              continue;
            }
            
            // Runtime Validation
            if (!data || typeof data !== "object") {
              console.error("Invalid event structure", data);
              continue;
            }
            if (data.content === undefined) {
              console.error("Message content missing", data);
              data.content = "Generating response...";
            }

            if (data.role === 'generating') {
               continue;
            }
            if (data.role === 'sides') {
               addMessage(data);
               continue;
            }
            if (data.role === 'judge_start') {
               addMessage({
                 id: data.id || `sys-judge-start-${Date.now()}`,
                 role: 'system',
                 content: "URGENT: ADJUDICATOR ENGAGED... CALCULATING VERDICT...",
                 round: data.round || rounds,
                 provider: data.provider || 'system',
                 timestamp: data.timestamp || new Date().toISOString()
               });
               continue;
            }
            if (data.role === 'done') {
               setDebating(false);
               break;
            }
            if (data.role === 'error') {
               addMessage(data);
               setDebating(false);
               break;
            }
            addMessage(data);
          }
        }
      }
    } catch (e: any) {
      let errorMsg = e.message || "UPLINK FAILURE";
      // Detect network/CORS errors from failed fetch
      if (e instanceof TypeError && e.message === "Failed to fetch") {
        errorMsg = "NETWORK ERROR: Cannot reach the server. It may be cold-starting — please retry in 30 seconds.";
      }
      addMessage({
        id: `err-catch-${Date.now()}`,
        role: 'error',
        content: errorMsg,
        round: 0,
        provider: 'system',
        timestamp: new Date().toISOString()
      });
      setDebating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 w-full h-auto lg:h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 overflow-y-auto lg:overflow-hidden">
      {/* Inline animations for sidebars */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes barPulse {
          0%, 100% { height: 4px; }
          50% { height: 48px; }
        }
        .animate-bar-pulse {
          animation: barPulse 0.8s ease-in-out infinite;
        }
      `}} />

      {/* LEFT SIDEBAR: Cyberpunk System Status HUD */}
      <div className="hidden lg:flex flex-col w-64 bg-gray-900 border-4 border-black p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] gap-4 overflow-hidden select-none">
        <h3 className="font-silk text-[10px] text-indigo-400 border-b-2 border-black pb-2 tracking-widest uppercase font-bold">SYSTEM HUB</h3>
        
        {/* Node logs */}
        <div className="flex-1 flex flex-col gap-3 font-mono text-[9px] text-gray-500 overflow-hidden mt-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>NODE_PRO: ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>NODE_OPP: ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span>NODE_JUDGE: STANDBY</span>
          </div>
          <div className="border-t-2 border-black my-2" />
          <div className="flex flex-col gap-1.5 font-mono text-[8px] text-indigo-400/80">
            <p className="animate-pulse">❯ RUNNING AGENT TELEMETRY...</p>
            <p>❯ MATRIX CONNECTED (OK)</p>
            <p>❯ SSE ENCODER READY</p>
            <p>❯ ZUSTAND STORE SYNCHRONIZED</p>
          </div>
        </div>

        {/* Animated equalizer bars */}
        <div className="h-20 border-4 border-black bg-gray-950 flex items-end justify-center gap-1.5 p-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="w-1.5 bg-indigo-500/80 animate-bar-pulse"
              style={{ 
                animationDelay: `${i * 0.08}s`,
                animationPlayState: isDebating ? 'running' : 'paused'
              }}
            />
          ))}
        </div>
      </div>

      {/* MIDDLE CONTAINER: Debate Panel (Exact design preserved) */}
      <div className="flex-1 flex flex-col overflow-visible lg:overflow-hidden w-full">
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

        {/* Debate response panel (Untouched rendering card logic) */}
        <div ref={scrollRef} className="flex-1 flex flex-col gap-8 overflow-y-visible lg:overflow-y-auto overscroll-contain touch-auto pb-12 relative z-20 pr-0 lg:pr-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent">
          <AnimatePresence>
            {messages.length === 0 && !isDebating && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center text-gray-700 flex-col gap-6">
                  <div className="w-24 h-24 border-4 border-black bg-gray-900 flex items-center justify-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                    <Joystick className="w-12 h-12 text-gray-800" />
                  </div>
                  <p className="font-pixel text-[10px] uppercase tracking-widest">Awaiting Command Input...</p>
               </motion.div>
            )}
            {messages.map((m, i) => {
              const sidesObj = m.role === 'sides' ? (typeof m.content === 'string' ? JSON.parse(m.content) : m.content) : null;
              const judgeObj = m.role === 'judge' ? (typeof m.content === 'string' ? JSON.parse(m.content) : m.content) : null;

              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: m.role === 'pro' ? -20 : m.role === 'opponent' ? 20 : 0, y: 10 }} 
                  animate={{ opacity: 1, x: 0, y: 0 }} 
                  className={`p-6 border-4 border-black relative transition-all duration-300 ${
                    m.role === 'pro' ? 'mr-auto w-full md:w-[85%] bg-indigo-900/20 shadow-[6px_6px_0_0_#4f46e5]' : 
                    m.role === 'opponent' ? 'ml-auto w-full md:w-[85%] bg-cyan-900/20 shadow-[6px_6px_0_0_#0891b2]' : 
                    m.role === 'judge' ? 'mx-auto w-full bg-gray-900 shadow-[8px_8px_0_0_#a855f7]' :
                    m.role === 'sides' ? 'mx-auto w-full max-w-2xl bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.2)]' :
                    m.role === 'error' ? 'mx-auto w-full max-w-xl bg-red-900/20 text-red-500 font-silk text-[10px] text-center' :
                    'mx-auto font-pixel text-[8px] text-gray-500 bg-black/40 px-6 py-2 border-2 border-black uppercase tracking-widest'
                  }`}
                >
                  {m.role === 'sides' && sidesObj ? (
                    <div className="flex flex-col items-center gap-6 py-4">
                      <div className="flex items-center gap-3 font-silk text-[10px] text-indigo-400 tracking-[0.3em] uppercase">
                        <Zap className="w-5 h-5 animate-pulse" /> Alignment Locked
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-8">
                        <div className="text-center p-4 bg-black/40 border-2 border-indigo-500/30">
                          <p className="font-silk text-[8px] text-indigo-400 mb-2 uppercase tracking-widest">In Favor / Pro</p>
                          <p className="font-body text-white text-lg">{sidesObj.pro}</p>
                        </div>
                        <div className="text-center p-4 bg-black/40 border-2 border-cyan-500/30">
                          <p className="font-silk text-[8px] text-cyan-400 mb-2 uppercase tracking-widest">In Opposition / Opponent</p>
                          <p className="font-body text-white text-lg">{sidesObj.opponent}</p>
                        </div>
                      </div>
                    </div>
                  ) : m.role === 'pro' || m.role === 'opponent' ? (
                     <>
                       <div className={`flex items-center gap-3 mb-4 ${m.role === 'opponent' ? 'flex-row-reverse' : ''}`}>
                         <div className={`p-1.5 border-2 border-black ${m.role === 'pro' ? 'bg-indigo-600' : 'bg-cyan-600'}`}>
                            <MessageSquare className="w-4 h-4 text-white" />
                         </div>
                         <span className="font-silk text-[10px] uppercase tracking-[0.2em] text-white">
                           {m.role} {m.round && `| PHASE ${m.round}`}
                         </span>
                       </div>
                       <div className="font-body text-gray-300 leading-relaxed text-sm md:text-base border-l-4 border-black/20 pl-4 space-y-3">
                         {!m.content || String(m.content).trim() === "" ? (
                           <p className="text-gray-500 animate-pulse font-silk text-[8px] uppercase tracking-widest">Generating response...</p>
                         ) : (
                           String(m.content).split('\n').map((line: string, li: number) => (
                             <p key={li} className={line.trim().startsWith('-') || line.trim().startsWith('*') ? 'list-item list-inside' : ''}>
                               {line.replace(/^[-*]\s*/, '')}
                             </p>
                           ))
                         )}
                       </div>
                     </>
                  ) : m.role === 'judge' && judgeObj ? (
                     <div className="flex flex-col items-center">
                        <div className="p-4 bg-purple-600 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-6">
                          <Award className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="font-pixel text-xl mb-8 uppercase tracking-tighter text-center">
                          Verdict: <span className={judgeObj.winner === 'Pro' ? 'text-indigo-400' : 'text-cyan-400'}>{judgeObj.winner} ASCENDANT</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-6 mb-8 font-silk text-[10px] uppercase">
                            {/* Summaries */}
                            <div className="bg-gray-950 border-4 border-black p-6 shadow-[3px_3px_0_0_#4f46e5]">
                              <h4 className="text-indigo-400 mb-4 tracking-widest flex items-center gap-2">PRO SUMMARY</h4>
                              <div className="text-gray-400 normal-case font-body text-xs space-y-2">
                                {renderSummary(judgeObj.pro_summary, "text-indigo-500")}
                              </div>
                            </div>
                            <div className="bg-gray-950 border-4 border-black p-6 shadow-[3px_3px_0_0_#0891b2]">
                              <h4 className="text-cyan-400 mb-4 tracking-widest flex items-center gap-2">OPPONENT SUMMARY</h4>
                              <div className="text-gray-400 normal-case font-body text-xs space-y-2">
                                {renderSummary(judgeObj.opponent_summary, "text-cyan-500")}
                              </div>
                            </div>
                        </div>
    
                        <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-6 mb-8 font-silk text-[10px] uppercase">
                          <div className="bg-gray-950 border-4 border-black p-6 shadow-[4px_4px_0_0_#4f46e5]">
                            <h4 className="text-indigo-400 mb-4 tracking-widest">PRO METRICS</h4>
                            {Object.entries(judgeObj.scores?.Pro || {}).map(([k, v]) => (
                              <div key={k} className="flex justify-between border-b-2 border-white/5 py-2">
                                <span>{k}:</span> <span>{v as number}/10</span>
                              </div>
                            ))}
                          </div>
                          <div className="bg-gray-950 border-4 border-black p-6 shadow-[4px_4px_0_0_#0891b2]">
                            <h4 className="text-cyan-400 mb-4 tracking-widest">OPPONENT METRICS</h4>
                            {Object.entries(judgeObj.scores?.Opponent || {}).map(([k, v]) => (
                              <div key={k} className="flex justify-between border-b-2 border-white/5 py-2">
                                <span>{k}:</span> <span>{v as number}/10</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-gray-950 border-4 border-black p-6 w-full">
                           <h4 className="font-silk text-[10px] text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-3">
                             <Scale className="w-4 h-4" /> ADJUDICATION LOG & KEY POINTS
                           </h4>
                           <p className="text-gray-400 text-sm font-body leading-relaxed">{judgeObj.reason}</p>
                        </div>
                     </div>
                  ) : m.role === 'error' ? (
                     <div className="flex items-center justify-center gap-3 text-red-500">
                       <ShieldAlert className="w-5 h-5" /> {m.content}
                     </div>
                  ) : (
                     m.content
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Cyberpunk Telemetry HUD + Live Stopwatch */}
      <div className="hidden lg:flex flex-col w-64 bg-gray-900 border-4 border-black p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] gap-4 overflow-hidden select-none">
        <h3 className="font-silk text-[10px] text-cyan-400 border-b-2 border-black pb-2 tracking-widest uppercase font-bold">TELEMETRY</h3>
        
        {/* Live Timer Stopwatch */}
        <div className="bg-black border-4 border-black p-4 flex flex-col items-center justify-center shadow-[inset_0_0_12px_rgba(0,0,0,0.85)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
          <span className="font-silk text-[7px] text-gray-600 uppercase tracking-[0.2em] mb-1.5 font-bold">ELAPSED TIME</span>
          <span className="font-mono text-2xl text-cyan-400 tracking-widest font-bold">
            {formatTime(elapsedTime)}
          </span>
        </div>

        {/* Dynamic Telemetry gauges */}
        <div className="flex-1 flex flex-col gap-4 font-mono text-[9px] text-gray-500 mt-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[8px] font-bold">
              <span>BANDWIDTH</span>
              <span className="text-cyan-400">{isDebating ? '94%' : '2%'}</span>
            </div>
            <div className="w-full bg-black h-3 border-2 border-black relative overflow-hidden">
              <div 
                className="bg-cyan-500 h-full transition-all duration-300"
                style={{ width: isDebating ? '94%' : '2%' }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[8px] font-bold">
              <span>NEURON LOAD</span>
              <span className="text-indigo-400">{isDebating ? '87%' : '5%'}</span>
            </div>
            <div className="w-full bg-black h-3 border-2 border-black relative overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: isDebating ? '87%' : '5%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
