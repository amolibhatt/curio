import { useState, useRef, useEffect, useMemo } from "react";
import { Fact, Category, User } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

const CATEGORIES: { name: Category; icon: React.ElementType }[] = [
  { name: 'History', icon: Globe },
  { name: 'Etymology', icon: BookA },
  { name: 'Science', icon: Microscope },
  { name: 'Space', icon: Telescope },
  { name: 'Art', icon: Palette },
  { name: 'Us', icon: Heart },
  { name: 'Random', icon: HelpCircle },
];

export default function Home({ facts, onAddFact, activeUser, partnerUser }: { facts: Fact[], onAddFact: (text: string, categories: Category[], imageUrl?: string) => Promise<void>, activeUser: User, partnerUser: User }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFact, setNewFact] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFacts = facts.filter(f => f.date === todayStr);
  const myFactToday = todayFacts.find(f => f.authorId === activeUser.id);

  const streak = useMemo(() => {
    let currentStreak = 0;
    const today = new Date();
    
    const factsByDate = new Map<string, { user1: boolean; user2: boolean }>();
    for (const f of facts) {
      const entry = factsByDate.get(f.date) || { user1: false, user2: false };
      if (f.authorId === activeUser.id) entry.user1 = true;
      if (f.authorId === partnerUser.id) entry.user2 = true;
      factsByDate.set(f.date, entry);
    }
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const entry = factsByDate.get(dateStr);
      
      if (entry?.user1 && entry?.user2) {
        currentStreak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [facts, activeUser.id, partnerUser.id]);

  // Trigger confetti when streak changes (excluding initial load)
  const prevStreakRef = useRef(streak);
  
  useEffect(() => {
    if (streak > prevStreakRef.current && streak > 0) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });
      }, 250);

      return () => clearInterval(interval);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAdding) setIsAdding(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isAdding]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim() && !imageUrl) return;
    if (selectedCategories.length === 0) return;
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddFact(newFact, selectedCategories, imageUrl || undefined);
      setNewFact("");
      setSelectedCategories([]);
      setImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsAdding(false);
    } catch (err: any) {
      toast({
        title: "Couldn't save",
        description: err?.message || "Something went wrong. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto h-full flex flex-col pt-1 md:pt-4 pb-[max(env(safe-area-inset-bottom),5rem)] md:pb-4 gap-3 md:gap-6">
      {/* Header Section */}
      <header className="space-y-2 md:space-y-4 flex-shrink-0 px-2 md:px-0">
        <div className="inline-flex items-center gap-2 bg-[#1C1C1C] text-white px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-[11px] font-bold tracking-[0.1em]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-3.5 md:h-3.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {streak} DAY STREAK
        </div>
        
            <div className="space-y-3 pt-4">
          <h1 className="text-[2.5rem] md:text-[3.25rem] leading-[1.05] font-serif text-[#1C1C1C] tracking-tight">
            What's on your <span className="italic text-[#4A4A4A]">mind</span>?
          </h1>
          <p className="text-[1.15rem] md:text-[1.25rem] text-[#909090] italic font-serif">
            Leave a thought for the archive.
          </p>
        </div>
      </header>

      {/* Main Action Card */}
      {myFactToday ? (
        <Card className="bg-transparent border-none shadow-none rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex-1 flex flex-col mx-2 md:mx-0 relative">
          {/* Waiting animation background */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] opacity-50 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-60 animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
          
          <CardContent className="p-6 md:p-8 flex-1 flex flex-col justify-center items-center text-center relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50/80 text-green-600 rounded-full flex items-center justify-center mb-6 animate-in slide-in-from-bottom-2 duration-500">
              <Clock className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <h2 className="font-serif text-[1.8rem] md:text-[2.2rem] text-black mb-2 animate-in slide-in-from-bottom-3 duration-500 delay-100">Locked in.</h2>
            <p className="text-[#909090] text-base md:text-lg max-w-[320px] leading-relaxed animate-in slide-in-from-bottom-4 duration-500 delay-200">
              {partnerUser.id === 0
                ? "Your thought is saved. Invite a friend to get started."
                : `Kept quiet until ${partnerUser.name} shares theirs.`}
            </p>
          </CardContent>
        </Card>
      ) : !isAdding ? (
        <Card 
          className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex-1 flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] mx-2 md:mx-0 shadow-sm border border-black/5"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setIsAdding(true);
          }}
        >
          <CardContent className="p-4 flex-1 flex flex-col justify-center items-center text-center group">
            <div className="w-16 h-16 bg-[#FBF9F6] rounded-full flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110">
              <Plus className="w-8 h-8 text-[#1C1C1C]" strokeWidth={1} />
            </div>
            
            <div className="space-y-1 opacity-80 group-hover:opacity-100 transition-opacity mt-5">
              <h2 className="font-serif text-[1.5rem] md:text-[1.75rem] text-[#1C1C1C]">Add a thought</h2>
              <p className="text-[10px] md:text-[11px] font-bold tracking-[0.25em] text-[#909090] uppercase mt-2">
                For the archive
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="fixed inset-0 z-50 bg-[#FBF9F6] flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
          
          {/* Top Nav for Form */}
          <div className="flex justify-end p-4 md:p-6 sticky top-0 z-20">
            <button 
              onClick={() => setIsAdding(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-black/5 text-[#909090] hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col px-6 md:px-10 pb-6 relative z-10 mt-4 md:mt-8">
            <form onSubmit={(e) => {
              if (navigator.vibrate) navigator.vibrate(50);
              handleSubmit(e);
            }} className="flex-1 flex flex-col space-y-8 md:space-y-12">
              
              <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500 delay-100">
                <Textarea 
                  placeholder="Write something..." 
                  className="flex-none resize-none bg-transparent border-none focus-visible:ring-0 text-[1.75rem] md:text-[2.5rem] font-serif leading-[1.3] placeholder:text-[#909090]/40 p-0 text-[#1C1C1C] min-h-[120px]"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  onPaste={handlePaste}
                  autoFocus
                />
                
                {imageUrl && (
                  <div className="relative mt-4 mb-4 rounded-2xl overflow-hidden shadow-sm border border-black/5 max-h-[300px] flex-shrink-0 group self-start">
                    <img src={imageUrl} alt="Uploaded" className="w-auto h-full max-h-[300px] object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setImageUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-8 mt-auto pb-[env(safe-area-inset-bottom,2rem)] animate-in slide-in-from-bottom-8 duration-500 delay-200">
                <div className="space-y-4">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-[#909090] uppercase">
                    Tags
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 active:scale-95 border ${
                          selectedCategories.includes(name)
                            ? name === 'Us' 
                              ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' 
                              : 'bg-black text-white border-black shadow-sm'
                            : 'bg-white text-[#737373] border-black/5 hover:border-black/10 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${selectedCategories.includes(name) && name === 'Us' ? 'text-rose-500 fill-rose-500' : ''}`} />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-black/5">
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                    />
                    <button 
                      type="button" 
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-[#737373] hover:text-black border border-black/5 shadow-sm transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach Image"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="rounded-full px-8 h-12 bg-[#1C1C1C] text-white hover:bg-black font-semibold text-sm tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-sm flex items-center" 
                    disabled={(!newFact.trim() && !imageUrl) || selectedCategories.length === 0 || isSubmitting}
                    data-testid="button-save-fact"
                  >
                    {isSubmitting ? "Saving..." : "Save it"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}