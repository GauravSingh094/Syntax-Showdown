import { ClerkProvider, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import "./globals.css"
import Link from "next/link"
import { Metadata } from "next"
import { Gamepad2 } from "lucide-react"
import CustomCursor from "@/components/CustomCursor"
import ThemeToggle from "@/components/ThemeToggle"
import SoundToggle from "@/components/SoundToggle"
import LoginButton from "@/components/LoginButton"
import PageTransition from "@/components/PageTransition"
import MobileMenu from "@/components/MobileMenu"
import Footer from "@/components/Footer"

export const metadata: Metadata = {
  title: "Syntax Showdown | Pixel AI Debate Arena",
  description: "Witness the ultimate pixel-art AI showdown with multi-agent debates orchestrated by LangGraph.",
  keywords: ["AI Debate", "LangGraph", "FastAPI", "Next.js", "Tailwind CSS", "Portfolio", "ChromaDB", "LLM router"],
  openGraph: {
    title: "Syntax Showdown | Pixel AI Debate Arena",
    description: "Witness the ultimate pixel-art AI showdown with multi-agent debates orchestrated by LangGraph.",
    url: "https://syntaxshowdown.com",
    siteName: "Syntax Showdown",
    images: [
      {
        url: "/dashboard_mockup.png",
        width: 1200,
        height: 630,
        alt: "Syntax Showdown Cyber Deck UI Mockup",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Syntax Showdown | Pixel AI Debate Arena",
    description: "Witness the ultimate pixel-art AI showdown with multi-agent debates orchestrated by LangGraph.",
    images: ["/dashboard_mockup.png"],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-body antialiased overflow-x-hidden selection:bg-indigo-500/30 crt-overlay pixel-grid">
          <CustomCursor />

          <header className="sticky top-0 z-50 w-full flex items-center justify-between p-4 px-4 md:px-8 border-b-4 border-black bg-white dark:bg-gray-900 shadow-[0_4px_0_0_rgba(0,0,0,1)] overflow-hidden">
            {/* Scan sweep inside header */}
            <div className="scan-sweep opacity-30" />

            <Link href="/" className="font-silk text-lg md:text-2xl tracking-tighter flex items-center gap-2 md:gap-3 shrink-0 hover:scale-105 transition-transform duration-75" data-cursor-hover>
              <div className="p-1 md:p-1.5 bg-indigo-600 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent truncate max-w-[120px] md:max-w-none">
                Syntax Showdown
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 font-silk text-xs tracking-widest uppercase ml-4 select-none">
              <Link href="/" className="hover:text-indigo-400 transition-colors" data-cursor-hover>Home</Link>
              <Link href="/leaderboard" className="hover:text-indigo-400 transition-colors" data-cursor-hover>Leaderboard</Link>
              <Link href="/search" className="hover:text-indigo-400 transition-colors" data-cursor-hover>Search</Link>

              {userId ? (
                <>
                  <Link href="/dashboard" className="hover:text-indigo-400 transition-colors" data-cursor-hover>Dashboard</Link>
                  <Link href="/arena"     className="hover:text-indigo-400 transition-colors" data-cursor-hover>Arena</Link>
                  <Link href="/history"   className="hover:text-indigo-400 transition-colors" data-cursor-hover>History</Link>
                  <div className="flex items-center gap-4 ml-2">
                    <SoundToggle />
                    <ThemeToggle />
                    <div className="border-2 border-black p-0.5 bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
                      <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-none", userButtonPopoverCard: "rounded-none border-4 border-black shadow-[8px_8px_0_0_#000]" } }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-6">
                  <SoundToggle />
                  <ThemeToggle />
                  <LoginButton />
                </div>
              )}
            </nav>

            {/* Mobile Navigation */}
            <MobileMenu />
          </header>

          <main className="relative min-h-[calc(100vh-200px)]">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}
