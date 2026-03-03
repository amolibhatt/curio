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
            {!hasFriendJoined && inviteCode && (
              <Button 
                variant="ghost" 
                onClick={handleShareLink}
                className={`rounded-full h-9 px-3.5 flex items-center gap-1.5 transition-all mr-0.5 ${copied ? 'text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800' : 'text-[#737373] hover:text-black hover:bg-black/5'}`}
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
            <div className="flex items-center gap-2.5 pl-2 pr-1">
              <span className="text-[11px] md:text-xs font-semibold text-[#1C1C1C] max-w-[80px] md:max-w-[120px] truncate">{user.name}</span>
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto w-full h-full pb-[calc(5rem+env(safe-area-inset-bottom,0px))] relative">
          <div className="w-full px-4 md:px-5 h-full flex flex-col">
            {children}
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-center z-50 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 px-4">
          <div className="bg-white/90 backdrop-blur-xl flex items-center justify-center gap-2 p-1.5 rounded-[2rem] w-max px-3 shadow-sm">
            <Link href="/">
              <Button variant="ghost" size="icon" className={`rounded-full w-12 h-12 transition-all ${location === "/" || location.startsWith("/invite") ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90 hover:text-white" : "text-[#909090] hover:text-black hover:bg-black/5"}`}>
                <Compass className="w-[22px] h-[22px]" strokeWidth={location === "/" ? 2 : 1.5} />
              </Button>
            </Link>
            <Link href="/archive">
              <Button variant="ghost" size="icon" className={`rounded-full w-12 h-12 transition-all ${location === "/archive" ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90 hover:text-white" : "text-[#909090] hover:text-black hover:bg-black/5"}`}>
                <History className="w-[22px] h-[22px]" strokeWidth={location === "/archive" ? 2 : 1.5} />
              </Button>
            </Link>
            <Link href="/us">
              <Button variant="ghost" size="icon" className={`rounded-full w-12 h-12 transition-all ${location === "/us" ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90 hover:text-white" : "text-[#909090] hover:text-black hover:bg-black/5"}`}>
                <Heart className={`w-[22px] h-[22px] ${location === "/us" ? "fill-white" : ""}`} strokeWidth={location === "/us" ? 2 : 1.5} />
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
