import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen } from "lucide-react";

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
    <div className="flex-1 bg-[#FBF9F6] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 flex items-center justify-center mb-6 bg-white rounded-full shadow-sm">
             <BookOpen className="w-10 h-10 text-black" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1C1C1C]">Curio</h1>
          <p className="text-[#909090] text-lg font-serif italic max-w-[250px] mx-auto leading-relaxed">
            {isInvite ? "You've been invited." : "A shared archive of curiosities for two."}
          </p>
        </div>

        <Card className="border-none shadow-none rounded-[2.5rem] overflow-hidden bg-transparent">
          <CardContent className="pt-8 pb-8 px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input 
                  placeholder="What's your name?"
                  className="h-14 rounded-full px-6 bg-white border-none focus-visible:ring-black/10 focus-visible:border-black/10 text-base text-center placeholder:text-center"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  data-testid="input-name"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-rose-500 text-sm text-center" data-testid="text-error">{error}</p>
              )}

              <Button 
                type="submit"
                disabled={!name.trim() || isLoading}
                className="w-full h-14 text-base font-medium rounded-full justify-between px-6 bg-[#1C1C1C] hover:bg-black text-white shadow-none transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                data-testid="button-submit"
              >
                {isLoading ? "Entering..." : "Enter"}
                <ArrowRight className={`w-5 h-5 opacity-70 ${isLoading ? 'animate-pulse' : ''}`} />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
