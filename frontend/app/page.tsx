"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Zap, Brain, Terminal, Joystick, Cpu, Sparkles } from "lucide-react";
import Lenis from "lenis";
import PixelArena from "@/components/PixelArena";
import AnimatedButton from "@/components/AnimatedButton";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  return (
    <div className="relative">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center flex-col gap-6"
          >
            <div className="w-16 h-16 border-4 border-white border-t-indigo-600 animate-spin flex items-center justify-center">
              <div className="w-4 h-4 bg-white animate-pulse" />
            </div>
            <p className="font-pixel text-[10px] text-white animate-pulse uppercase tracking-[0.5em]">Initializing Showdown...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Centered */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
        <PixelArena />
        
        <div className="max-w-5xl text-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center bg-indigo-600 border-4 border-black px-4 py-2 mb-12 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_#000] hover:-translate-x-0.5 transition-all"
          >
            <Terminal className="w-4 h-4 mr-3 text-white" />
            <span className="font-silk text-[10px] text-white uppercase tracking-[0.3em]">
              Protocol: SYNTAX_V2.0.4
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-pixel text-4xl md:text-8xl mb-8 leading-tight text-white uppercase tracking-tighter"
          >
            Witness the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 bg-[length:200%_auto] animate-shimmer drop-shadow-[6px_6px_0_rgba(0,0,0,1)]">Ultimate</span> <br/>
            <span className="text-white drop-shadow-[6px_6px_0_rgba(0,0,0,1)]">AI Showdown</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-body text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed text-lg tracking-wide uppercase font-medium"
          >
            Precision Logical Warfare. Multi-Agent Orchestration. <br/> 
            Powered by LangGraph & Distributed Voxel Intelligence.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <Link href="/arena">
              <AnimatedButton className="scale-125">
                Start Debate
              </AnimatedButton>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-12 left-1/2 -track-x-1/2 flex flex-col items-center gap-4"
        >
          <div className="w-[20px] h-[34px] border-2 border-white/20 rounded-none items-start flex p-1">
             <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-full h-2 bg-indigo-500" 
             />
          </div>
          <span className="font-silk text-[8px] text-gray-500 uppercase tracking-widest">Deploy Subsystems</span>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-8 py-40 grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
        {[
          { icon: <Brain className="w-12 h-12 text-indigo-400" />, title: "Voxel Reasoning", desc: "Agent-based logical structures with deep semantic understanding.", color: "indigo" },
          { icon: <Sparkles className="w-12 h-12 text-cyan-400" />, title: "Hyper-Streaming", desc: "Global distribution of debate tokens via real-time SSE protocols.", color: "cyan" },
          { icon: <Cpu className="w-12 h-12 text-purple-400" />, title: "Logic Adjudication", desc: "Impartial judge nodes utilizing cross-model verification systems.", color: "purple" },
        ].map((feat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -15, rotateX: 5, rotateY: -5 }}
            className="p-12 bg-gray-900 border-4 border-black shadow-[10px_10px_0_0_rgba(0,0,0,1)] group cursor-crosshair transform-gpu transition-all"
          >
            <div className={`mb-10 w-20 h-20 bg-gray-800 border-4 border-black flex items-center justify-center shadow-[6px_6px_0_0_#000] group-hover:bg-indigo-600 transition-colors`}>
              {feat.icon}
            </div>
            <h3 className="font-pixel text-xl font-bold mb-6 uppercase tracking-widest text-white leading-none">{feat.title}</h3>
            <p className="text-gray-500 font-body text-md leading-relaxed uppercase tracking-tight">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 border-y-8 border-black py-32 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] pixel-grid"></div>
        <div className="relative z-10">
          <h2 className="font-pixel text-3xl md:text-6xl text-white mb-12 uppercase drop-shadow-[5px_5px_0_#000]">
            COMMAND YOUR <br/> INTELLIGENCE
          </h2>
          <Link href="/dashboard">
            <AnimatedButton variant="secondary" className="scale-150">
              Launch Dashboard
            </AnimatedButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
