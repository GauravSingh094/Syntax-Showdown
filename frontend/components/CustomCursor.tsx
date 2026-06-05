"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [visible, setVisible] = useState(false);

  // Outer ring — laggy spring for smooth delay follow
  const outerX = useSpring(mouseX, { stiffness: 90,  damping: 22, mass: 0.5 });
  const outerY = useSpring(mouseY, { stiffness: 90,  damping: 22, mass: 0.5 });

  // Inner dot — fast spring
  const innerX = useSpring(mouseX, { stiffness: 700, damping: 32 });
  const innerY = useSpring(mouseY, { stiffness: 700, damping: 32 });

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) return;

    const INTERACTIVE = "a, button, input, select, textarea, [data-cursor-hover], [role='button'], label, select option";

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setVisible(true);
    };
    const onLeave  = () => setVisible(false);
    const onEnter  = () => setVisible(true);
    const onDown   = () => setClicked(true);
    const onUp     = () => setClicked(false);

    const onHoverIn  = (e: MouseEvent) => {
      if ((e.target as Element)?.closest(INTERACTIVE)) setHovered(true);
    };
    const onHoverOut = (e: MouseEvent) => {
      if ((e.target as Element)?.closest(INTERACTIVE)) setHovered(false);
    };

    window.addEventListener("mousemove",  onMove,    { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseenter", onEnter);
    window.addEventListener("mousedown",  onDown);
    window.addEventListener("mouseup",    onUp);
    document.addEventListener("mouseover",  onHoverIn,  { passive: true });
    document.addEventListener("mouseout",   onHoverOut, { passive: true });

    return () => {
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("mousedown",  onDown);
      window.removeEventListener("mouseup",    onUp);
      document.removeEventListener("mouseover",  onHoverIn);
      document.removeEventListener("mouseout",   onHoverOut);
    };
  }, [mouseX, mouseY]);

  // Outer square ring size & style (Retro Voxel Crosshair)
  const outerSize = clicked ? 18 : hovered ? 46 : 28;
  const outerBorder = hovered
    ? "2px solid #22d3ee" // Cyan glowing border on hover
    : "2px solid #6366f1"; // Indigo border default
  const outerBg = hovered ? "rgba(99,102,241,0.15)" : "transparent";
  const rotation = hovered ? 45 : 0; // Rotates 45deg to form a diamond on hover!

  return (
    <div className="hidden md:block">
      {/* Outer lagging square */}
      <motion.div
        style={{
          x: outerX,
          y: outerY,
          translateX: "-50%",
          translateY: "-50%",
          width:  outerSize,
          height: outerSize,
          border: outerBorder,
          background: outerBg,
          rotate: rotation,
          borderRadius: "0px", // Strict retro square/pixel aesthetic
          opacity: visible ? 1 : 0,
        }}
        animate={{
          width: outerSize,
          height: outerSize,
          rotate: rotation,
          boxShadow: hovered ? "0 0 16px rgba(34,211,238,0.5)" : "none"
        }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
      />

      {/* Inner instant pixel dot */}
      <motion.div
        style={{
          x: innerX,
          y: innerY,
          translateX: "-50%",
          translateY: "-50%",
          width: clicked ? "4px" : "6px",
          height: clicked ? "4px" : "6px",
          borderRadius: "0px", // Strict retro square dot
          opacity: visible ? 1 : 0,
        }}
        animate={{
          width: clicked ? "4px" : "6px",
          height: clicked ? "4px" : "6px",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="fixed top-0 left-0 pointer-events-none z-[9999] bg-white mix-blend-difference"
      />
    </div>
  );
}
