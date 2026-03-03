import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Compass, History, Link as LinkIcon, Check, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

import { User } from "@/lib/mock-data";

export default function Layout({ children, user, hasFriendJoined = false, inviteCode, onLogout }: { children: React.ReactNode, user: User, hasFriendJoined?: boolean, inviteCode?: string, onLogout?: () => void }) {
  const [location] = useLocation();
  const [copied, setCopied] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location]);

  const handleLogout = () => {
    onLogout?.();
  };

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
    <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center font-sans">
      <div className="w-full min-h-screen flex flex-col relative overflow-hidden max-w-2xl mx-auto">
        
        <header className="flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-6 md:px-8 z-10 sticky top-0 bg-[#FBF9F6]/90 backdrop-blur-md shrink-0">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm">
                <BookOpen className="w-5 h-5 text-black" strokeWidth={1.5} />
              </div>
              <span className="font-serif text-[1.6rem] text-black tracking-tight mt-1">Curio</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-1.5 md:gap-3 bg-transparent px-1.5 py-1.5 rounded-[1.2rem] md:rounded-full">
            <div className={`flex items-center gap-2.5 pl-2 ${!hasFriendJoined ? 'pr-2 md:pr-3' : 'pr-1'}`}>
              <span className="text-[11px] md:text-xs font-semibold text-[#1C1C1C] max-w-[80px] md:max-w-[120px] truncate">{user.name}</span>
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden shrink-0 bg-white">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
            </div>
            
            {!hasFriendJoined && inviteCode && (
              <Button 
                variant="ghost" 
                onClick={handleShareLink}
                className={`rounded-full h-7 md:h-8 px-3 md:px-4 flex items-center gap-1.5 md:gap-2 transition-all mr-0.5 ${copied ? 'text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800' : 'text-[#737373] hover:text-black hover:bg-black/5'}`}
                data-testid="button-invite"
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
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="rounded-full h-7 w-7 md:h-8 md:w-8 p-0 text-[#909090] hover:text-black hover:bg-black/5"
              data-testid="button-logout"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
            </Button>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto w-full h-full pb-24 relative">
          <div className="w-full px-5 h-full flex flex-col">
            {children}
          </div>
        </main>

        <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl flex items-center justify-center gap-2 p-1.5 rounded-[2rem] z-50 w-max px-3 border-none">
          <Link href="/">
            <Button variant="ghost" size="icon" className={`rounded-full w-12 h-12 flex-1 transition-all ${location === "/" || location.startsWith("/invite") ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90 hover:text-white" : "text-[#909090] hover:text-black hover:bg-black/5"}`}>
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
