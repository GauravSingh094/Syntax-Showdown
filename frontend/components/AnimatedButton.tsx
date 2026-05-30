"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary";
}

export default function AnimatedButton({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary" 
}: AnimatedButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    const x = (e.clientX - (left + width / 2)) * 0.15;
    const y = (e.clientY - (top + height / 2)) * 0.15;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseStyles = variant === "primary" 
    ? "bg-indigo-600 border-indigo-400" 
    : "bg-gray-800 border-gray-600";

  return (
    <motion.button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      onClick={onClick}
      className={`
        relative px-8 py-4 font-silk text-xs uppercase tracking-[0.2em] text-white
        border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]
        hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1
        active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5
        transition-shadow duration-75 ${baseStyles} ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}
