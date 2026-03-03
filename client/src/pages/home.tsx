import { useState, useRef } from "react";
import { currentUser, friendUser, Fact, Category } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Send, Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, ImageIcon, X } from "lucide-react";

const CATEGORIES: { name: Category; icon: React.ElementType }[] = [
  { name: 'History', icon: Globe },
  { name: 'Etymology', icon: BookA },
  { name: 'Science', icon: Microscope },
  { name: 'Space', icon: Telescope },
  { name: 'Art', icon: Palette },
  { name: 'Us', icon: Heart },
  { name: 'Random', icon: HelpCircle },
];

export default function Home({ facts, onAddFact }: { facts: Fact[], onAddFact: (text: string, categories: Category[], imageUrl?: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFact, setNewFact] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    if (!newFact.trim() && !imageUrl) return;
    if (selectedCategories.length === 0) return;
    
    onAddFact(newFact, selectedCategories, imageUrl || undefined);
    setNewFact("");
    setSelectedCategories([]);
    setImageUrl(null);
    setIsAdding(false);
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
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
        <div className="fixed inset-0 z-50 bg-[#FBF9F6] flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
          
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col p-6 md:p-10 relative z-10 pt-safe mt-8 md:mt-12">
            <form onSubmit={(e) => {
              if (navigator.vibrate) navigator.vibrate(50);
              handleSubmit(e);
            }} className="flex-1 flex flex-col space-y-6 md:space-y-8">
              
              <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-700 delay-100">
                {imageUrl && (
                  <div className="relative mb-6 rounded-2xl overflow-hidden border border-black/5 shadow-soft max-h-[300px] flex-shrink-0 group">
                    <img src={imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setImageUrl(null)}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <Textarea 
                  placeholder={imageUrl ? "Add a caption..." : "Today I learned that (or paste an image)..."} 
                  className="flex-1 resize-none bg-transparent border-none focus-visible:ring-0 text-[1.75rem] md:text-[2.5rem] font-serif leading-[1.3] placeholder:text-black/20 p-0 text-[#1C1C1C]"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  onPaste={handlePaste}
                  autoFocus
                />
              </div>

              <div className="space-y-6 mt-auto pb-[env(safe-area-inset-bottom,2rem)] animate-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="space-y-4">
                  <p className="text-[10px] md:text-[11px] font-bold tracking-[0.15em] text-[#909090] uppercase">
                    Categorize (Select multiple)
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {CATEGORIES.map(({ name, icon: Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(20);
                          toggleCategory(name);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 active:scale-95 ${
                          selectedCategories.includes(name)
                            ? name === 'Us' 
                              ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-soft' 
                              : 'bg-black text-white border border-black shadow-soft'
                            : 'bg-white text-[#737373] border border-black/[0.04] hover:bg-black/[0.02] hover:shadow-sm'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${selectedCategories.includes(name) && name === 'Us' ? 'text-rose-500 fill-rose-500' : ''}`} />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-black/[0.05]">
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-[#909090] hover:text-black font-semibold text-sm md:text-base tracking-wide px-4 h-12 md:h-14 transition-colors rounded-full"
                      onClick={() => setIsAdding(false)}
                    >
                      Cancel
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-[#909090] hover:text-black px-4 h-12 md:h-14 transition-colors rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach Image"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="rounded-full px-8 md:px-10 h-12 md:h-14 bg-[#1C1C1C] text-white hover:bg-black font-semibold text-sm md:text-base tracking-wide shadow-elevated transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none" 
                    disabled={(!newFact.trim() && !imageUrl) || selectedCategories.length === 0}
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5 mr-2.5" />
                    Share Discovery
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}