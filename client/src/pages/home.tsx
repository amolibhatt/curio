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

export default function Home({ facts, onAddFact }: { facts: Fact[], onAddFact: (text: string, categories: Category[]) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFact, setNewFact] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFacts = facts.filter(f => f.date === todayStr);
  const myFactToday = todayFacts.find(f => f.authorId === currentUser.id);

  // Calculate streak based on consecutive days where both users posted
  const getStreak = () => {
    let currentStreak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const factsOnDate = facts.filter(f => f.date === dateStr);
      const user1Posted = factsOnDate.some(f => f.authorId === 'user_1');
      const user2Posted = factsOnDate.some(f => f.authorId === 'user_2');
      
      if (user1Posted && user2Posted) {
        currentStreak++;
      } else if (i === 0) {
        // It's okay if today is not complete yet, streak doesn't break if today is missed (until tomorrow)
        continue;
      } else {
        // Streak is broken
        break;
      }
    }
    return currentStreak;
  };

  const streak = getStreak();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim() || selectedCategories.length === 0) return;
    onAddFact(newFact, selectedCategories);
    setNewFact("");
    setSelectedCategories([]);
    setIsAdding(false);
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
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
            Did you learn something <span className="italic text-[#4A4A4A]">new</span> today?
          </h1>
          <p className="text-[1.05rem] md:text-[1.15rem] text-[#909090] italic font-serif">
            Add it to our shared cabinet of curiosities.
          </p>
        </div>
      </header>

      {/* Main Action Card */}
      {myFactToday ? (
        <Card className="bg-white border border-black/[0.03] shadow-elevated rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex-1 flex flex-col mx-2 md:mx-0 relative">
          {/* Waiting animation background */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] opacity-50 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-60 animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
          
          <CardContent className="p-6 md:p-12 flex-1 flex flex-col justify-center items-center text-center relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50/80 text-green-600 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-soft animate-in slide-in-from-bottom-2 duration-500">
              <Clock className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <h2 className="font-serif text-xl md:text-2xl text-black mb-2 animate-in slide-in-from-bottom-3 duration-500 delay-100">Discovery Captured</h2>
            <p className="text-[#909090] text-sm md:text-base max-w-[250px] leading-relaxed animate-in slide-in-from-bottom-4 duration-500 delay-200">
              Your thought is safe in the archive. The reveal happens when {friendUser.name} adds theirs.
            </p>
          </CardContent>
        </Card>
      ) : !isAdding ? (
        <Card 
          className="bg-white border border-black/[0.03] shadow-soft hover:shadow-elevated rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex-1 flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] mx-2 md:mx-0"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setIsAdding(true);
          }}
        >
          <CardContent className="p-6 md:p-8 flex-1 flex flex-col justify-center items-center text-center group">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FAFAFA] rounded-full flex items-center justify-center mb-6 md:mb-10 transition-transform duration-500 group-hover:scale-110 group-hover:shadow-soft border border-black/[0.02]">
              <Plus className="w-8 h-8 md:w-10 md:h-10 text-[#1C1C1C]" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-2 md:space-y-3">
              <h2 className="font-serif text-[1.25rem] md:text-[1.4rem] text-[#1C1C1C]">Capture a Discovery</h2>
              <p className="text-[10px] md:text-[11px] font-bold tracking-[0.15em] text-[#909090] uppercase">
                Add to the collection
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-black/[0.03] shadow-elevated rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex-1 flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-500 mx-2 md:mx-0">
          <CardContent className="p-6 md:p-10 flex-1 flex flex-col relative overflow-y-auto">
            
            <form onSubmit={(e) => {
              if (navigator.vibrate) navigator.vibrate(50);
              handleSubmit(e);
            }} className="flex-1 flex flex-col min-h-max space-y-4">
              
              <div className="mb-4 md:mb-6 space-y-3 relative animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
                <div className="flex justify-between items-center w-full">
                  <p className="text-[10px] md:text-[11px] font-bold tracking-[0.15em] text-[#909090] uppercase">
                    SELECT CATEGORIES (1 OR MORE)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-start">
                  {CATEGORIES.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(20);
                        toggleCategory(name);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap active:scale-95 ${
                        selectedCategories.includes(name)
                          ? name === 'Us' 
                            ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-soft' 
                            : 'bg-black text-white border border-black shadow-soft'
                          : 'bg-[#FBF9F6] text-[#737373] border border-black/5 hover:bg-black/5 hover:shadow-sm'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${selectedCategories.includes(name) && name === 'Us' ? 'text-rose-500 fill-rose-500' : ''}`} />
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 relative animate-in fade-in duration-700 delay-200">
                <Textarea 
                  placeholder="Today I learned that..." 
                  className="w-full h-full min-h-[120px] md:min-h-[180px] resize-none bg-transparent border-none focus-visible:ring-0 text-xl md:text-2xl font-serif leading-relaxed placeholder:text-[#D0D0D0] p-0"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-black/[0.05] mt-auto animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-[#909090] hover:text-black font-semibold text-xs md:text-sm tracking-wide px-2 md:px-4 h-10 md:h-12 transition-colors"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-full px-6 md:px-8 h-10 md:h-12 bg-[#1C1C1C] text-white hover:bg-black font-semibold text-xs md:text-sm tracking-wide shadow-soft hover:shadow-elevated transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:shadow-soft" 
                  disabled={!newFact.trim() || selectedCategories.length === 0}
                >
                  <Send className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                  Share Discovery
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}