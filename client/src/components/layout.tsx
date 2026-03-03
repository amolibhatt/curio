import { Link } from "wouter";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between p-6 md:px-12 md:py-8 pt-[max(env(safe-area-inset-top),1.5rem)] z-10 sticky top-0">
        <Link href="/">
          <div className="flex items-center gap-4 cursor-pointer">
            <div className="bg-white w-12 h-12 flex items-center justify-center rounded-[1rem] shadow-sm border border-black/[0.04]">
              {/* Custom Book Icon matching the image closely */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M12 2v20" />
              </svg>
            </div>
            <span className="font-serif text-[1.6rem] text-black tracking-tight mt-1">Curio</span>
          </div>
        </Link>
        
        <div className="flex items-center">
          <Button variant="outline" className="rounded-full bg-white border-black/5 shadow-sm hover:bg-black/5 text-[11px] font-bold tracking-[0.15em] text-black/70 h-[2.75rem] px-5 flex items-center gap-2.5 transition-colors">
            <UserPlus className="w-4 h-4" strokeWidth={2} />
            INVITE
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-6 md:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
