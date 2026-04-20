import { ClerkProvider, SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs"
import "./globals.css"
import Link from "next/link"
import { Metadata } from "next"
import { Gamepad2, Globe, Cpu, MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Syntax Showdown | Pixel AI Debate Arena",
  description: "Witness the ultimate pixel-art AI showdown with multi-agent debates orchestrated by LangGraph.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-950 text-gray-100 min-h-screen font-body antialiased overflow-x-hidden selection:bg-indigo-500/30 crt-overlay pixel-grid">
          <header className="sticky top-0 z-50 flex items-center justify-between p-4 px-8 border-b-4 border-black bg-gray-900 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
            <Link href="/" className="font-silk text-2xl tracking-tighter flex items-center gap-3 hover:scale-105 transition-transform duration-75">
              <div className="p-1.5 bg-indigo-600 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Syntax Showdown
              </span>
            </Link>
            
            <nav className="flex items-center gap-8 font-silk text-xs tracking-widest uppercase">
              <Show when="signed-in">
                <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</Link>
                <Link href="/arena" className="hover:text-indigo-400 transition-colors">Arena</Link>
                <Link href="/history" className="hover:text-indigo-400 transition-colors">History</Link>
                <div className="border-2 border-black p-0.5 bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-none" } }} />
                </div>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal"><button className="pixel-button scale-75">Login</button></SignInButton>
              </Show>
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
