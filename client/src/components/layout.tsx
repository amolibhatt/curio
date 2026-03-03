import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, History, LogOut, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentUser, friendUser, mockFacts, Fact } from "@/lib/mock-data";

// Simulated Auth State Context
export default function Layout({ children, onLogout, user }: { children: React.ReactNode, onLogout: () => void, user: typeof currentUser }) {
  const [location] = useLocation();
  const streak = 3; // Mock streak

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)] bg-card border-b border-border z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <Sparkles className="w-5 h-5" />
          DailyFact
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
            <Flame className="w-4 h-4" />
            {streak}
          </div>
          <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-secondary" />
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border h-screen sticky top-0">
        <div className="p-6 flex items-center gap-2 font-extrabold text-2xl text-primary">
          <Sparkles className="w-6 h-6" />
          DailyFact
        </div>
        
        <div className="px-6 mb-8">
          <div className="bg-orange-50 rounded-2xl p-4 flex items-center justify-between border border-orange-100 shadow-soft">
            <div>
              <p className="text-xs text-orange-600/80 font-medium uppercase tracking-wider">Current Streak</p>
              <p className="text-2xl font-bold text-orange-600 flex items-center gap-1">
                {streak} Days
              </p>
            </div>
            <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link href="/">
            <Button 
              variant={location === "/" ? "default" : "ghost"} 
              className={`w-full justify-start gap-3 rounded-xl h-12 text-base ${location !== "/" ? "text-muted-foreground hover:text-foreground" : ""}`}
            >
              <Home className="w-5 h-5" />
              Today's Facts
            </Button>
          </Link>
          <Link href="/archive">
            <Button 
              variant={location === "/archive" ? "default" : "ghost"} 
              className={`w-full justify-start gap-3 rounded-xl h-12 text-base ${location !== "/archive" ? "text-muted-foreground hover:text-foreground" : ""}`}
            >
              <History className="w-5 h-5" />
              Archive
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full bg-secondary border-2 border-background" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">Connected with {friendUser.name}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border flex items-center justify-around p-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] z-50">
        <Link href="/">
          <Button variant="ghost" size="icon" className={`rounded-xl w-14 h-14 ${location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <Home className="w-6 h-6" />
          </Button>
        </Link>
        <Link href="/archive">
          <Button variant="ghost" size="icon" className={`rounded-xl w-14 h-14 ${location === "/archive" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <History className="w-6 h-6" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="rounded-xl w-14 h-14 text-muted-foreground hover:text-destructive" onClick={onLogout}>
          <LogOut className="w-6 h-6" />
        </Button>
      </nav>
    </div>
  );
}
