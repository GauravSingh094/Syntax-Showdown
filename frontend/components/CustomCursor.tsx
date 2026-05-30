"use client";
import { useState, useRef, useEffect } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CustomCursor() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 700 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      // Use 12px offset for a 24px wide cursor
      mouseX.set(e.clientX - 12);
      mouseY.set(e.clientY - 12);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Outer Hollow Box */}
      <motion.div
        style={{
          translateX: cursorX,
          translateY: cursorY,
        }}
        className="fixed top-0 left-0 w-6 h-6 rounded-none border-2 border-indigo-500 pointer-events-none z-[9999] hidden md:block mix-blend-difference opacity-80"
      />
      {/* Inner Precise Dot */}
      <motion.div
        style={{
          translateX: cursorX,
          translateY: cursorY,
          x: 10, // Center dot (6px box, 2px dot -> (24-4)/2)
          y: 10,
        }}
        className="fixed top-0 left-0 w-1 h-1 bg-white pointer-events-none z-[9999] hidden md:block mix-blend-difference"
      />
    </>
  );
}
