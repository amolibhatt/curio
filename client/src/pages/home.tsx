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

  const streak = 0; // Matching the screenshot

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    onAddFact(newFact);
    setNewFact("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-xl mx-auto mt-4 md:mt-12">
      {/* Header Section */}
      <header className="space-y-6">
        <div className="inline-flex items-center gap-1.5 bg-[#1A1A1A] text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-widest">
          <Clock className="w-3.5 h-3.5" />
          {streak} DAY STREAK
        </div>
        
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-serif text-[#1A1A1A] tracking-tight">
            Found a <span className="italic text-black/70">spark?</span>
          </h1>
          <p className="text-lg text-[#737373] italic font-serif">
            Tell me something cool for our shared archive.
          </p>
        </div>
      </header>

      {/* Main Action Card */}
      {myFactToday ? (
        <Card className="bg-white border-transparent shadow-soft rounded-[2rem] overflow-hidden min-h-[320px] flex flex-col">
          <CardContent className="p-8 md:p-12 flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
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
          className="bg-white border-transparent shadow-soft rounded-[2rem] overflow-hidden min-h-[320px] flex flex-col cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
          onClick={() => setIsAdding(true)}
        >
          <CardContent className="p-8 flex-1 flex flex-col justify-center items-center text-center group">
            <div className="w-20 h-20 bg-[#F8F7F4] rounded-full flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
              <Plus className="w-8 h-8 text-[#1A1A1A]" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-black">Share a Discovery</h2>
              <p className="text-[11px] font-bold tracking-widest text-[#737373] uppercase">
                Keep our curiosity alive
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-transparent shadow-soft rounded-[2rem] overflow-hidden min-h-[320px] flex flex-col animate-in zoom-in-95 duration-300">
          <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full space-y-4">
              <Textarea 
                placeholder="Type your discovery here..." 
                className="flex-1 min-h-[180px] resize-none bg-transparent border-none focus-visible:ring-0 text-xl font-serif leading-relaxed placeholder:text-muted-foreground/50 p-0"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                autoFocus
              />
              <div className="flex items-center justify-between pt-4 border-t border-black/5">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-black"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-full px-6 bg-black text-white hover:bg-black/80" 
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
