import { useState } from "react";
import { currentUser, friendUser, Fact } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Send } from "lucide-react";

export default function Home({ facts, onAddFact }: { facts: Fact[], onAddFact: (text: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFact, setNewFact] = useState("");
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFacts = facts.filter(f => f.date === todayStr);
  const myFactToday = todayFacts.find(f => f.authorId === currentUser.id);

  const streak = 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    onAddFact(newFact);
    setNewFact("");
    setIsAdding(false);
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto mt-2 md:mt-8 flex flex-col gap-10">
      {/* Header Section */}
      <header className="space-y-6">
        <div className="inline-flex items-center gap-2 bg-[#1C1C1C] text-white px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.1em]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {streak} DAY STREAK
        </div>
        
        <div className="space-y-3 pt-2">
          <h1 className="text-[3.2rem] md:text-[4rem] leading-none font-serif text-[#1C1C1C] tracking-tight">
            Found a <span className="italic text-[#4A4A4A]">spark?</span>
          </h1>
          <p className="text-[1.15rem] text-[#909090] italic font-serif">
            Tell me something cool for our shared archive.
          </p>
        </div>
      </header>

      {/* Main Action Card */}
      {myFactToday ? (
        <Card className="bg-white border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden min-h-[380px] flex flex-col">
          <CardContent className="p-8 md:p-12 flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-green-50/50 text-green-600 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl text-black mb-2">Discovery Shared</h2>
            <p className="text-muted-foreground text-sm max-w-[250px] leading-relaxed">
              Your spark has been added to the archive. Waiting for {friendUser.name}...
            </p>
          </CardContent>
        </Card>
      ) : !isAdding ? (
        <Card 
          className="bg-white border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden min-h-[400px] flex flex-col cursor-pointer transition-transform hover:scale-[1.005] active:scale-[0.995]"
          onClick={() => setIsAdding(true)}
        >
          <CardContent className="p-8 flex-1 flex flex-col justify-center items-center text-center group">
            <div className="w-24 h-24 bg-[#FAFAFA] rounded-full flex items-center justify-center mb-10 transition-transform group-hover:scale-105">
              <Plus className="w-10 h-10 text-[#1C1C1C]" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-3">
              <h2 className="font-serif text-[1.4rem] text-[#1C1C1C]">Share a Discovery</h2>
              <p className="text-[11px] font-bold tracking-[0.15em] text-[#909090] uppercase">
                Keep our curiosity alive
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden min-h-[400px] flex flex-col animate-in zoom-in-95 duration-300">
          <CardContent className="p-8 md:p-10 flex-1 flex flex-col">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full space-y-4">
              <Textarea 
                placeholder="Type your discovery here..." 
                className="flex-1 min-h-[220px] resize-none bg-transparent border-none focus-visible:ring-0 text-2xl font-serif leading-relaxed placeholder:text-[#D0D0D0] p-0"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                autoFocus
              />
              <div className="flex items-center justify-between pt-6 border-t border-black/[0.05]">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-[#909090] hover:text-black font-semibold text-sm tracking-wide"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-full px-8 h-12 bg-[#1C1C1C] text-white hover:bg-black font-semibold text-sm tracking-wide shadow-lg shadow-black/10" 
                  disabled={!newFact.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Save to Archive
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
