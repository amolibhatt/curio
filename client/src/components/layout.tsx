import { Link, useLocation } from "wouter";
import { BookOpen, UserPlus, LogOut, History, Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

import { currentUser } from "@/lib/mock-data";

export default function Layout({ children, user }: { children: React.ReactNode, user: typeof currentUser }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#E5E4DF] flex items-center justify-center md:py-8 font-sans">
      {/* Mobile Device Container */}
      <div className="w-full h-[100dvh] md:h-[844px] md:max-h-[calc(100vh-4rem)] md:w-[390px] bg-[#FBF9F6] flex flex-col relative md:rounded-[3rem] md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] md:border-8 border-[#1C1C1C] overflow-hidden md:ring-1 ring-black/5">
        
        {/* Top Header */}
        <header className="flex items-center justify-between p-5 pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-6 z-10 sticky top-0 bg-[#FBF9F6]/90 backdrop-blur-sm shrink-0">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="bg-white w-10 h-10 flex items-center justify-center rounded-[0.8rem] shadow-sm border border-black/[0.04]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  <path d="M12 2v20" />
                </svg>
              </div>
              <span className="font-serif text-[1.4rem] text-black tracking-tight mt-1">Curio</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold tracking-widest text-[#909090] uppercase leading-none">Signed in as</span>
              <span className="text-xs font-semibold text-[#1C1C1C] mt-1">{user.name}</span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-black/10 shrink-0">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover bg-white" />
            </div>
            <Button variant="outline" className="rounded-full bg-white border-black/5 shadow-sm hover:bg-black/5 text-[10px] font-bold tracking-[0.15em] text-black/70 h-9 px-4 flex items-center gap-2 transition-colors ml-1">
              <UserPlus className="w-3.5 h-3.5" strokeWidth={2} />
              <span>ADD</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full h-full pb-24 relative">
          <div className="w-full px-5 h-full flex flex-col">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex items-center justify-center gap-2 p-1.5 rounded-[2rem] z-50 w-max px-3">
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
    </div>
  );
}
