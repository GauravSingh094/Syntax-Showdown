"use client";
import { useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Zap, Brain, Scale, Terminal, Joystick, Cpu } from "lucide-react";
import Lenis from "lenis";
import PixelArena from "@/components/PixelArena";

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }, []);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
        <PixelArena />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "circOut" }}
          className="max-w-5xl text-center z-10"
        >
          <div className="inline-flex items-center bg-indigo-600 border-2 border-black px-4 py-1.5 mb-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <Terminal className="w-4 h-4 mr-2 text-white" />
            <span className="font-pixel text-[10px] text-white uppercase tracking-widest leading-none pt-1">
              Dual-Model Architecture v1.0
            </span>
          </div>

          <h1 className="font-pixel text-4xl md:text-7xl mb-8 leading-tight text-white uppercase tracking-tighter">
            Witness the <br/>
            <span className="text-indigo-500 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">Ultimate</span> <br/>
            <span className="text-cyan-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">AI Showdown</span>
          </h1>

          <p className="font-body text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed border-l-4 border-indigo-500 pl-6 text-left md:text-center md:border-l-0 md:pl-0">
            State-of-the-art multi-agent debates orchestrated by LangGraph. Mistral vs Mistral adjudication by Deepseek. All pixels. No fluff.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/dashboard" className="pixel-button scale-110 group flex items-center">
              Insert Coin to Start <Joystick className="w-5 h-5 ml-3 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 font-pixel text-[8px] text-gray-600 uppercase tracking-widest"
        >
          Scroll TO Explore
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-32 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
        {[
          { icon: <Brain className="w-10 h-10 text-indigo-400" />, title: "Agentic Logic", desc: "Complex argumentation logic handled by autonomous LLM agents.", color: "indigo" },
          { icon: <Zap className="w-10 h-10 text-cyan-400" />, title: "Live Streaming", desc: "Word-by-word streaming updates via Server-Sent Events (SSE).", color: "cyan" },
          { icon: <Cpu className="w-10 h-10 text-purple-400" />, title: "Model Fusion", desc: "Seamless switching between reasoning and judging models.", color: "purple" },
        ].map((feat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -10 }}
            className="p-10 bg-gray-900 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] transition-all"
          >
            <div className={`mb-8 p-4 bg-gray-800 border-2 border-black inline-block shadow-[4px_4px_0_0_rgba(0,0,0,1)]`}>
              {feat.icon}
            </div>
            <h3 className="font-silk text-lg font-bold mb-4 uppercase tracking-widest text-white">{feat.title}</h3>
            <p className="text-gray-500 font-body text-sm leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Mid-Page Callout */}
      <section className="bg-indigo-600 border-y-8 border-black py-20 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')]"></div>
        <motion.h2 
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          className="font-pixel text-3xl md:text-5xl text-white mb-8 relative z-10"
        >
          READY FOR THE NEXT ROUND?
        </motion.h2>
        <Link href="/arena" className="pixel-button bg-white text-black hover:bg-gray-200 border-black relative z-10">
          ENTER THE ARENA
        </Link>
      </section>
    </div>
  );
}
