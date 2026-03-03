import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function Login({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState("");

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
          <div className="mx-auto w-20 h-20 bg-white flex items-center justify-center rounded-[1.5rem] shadow-sm border border-black/[0.04] mb-6">
             <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M12 2v20" />
              </svg>
          </div>
          <h1 className="text-5xl font-serif tracking-tight text-[#1C1C1C]">Curio</h1>
          <p className="text-[#909090] text-lg font-serif italic max-w-[250px] mx-auto leading-relaxed">Two minds. One private cabinet of curiosities.</p>
        </div>

        <Card className="border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-[#FAFAFA] pb-6 border-b border-black/[0.03]">
            <CardTitle className="text-xl font-serif text-center">Welcome to Curio</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-8 px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase ml-2">Your Name</label>
                <Input 
                  placeholder="What should we call you?"
                  className="h-14 rounded-[1.25rem] px-5 bg-[#FBF9F6] border-black/5 focus-visible:ring-black/20 focus-visible:border-black/20 text-base"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <Button 
                type="submit"
                disabled={!name.trim()}
                className="w-full h-14 text-base font-semibold rounded-[1.25rem] justify-between px-6 bg-[#1C1C1C] hover:bg-black text-white shadow-lg shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                Join Curio
                <ArrowRight className="w-5 h-5 opacity-70" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
