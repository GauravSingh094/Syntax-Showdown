"use client";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setIsDark(!isDark)}
      className="p-2 border-2 border-black bg-white dark:bg-gray-900 shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] transition-all flex items-center justify-center group"
    >
      {isDark ? (
        <Moon className="w-4 h-4 text-indigo-400 group-hover:-rotate-12 transition-transform" />
      ) : (
        <Sun className="w-4 h-4 text-yellow-600 group-hover:rotate-45 transition-transform" />
      )}
    </motion.button>
  );
}
