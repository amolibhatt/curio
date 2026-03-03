import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, BookOpen, Heart } from "lucide-react";

export default function Login({ onLogin, error, isLoading }: { onLogin: (name: string) => void; error?: string; isLoading?: boolean }) {
  const [name, setName] = useState("");

  const isInvite = window.location.pathname.startsWith("/invite/");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="flex-1 bg-[#FAF9F7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 flex items-center justify-center mb-6 bg-[#EDEAE6] rounded-2xl shadow-sm">
             <BookOpen className="w-10 h-10 text-[#8B7E74]" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1C1C1C]">Curio</h1>
          <p className="text-[#909090] text-lg font-serif italic max-w-[250px] mx-auto leading-relaxed">
            {isInvite ? "You've been invited." : "A shared space for two curious hearts."}
          </p>
          {isInvite && (
            <div className="flex items-center justify-center gap-1.5 text-[#909090] animate-in fade-in duration-1000">
              <Heart className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Your partner is waiting</span>
            </div>
          )}
        </div>

        <div className="pt-8 pb-8 px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input 
                placeholder="What's your name?"
                className="h-14 rounded-2xl px-6 bg-white border-none focus-visible:ring-black/5 focus-visible:border-black/5 text-base text-center placeholder:text-center shadow-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                data-testid="input-name"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-[#B86A6A] text-sm text-center" data-testid="text-error">{error}</p>
            )}

            <Button 
              type="submit"
              disabled={!name.trim() || name.trim().length < 2 || isLoading}
              className="w-full h-14 text-base font-medium rounded-2xl justify-center gap-2 px-6 bg-[#1C1C1C] hover:bg-black text-white shadow-none transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              data-testid="button-submit"
            >
              {isLoading ? "Entering..." : "Enter"}
              <ArrowRight className={`w-5 h-5 opacity-70 ${isLoading ? 'animate-pulse' : ''}`} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
