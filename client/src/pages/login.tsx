import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

import logoImg from "../assets/images/logo-av-book.png";

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
          <div className="mx-auto w-32 h-32 flex items-center justify-center mb-6 overflow-hidden">
             <img src={logoImg} alt="Logo" className="w-full h-full object-cover mix-blend-multiply" />
          </div>
          <h1 className="text-5xl font-serif tracking-tight text-[#1C1C1C]">Curio</h1>
          <p className="text-[#909090] text-lg font-serif italic max-w-[250px] mx-auto leading-relaxed">Two minds. One private cabinet of curiosities.</p>
        </div>

        <Card className="border-none shadow-none rounded-[2.5rem] overflow-hidden bg-transparent">
          <CardContent className="pt-8 pb-8 px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input 
                  placeholder="What should we call you?"
                  className="h-14 rounded-full px-6 bg-white border-none focus-visible:ring-black/10 focus-visible:border-black/10 text-base"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <Button 
                type="submit"
                disabled={!name.trim()}
                className="w-full h-14 text-base font-medium rounded-full justify-between px-6 bg-[#1C1C1C] hover:bg-black text-white shadow-none transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                Join
                <ArrowRight className="w-5 h-5 opacity-70" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
