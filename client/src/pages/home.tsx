import { useState } from "react";
import { currentUser, friendUser, Fact, Category } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Send, Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA } from "lucide-react";

const CATEGORIES: { name: Category; icon: React.ElementType }[] = [
  { name: 'History', icon: Globe },
  { name: 'Etymology', icon: BookA },
  { name: 'Science', icon: Microscope },
  { name: 'Space', icon: Telescope },
  { name: 'Art', icon: Palette },
  { name: 'Us', icon: Heart },
  { name: 'Random', icon: HelpCircle },
];

const PROMPTS = [
  "Tell me a piece of history that feels like fiction...",
  "What's a word with a wild origin story?",
  "Drop a mind-bending fact about the universe...",
  "What's something weird the human body does?",
  "Tell me about a strange animal adaptation...",
  "Share a memory of us that lives rent-free in your head..."
];

export default function Home({ facts, onAddFact }: { facts: Fact[], onAddFact: (text: string, category: Category) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFact, setNewFact] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Science');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFacts = facts.filter(f => f.date === todayStr);
  const myFactToday = todayFacts.find(f => f.authorId === currentUser.id);

  const streak = 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    onAddFact(newFact, selectedCategory);
    setNewFact("");
    setIsAdding(false);
  };

  const cyclePrompt = () => {
    setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto h-full flex flex-col pt-2 md:pt-8 pb-[max(env(safe-area-inset-bottom),5rem)] md:pb-4 gap-6 md:gap-10">
      {/* Header Section */}
      <header className="space-y-4 md:space-y-6 flex-shrink-0 px-2 md:px-0">
        <div className="inline-flex items-center gap-2 bg-[#1C1C1C] text-white px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-[11px] font-bold tracking-[0.1em]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-3.5 md:h-3.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {streak} DAY STREAK
        </div>
        
        <div className="space-y-1 md:space-y-3 pt-1 md:pt-2">
          <h1 className="text-[3rem] md:text-[4rem] leading-[1.1] font-serif text-[#1C1C1C] tracking-tight">
            Did you find a <span className="italic text-[#4A4A4A]">spark</span> today?
          </h1>
          <p className="text-[1.05rem] md:text-[1.15rem] text-[#909090] italic font-serif">
            Add something fascinating to our shared cabinet of curiosities.
          </p>
        </div>
      </header>

      {/* Main Action Card */}
      {myFactToday ? (
        <Card className="bg-white border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex-1 flex flex-col mx-2 md:mx-0">
          <CardContent className="p-6 md:p-12 flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50/50 text-green-600 rounded-full flex items-center justify-center mb-4 md:mb-6">
              <Clock className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <h2 className="font-serif text-xl md:text-2xl text-black mb-2">Spark Captured</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-[250px] leading-relaxed">
              Your thought is safe in the archive. The reveal happens when {friendUser.name} adds theirs.
            </p>
          </CardContent>
        </Card>
      ) : !isAdding ? (
        <Card 
          className="bg-white border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex-1 flex flex-col cursor-pointer transition-transform hover:scale-[1.005] active:scale-[0.98] mx-2 md:mx-0"
          onClick={() => setIsAdding(true)}
        >
          <CardContent className="p-6 md:p-8 flex-1 flex flex-col justify-center items-center text-center group">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FAFAFA] rounded-full flex items-center justify-center mb-6 md:mb-10 transition-transform group-hover:scale-105 border border-black/[0.02]">
              <Plus className="w-8 h-8 md:w-10 md:h-10 text-[#1C1C1C]" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-2 md:space-y-3">
              <h2 className="font-serif text-[1.25rem] md:text-[1.4rem] text-[#1C1C1C]">Capture a Spark</h2>
              <p className="text-[10px] md:text-[11px] font-bold tracking-[0.15em] text-[#909090] uppercase">
                Add to the collection
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex-1 flex flex-col animate-in zoom-in-95 duration-300 mx-2 md:mx-0">
          <CardContent className="p-6 md:p-10 flex-1 flex flex-col relative overflow-y-auto">
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-max space-y-4">
              
              <div className="mb-4 md:mb-6 space-y-3 relative">
                <div className="flex justify-between items-center w-full">
                  <p className="text-[10px] md:text-[11px] font-bold tracking-[0.15em] text-[#909090] uppercase">
                    SELECT A CATEGORY
                  </p>
                  <button 
                    type="button"
                    onClick={cyclePrompt}
                    className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold tracking-wider text-[#909090] hover:text-black transition-colors uppercase"
                  >
                    Need an idea?
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 justify-start">
                  {CATEGORIES.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedCategory(name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        selectedCategory === name 
                          ? name === 'Us' 
                            ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                            : 'bg-black text-white border border-black'
                          : 'bg-[#FBF9F6] text-[#737373] border border-black/5 hover:bg-black/5'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${selectedCategory === name && name === 'Us' ? 'text-rose-500 fill-rose-500' : ''}`} />
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea 
                placeholder={PROMPTS[promptIndex]} 
                className="flex-1 min-h-[120px] md:min-h-[180px] resize-none bg-transparent border-none focus-visible:ring-0 text-xl md:text-2xl font-serif leading-relaxed placeholder:text-[#D0D0D0] p-0"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                autoFocus
              />
              
              <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-black/[0.05] mt-auto">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-[#909090] hover:text-black font-semibold text-xs md:text-sm tracking-wide px-2 md:px-4 h-10 md:h-12"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-full px-6 md:px-8 h-10 md:h-12 bg-[#1C1C1C] text-white hover:bg-black font-semibold text-xs md:text-sm tracking-wide shadow-lg shadow-black/10" 
                  disabled={!newFact.trim()}
                >
                  <Send className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
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