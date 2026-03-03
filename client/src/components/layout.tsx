import { Link, useLocation } from "wouter";
import { BookOpen, UserPlus, LogOut, History, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentUser, friendUser } from "@/lib/mock-data";

export default function Layout({ children, onLogout, user }: { children: React.ReactNode, onLogout: () => void, user: typeof currentUser }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between p-6 md:p-8 pt-[max(env(safe-area-inset-top),1.5rem)] z-10 sticky top-0 bg-[#F8F7F4]/80 backdrop-blur-md">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-black/5">
              <BookOpen className="w-5 h-5 text-black" strokeWidth={1.5} />
            </div>
            <span className="font-serif text-2xl text-black tracking-tight">Curio</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" className="rounded-full bg-white border-transparent shadow-sm hover:bg-white/90 text-xs font-bold tracking-widest text-black/80 h-10 px-5 hidden sm:flex">
            <UserPlus className="w-4 h-4 mr-2" />
            INVITE
          </Button>
          <Button variant="outline" size="icon" className="rounded-full bg-white border-transparent shadow-sm hover:bg-white/90 sm:hidden">
            <UserPlus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5" onClick={onLogout}>
             <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-12 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full p-6 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav - Only show if not matching the exact screenshot, but keep for usability */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg border border-black/5 shadow-float flex items-center justify-center gap-2 p-2 rounded-full z-50">
        <Link href="/">
          <Button variant="ghost" size="icon" className={`rounded-full w-12 h-12 ${location === "/" ? "bg-black/5 text-black" : "text-muted-foreground"}`}>
            <Home className="w-5 h-5" strokeWidth={location === "/" ? 2 : 1.5} />
          </Button>
        </Link>
        <Link href="/archive">
          <Button variant="ghost" size="icon" className={`rounded-full w-12 h-12 ${location === "/archive" ? "bg-black/5 text-black" : "text-muted-foreground"}`}>
            <History className="w-5 h-5" strokeWidth={location === "/archive" ? 2 : 1.5} />
          </Button>
        </Link>
      </nav>
    </div>
  );
}
