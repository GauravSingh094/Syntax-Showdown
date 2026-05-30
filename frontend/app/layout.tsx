import { ClerkProvider, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import "./globals.css"
import Link from "next/link"
import { Metadata } from "next"
import { Gamepad2, Globe, Cpu, MessageSquare, History } from "lucide-react"
import CustomCursor from "@/components/CustomCursor"
import ThemeToggle from "@/components/ThemeToggle"

import LoginButton from "@/components/LoginButton"

export const metadata: Metadata = {
  title: "Syntax Showdown | Pixel AI Debate Arena",
  description: "Witness the ultimate pixel-art AI showdown with multi-agent debates orchestrated by LangGraph.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-body antialiased overflow-x-hidden selection:bg-indigo-500/30 crt-overlay pixel-grid cursor-none">
          <CustomCursor />
          <header className="sticky top-0 z-50 w-full flex items-center justify-between p-4 px-4 md:px-8 border-b-4 border-black bg-white dark:bg-gray-900 shadow-[0_4px_0_0_rgba(0,0,0,1)] overflow-hidden">
            <Link href="/" className="font-silk text-lg md:text-2xl tracking-tighter flex items-center gap-2 md:gap-3 shrink-0 hover:scale-105 transition-transform duration-75">
              <div className="p-1 md:p-1.5 bg-indigo-600 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent truncate max-w-[120px] md:max-w-none">
                Syntax Showdown
              </span>
            </Link>
            
            <nav className="flex items-center gap-4 md:gap-8 font-silk text-[10px] md:text-xs tracking-widest uppercase ml-4">
              <Link href="/" className="hover:text-indigo-400 transition-colors hidden sm:block">Home</Link>
              
              {userId ? (
                <>
                  <Link href="/dashboard" className="hover:text-indigo-400 transition-colors hidden md:block">Dashboard</Link>
                  <Link href="/arena" className="hover:text-indigo-400 transition-colors">Arena</Link>
                  <Link href="/history" className="hover:text-indigo-400 transition-colors hidden sm:block">History</Link>
                  <div className="flex items-center gap-2 md:gap-4 ml-0 md:ml-2">
                    <ThemeToggle />
                    <div className="border-2 border-black p-0.5 bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
                      <UserButton appearance={{ elements: { avatarBox: "w-6 h-6 md:w-8 md:h-8 rounded-none", userButtonPopoverCard: "rounded-none border-4 border-black shadow-[8px_8px_0_0_#000]" } }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 md:gap-6">
                  <ThemeToggle />
                  <LoginButton />
                </div>
              )}
            </nav>
          </header>

          <main className="relative min-h-[calc(100vh-200px)]">
            {children}
          </main>

          <footer className="bg-gray-900 border-t-4 border-black p-12 mt-20 relative z-10 shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-2">
                <h3 className="font-pixel text-lg mb-6 text-indigo-400 uppercase tracking-widest">Syntax Showdown</h3>
                <p className="text-gray-400 font-body text-sm max-w-sm leading-relaxed">
                  The world's first multi-agent AI debate arena with 8-bit aesthetics. Built for the future of competitive cognition.
                </p>
              </div>
              <div>
                <h4 className="font-silk text-xs mb-6 uppercase tracking-[0.2em] text-white">Navigation</h4>
                <ul className="flex flex-col gap-4 text-sm text-gray-500 font-body uppercase tracking-wider">
                  <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><Link href="/arena" className="hover:text-white transition-colors">Arena</Link></li>
                  <li><Link href="/history" className="hover:text-white transition-colors">History</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-silk text-xs mb-6 uppercase tracking-[0.2em] text-white">Socials</h4>
                <div className="flex gap-4">
                  <a href="#" className="p-2 bg-gray-800 border-2 border-black hover:bg-indigo-600 transition-colors"><Cpu className="w-5 h-5" /></a>
                  <a href="#" className="p-2 bg-gray-800 border-2 border-black hover:bg-indigo-600 transition-colors"><Globe className="w-5 h-5" /></a>
                  <a href="#" className="p-2 bg-gray-800 border-2 border-black hover:bg-indigo-600 transition-colors"><MessageSquare className="w-5 h-5" /></a>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-12 pt-8 border-t-2 border-black flex flex-col md:row justify-between items-center text-[10px] font-pixel text-gray-600 uppercase tracking-tighter">
              <p>© 2026 Syntax Showdown - All pixels protected.</p>
              <p className="mt-4 md:mt-0">Made with ❤️ for AI Enthusiasts</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
