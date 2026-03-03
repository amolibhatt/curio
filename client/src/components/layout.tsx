import { Link, useLocation } from "wouter";
import { BookOpen, UserPlus, LogOut, History, Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col font-sans relative">
      {/* Top Header */}
      <header className="flex items-center justify-between p-4 md:p-6 md:px-12 md:py-8 pt-[max(env(safe-area-inset-top),1.5rem)] z-10 sticky top-0 bg-[#FBF9F6]/90 backdrop-blur-sm">
        <Link href="/">
          <div className="flex items-center gap-3 md:gap-4 cursor-pointer">
            <div className="bg-white w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-[0.8rem] md:rounded-[1rem] shadow-sm border border-black/[0.04]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-[22px] md:h-[22px]">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M12 2v20" />
              </svg>
            </div>
            <span className="font-serif text-[1.4rem] md:text-[1.6rem] text-black tracking-tight mt-1">Curio</span>
          </div>
        </Link>
        
        <div className="flex items-center">
          <Button variant="outline" className="rounded-full bg-white border-black/5 shadow-sm hover:bg-black/5 text-[10px] md:text-[11px] font-bold tracking-[0.15em] text-black/70 h-9 md:h-[2.75rem] px-4 md:px-5 flex items-center gap-2 transition-colors">
            <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2} />
            <span className="hidden sm:inline">INVITE</span>
            <span className="sm:hidden">ADD</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full h-[calc(100vh-80px)]">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 md:px-12 h-full flex flex-col pb-28 md:pb-12">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex items-center justify-center gap-2 p-1.5 rounded-[2rem] z-50 w-max px-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className={`rounded-full w-12 h-12 flex-1 transition-all ${location === "/" ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90 hover:text-white" : "text-[#909090] hover:text-black hover:bg-black/5"}`}>
            <Compass className="w-[22px] h-[22px]" strokeWidth={location === "/" ? 2 : 1.5} />
          </Button>
        </Link>
        <Link href="/archive">
          <Button variant="ghost" size="icon" className={`rounded-full w-12 h-12 flex-1 transition-all ${location === "/archive" ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90 hover:text-white" : "text-[#909090] hover:text-black hover:bg-black/5"}`}>
            <History className="w-[22px] h-[22px]" strokeWidth={location === "/archive" ? 2 : 1.5} />
          </Button>
        </Link>
      </nav>
    </div>
  );
}
