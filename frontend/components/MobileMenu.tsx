"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Menu, X, Home, Trophy, Search, LayoutDashboard, PlayCircle, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSoundStore } from "@/store/soundStore";
import SoundToggle from "./SoundToggle";
import ThemeToggle from "./ThemeToggle";
import LoginButton from "./LoginButton";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();
  const { playClick } = useSoundStore();

  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMenu = () => {
    playClick();
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { href: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { href: "/leaderboard", label: "Leaderboard", icon: <Trophy className="w-4 h-4" /> },
  ];

  const authLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/arena", label: "Arena", icon: <PlayCircle className="w-4 h-4" /> },
    { href: "/history", label: "History", icon: <History className="w-4 h-4" /> },
    { href: "/search", label: "Search", icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <div className="md:hidden flex items-center z-[100]">
      {/* Hamburger Toggle Button */}
      <button
        onClick={toggleMenu}
        className="p-2 border-2 border-black bg-white dark:bg-gray-900 shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all flex items-center justify-center cursor-pointer text-gray-900 dark:text-white"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Slide-over Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-[76px] z-[99] bg-black/60 backdrop-blur-sm"
            onClick={toggleMenu}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 border-l-4 border-black p-6 flex flex-col justify-between shadow-[-4px_0_0_0_rgba(0,0,0,1)] select-none crt-overlay pixel-grid overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                {/* Section Header */}
                <div className="border-b-2 border-black pb-3">
                  <span className="font-silk text-[8px] text-indigo-400 uppercase tracking-widest font-bold">
                    Navigation Menu
                  </span>
                </div>

                {/* Nav Links */}
                <nav className="flex flex-col gap-4 font-silk text-xs tracking-widest uppercase">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={playClick}
                        className={`flex items-center gap-3 p-3 border-2 border-black hover:bg-indigo-650 hover:text-white transition-all shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] ${
                          isActive
                            ? "bg-indigo-600 text-white animate-pulse"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-150"
                        }`}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}

                  {isLoaded && userId && (
                    <>
                      {authLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={playClick}
                            className={`flex items-center gap-3 p-3 border-2 border-black hover:bg-indigo-650 hover:text-white transition-all shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] ${
                              isActive
                                ? "bg-indigo-600 text-white animate-pulse"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-150"
                            }`}
                          >
                            {link.icon}
                            <span>{link.label}</span>
                          </Link>
                        );
                      })}
                    </>
                  )}
                </nav>
              </div>

              {/* Drawer Footer Settings */}
              <div className="space-y-6 border-t-2 border-black pt-6 mt-6">
                <div className="flex items-center justify-between">
                  <span className="font-silk text-[8px] text-gray-500 uppercase tracking-widest font-bold">
                    Settings
                  </span>
                  {isLoaded && userId && (
                    <div className="border-2 border-black p-0.5 bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
                      <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-none", userButtonPopoverCard: "rounded-none border-4 border-black shadow-[8px_8px_0_0_#000]" } }} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <SoundToggle />
                  <ThemeToggle />
                  {isLoaded && !userId && (
                    <div className="flex-1 flex justify-end">
                      <LoginButton />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
