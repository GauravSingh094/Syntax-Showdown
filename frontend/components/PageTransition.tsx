"use client";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 18,
    filter: "blur(4px)"
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
    }
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(2px)",
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
