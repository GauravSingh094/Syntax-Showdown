"use client";
import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Terminal, Shield } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden select-none">
      {/* Background styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes crtSweep {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .crt-sweep-line {
          animation: crtSweep 6s linear infinite;
        }
      `}} />

      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-black to-gray-950 pointer-events-none" />

      {/* Moving scanline */}
      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.5)] crt-sweep-line pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="w-full max-w-md bg-gray-900 border-4 border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative z-10"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6 text-indigo-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 animate-pulse" />
            <span className="font-silk text-[8px] uppercase tracking-[0.2em] font-bold">SECURE_LOBBY // PORT_80</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            <span className="font-silk text-[6px] text-red-500 uppercase tracking-widest font-bold">AUTH_PENDING</span>
          </div>
        </div>

        {/* Clerk Widget Wrapping Container */}
        <div className="w-full bg-black/40 border-2 border-black p-2 mb-4">
          <SignIn
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                cardBox: "shadow-none rounded-none border-0 bg-transparent",
                card: "bg-transparent shadow-none border-0 text-white",
                headerTitle: "font-pixel text-[10px] text-white uppercase tracking-wider font-bold mb-1",
                headerSubtitle: "font-mono text-[8px] text-gray-500 uppercase tracking-wide",
                socialButtonsBlockButton: "border-4 border-black bg-gray-800 text-white rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-indigo-600 transition-all font-mono text-[8px] uppercase tracking-wider h-10 cursor-pointer",
                socialButtonsBlockButtonText: "text-white font-bold",
                formButtonPrimary: "pixel-button w-full text-[9px] uppercase tracking-widest h-10 border-4 border-black bg-indigo-600 cursor-pointer font-bold",
                formFieldLabel: "font-silk text-[8px] text-gray-400 uppercase tracking-widest font-bold",
                formFieldInput: "bg-gray-950 border-2 border-black p-2 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-none",
                footerActionLink: "text-indigo-400 hover:text-indigo-300 font-mono text-[10px] tracking-wide",
                footerActionText: "text-gray-500 font-mono text-[10px]",
                identityPreviewText: "text-white",
                formResendCodeLink: "text-indigo-400",
                formFieldInputShowPasswordButton: "text-indigo-400 hover:text-indigo-300 cursor-pointer",
                dividerLine: "bg-black h-0.5",
                dividerText: "font-silk text-[8px] text-gray-600 uppercase tracking-widest mx-3",
              }
            }}
          />
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="font-silk text-[7px] text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
          >
            ❮ return to main_lobby
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
