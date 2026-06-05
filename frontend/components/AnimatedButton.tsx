"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export default function AnimatedButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
}: AnimatedButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [magnet, setMagnet]   = useState({ x: 0, y: 0 });
  const [shimmer, setShimmer] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current || disabled) return;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    setMagnet({
      x: (e.clientX - (left + width  / 2)) * 0.18,
      y: (e.clientY - (top  + height / 2)) * 0.18,
    });
  };

  const handleMouseEnter = () => {
    setHovered(true);
    setShimmer(true);
    setTimeout(() => setShimmer(false), 600);
  };

  const handleMouseLeave = () => {
    setMagnet({ x: 0, y: 0 });
    setHovered(false);
  };

  const baseColors = {
    primary:   "bg-indigo-600 hover:bg-indigo-500 border-black",
    secondary: "bg-gray-800  hover:bg-gray-700  border-gray-600",
    danger:    "bg-red-700   hover:bg-red-600   border-black",
  };

  const sizes = {
    sm: "px-4 py-2   text-[9px]",
    md: "px-7 py-3.5 text-[10px]",
    lg: "px-10 py-5  text-xs",
  };

  const glowColor = {
    primary:   "rgba(99,102,241,0.5)",
    secondary: "rgba(255,255,255,0.15)",
    danger:    "rgba(239,68,68,0.5)",
  };

  return (
    <motion.button
      ref={btnRef}
      data-cursor-hover
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: magnet.x,
        y: magnet.y,
        boxShadow: hovered
          ? `4px 4px 0 0 rgba(0,0,0,1), 0 0 28px ${glowColor[variant]}`
          : "4px 4px 0 0 rgba(0,0,0,1)",
      }}
      whileTap={{ scale: 0.97, x: 2, y: 2 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.1 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden font-silk uppercase tracking-[0.2em] text-white
        border-4 transition-colors duration-150
        disabled:opacity-50 disabled:pointer-events-none
        ${baseColors[variant]} ${sizes[size]} ${className}
      `}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
        initial={{ x: "-120%" }}
        animate={{ x: shimmer ? "120%" : "-120%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Hover top-edge glow line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] bg-white/30 pointer-events-none"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
