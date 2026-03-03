import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Compass, History, Heart, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { User } from "@/lib/mock-data";

export default function Layout({ children, user, hasFriendJoined = false, inviteCode }: { children: React.ReactNode, user: User, hasFriendJoined?: boolean, inviteCode?: string }) {
  const [location] = useLocation();
  const [copied, setCopied] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location]);

  const handleShareLink = async () => {
    if (!inviteCode) return;
    const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center font-sans">
      <div className="w-full min-h-screen flex flex-col relative overflow-hidden max-w-2xl mx-auto">
        
        <header className="flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-6 md:px-8 z-10 sticky top-0 bg-[#FAF9F7]/90 backdrop-blur-md shrink-0">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-9 h-9 flex items-center justify-center bg-[#EDEAE6] rounded-xl">
                <BookOpen className="w-[18px] h-[18px] text-[#8B7E74]" strokeWidth={1.5} />
              </div>
              <span className="font-serif text-xl text-[#1C1C1C] tracking-tight">Curio</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-1.5">
            {!hasFriendJoined && inviteCode && (
              <Button 
                variant="ghost" 
                onClick={handleShareLink}
                className={`rounded-full h-9 px-3.5 flex items-center gap-1.5 transition-all ${copied ? 'text-[#1C1C1C] bg-black/5 hover:bg-black/10 hover:text-[#1C1C1C]' : 'text-[#909090] hover:text-black hover:bg-black/5'}`}
                data-testid="button-invite"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold tracking-[0.15em]">COPIED</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold tracking-[0.15em]">INVITE</span>
                  </>
                )}
              </Button>
            )}
            <div className="flex items-center gap-2 pl-1.5">
              <span className="text-[11px] font-semibold text-[#909090] max-w-[80px] truncate hidden md:block">{user.name}</span>
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white ring-2 ring-black/5">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto w-full h-full pb-[calc(5rem+env(safe-area-inset-bottom,0px))] relative">
          <div className="w-full px-3 md:px-5 h-full flex flex-col">
            {children}
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-center z-50 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 px-4">
          <div className="bg-white/95 backdrop-blur-xl flex items-center justify-center gap-1 p-1.5 rounded-2xl w-max px-2 shadow-lg shadow-black/5 border border-black/[0.03]">
            <Link href="/">
              <Button variant="ghost" size="icon" className={`rounded-xl w-12 h-11 transition-all ${location === "/" || location.startsWith("/invite") ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90 hover:text-white shadow-sm" : "text-[#909090] hover:text-black hover:bg-black/5"}`}>
                <Compass className="w-[20px] h-[20px]" strokeWidth={location === "/" ? 2 : 1.5} />
              </Button>
            </Link>
            <Link href="/archive">
              <Button variant="ghost" size="icon" className={`rounded-xl w-12 h-11 transition-all ${location === "/archive" ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90 hover:text-white shadow-sm" : "text-[#909090] hover:text-black hover:bg-black/5"}`}>
                <History className="w-[20px] h-[20px]" strokeWidth={location === "/archive" ? 2 : 1.5} />
              </Button>
            </Link>
            <Link href="/us">
              <Button variant="ghost" size="icon" className={`rounded-xl w-12 h-11 transition-all ${location === "/us" ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90 hover:text-white shadow-sm" : "text-[#909090] hover:text-black hover:bg-black/5"}`}>
                <Heart className={`w-[20px] h-[20px] ${location === "/us" ? "fill-white" : ""}`} strokeWidth={location === "/us" ? 2 : 1.5} />
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
