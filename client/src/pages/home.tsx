import { useState } from "react";
import { currentUser, friendUser, Fact } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle2 } from "lucide-react";

export default function Home({ facts, onAddFact }: { facts: Fact[], onAddFact: (text: string) => void }) {
  const [newFact, setNewFact] = useState("");
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFacts = facts.filter(f => f.date === todayStr);
  
  const myFactToday = todayFacts.find(f => f.authorId === currentUser.id);
  const friendFactToday = todayFacts.find(f => f.authorId === friendUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    onAddFact(newFact);
    setNewFact("");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Today's Exchange</h1>
        <p className="text-muted-foreground text-lg">
          {myFactToday && friendFactToday 
            ? "You both shared a fact today! Streak maintained 🔥" 
            : "Share a fact to keep the streak alive."}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Fact Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={currentUser.avatar} alt="You" className="w-10 h-10 rounded-full" />
            <h2 className="font-semibold text-lg">Your Fact</h2>
            {myFactToday && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
          </div>
          
          {myFactToday ? (
            <Card className="bg-primary text-primary-foreground border-transparent shadow-float rounded-2xl overflow-hidden relative group">
              <CardContent className="p-6 relative z-10">
                <p className="text-lg leading-relaxed font-medium">"{myFactToday.text}"</p>
                <div className="mt-4 text-primary-foreground/70 text-sm font-medium">Shared today</div>
              </CardContent>
              {/* Decorative background element */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-primary/30 bg-primary/5 rounded-2xl shadow-none">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea 
                    placeholder="Did you know that..." 
                    className="min-h-[120px] resize-none bg-background border-primary/20 focus-visible:ring-primary/50 text-base p-4 rounded-xl"
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                  />
                  <Button type="submit" className="w-full rounded-xl h-12 text-base font-semibold shadow-soft" disabled={!newFact.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Share Fact
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Friend's Fact Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={friendUser.avatar} alt={friendUser.name} className="w-10 h-10 rounded-full" />
            <h2 className="font-semibold text-lg">{friendUser.name}'s Fact</h2>
            {friendFactToday && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
          </div>
          
          {friendFactToday ? (
             <Card className="bg-accent text-accent-foreground border-transparent shadow-float rounded-2xl overflow-hidden relative">
             <CardContent className="p-6 relative z-10">
               <p className="text-lg leading-relaxed font-medium">"{friendFactToday.text}"</p>
               <div className="mt-4 text-accent-foreground/70 text-sm font-medium">Shared today</div>
             </CardContent>
             <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
           </Card>
          ) : (
            <Card className="bg-secondary/50 border-transparent rounded-2xl shadow-none flex flex-col items-center justify-center min-h-[200px] text-center p-6">
              <div className="w-16 h-16 mb-4 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-2xl opacity-50">⏳</span>
              </div>
              <p className="text-muted-foreground font-medium">Waiting for {friendUser.name} to share their fact...</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
