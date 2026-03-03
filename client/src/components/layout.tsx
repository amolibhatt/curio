import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, UserPlus, LogOut, History, Home, Compass, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { currentUser } from "@/lib/mock-data";

export default function Layout({ children, user }: { children: React.ReactNode, user: typeof currentUser }) {
  const [location] = useLocation();
  const [copied, setCopied] = useState(false);

  const handleShareLink = () => {
    const inviteLink = `${window.location.origin}/invite`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center font-sans">
      {/* Container - Full width and height with no borders */}
      <div className="w-full min-h-screen flex flex-col relative overflow-hidden max-w-2xl mx-auto">
        
        {/* Top Header */}
        <header className="flex items-center justify-between p-5 pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-6 md:px-8 z-10 sticky top-0 bg-[#FBF9F6]/90 backdrop-blur-sm shrink-0">
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
          
          <div className="flex items-center gap-1.5 md:gap-3 bg-white px-1.5 py-1.5 rounded-[1.2rem] md:rounded-full shadow-sm border border-black/[0.04]">
            <div className="flex items-center gap-2.5 pl-2 pr-2 md:pr-3 border-r border-black/[0.08]">
              <span className="text-[11px] md:text-xs font-semibold text-[#1C1C1C] max-w-[80px] md:max-w-[120px] truncate">{user.name}</span>
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-black/10 shrink-0 bg-white">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleShareLink}
              className={`rounded-full h-7 md:h-8 px-3 md:px-4 flex items-center gap-1.5 md:gap-2 transition-all mr-0.5 ${copied ? 'text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800' : 'text-[#737373] hover:text-black hover:bg-black/5'}`}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} />
                  <span className="text-[9px] md:text-[10px] font-bold tracking-[0.15em] hidden sm:inline-block">COPIED</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} />
                  <span className="text-[9px] md:text-[10px] font-bold tracking-[0.15em] hidden sm:inline-block">INVITE</span>
                </>
              )}
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
