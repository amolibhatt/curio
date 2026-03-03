import { useState, useRef, useEffect, useMemo } from "react";
import { Fact, Category, User } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, X, Bold, Italic, Underline, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { formatText, insertFormatting } from "@/lib/format-text";

const CATEGORIES: { name: Category; icon: React.ElementType }[] = [
  { name: 'History', icon: Globe },
  { name: 'Etymology', icon: BookA },
  { name: 'Science', icon: Microscope },
  { name: 'Space', icon: Telescope },
  { name: 'Art', icon: Palette },
  { name: 'Us', icon: Heart },
  { name: 'Random', icon: HelpCircle },
];

export default function Home({ facts, onAddFact, activeUser, partnerUser }: { facts: Fact[], onAddFact: (text: string, categories: Category[]) => Promise<void>, activeUser: User, partnerUser: User }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFact, setNewFact] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const { toast } = useToast();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFacts = facts.filter(f => f.date === todayStr);
  const myFactToday = todayFacts.find(f => f.authorId === activeUser.id);
  const partnerFactToday = todayFacts.find(f => f.authorId === partnerUser.id);

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

  const prevStreakRef = useRef<number | null>(null);

  useEffect(() => {
    if (facts.length === 0) return;

    if (prevStreakRef.current === null) {
      prevStreakRef.current = streak;
      return;
    }

    if (streak > prevStreakRef.current && streak > 0) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

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

      prevStreakRef.current = streak;
      return () => clearInterval(interval);
    }

    prevStreakRef.current = streak;
  }, [streak, facts.length]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAdding) {
        setIsAdding(false);
        setNewFact("");
        setSelectedCategories([]);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isAdding]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    if (selectedCategories.length === 0) return;
    if (isSubmitting) return;
    
    if (navigator.vibrate) navigator.vibrate(50);
    setIsSubmitting(true);
    try {
      await onAddFact(newFact.trim(), selectedCategories);
      setNewFact("");
      setSelectedCategories([]);
      setIsAdding(false);
    } catch (err: any) {
      toast({
        title: "Couldn't add",
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

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto h-full flex flex-col pt-1 md:pt-4 pb-[max(env(safe-area-inset-bottom),5rem)] md:pb-4 gap-3 md:gap-6">
      <header className="space-y-2 md:space-y-4 flex-shrink-0 px-2 md:px-0">
        {streak > 0 && (
          <div className="inline-flex items-center gap-2 bg-[#1C1C1C] text-white px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-[11px] font-bold tracking-[0.1em]" data-testid="badge-streak">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-3.5 md:h-3.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {streak} DAY STREAK
          </div>
        )}
        <div className="space-y-3 pt-4">
          <h1 className="text-[2.5rem] md:text-[3.25rem] leading-[1.05] font-serif text-[#1C1C1C] tracking-tight">
            What did you <span className="italic text-[#4A4A4A]">discover</span>?
          </h1>
          <p className="text-[1.15rem] md:text-[1.25rem] text-[#909090] italic font-serif">
            One curiosity a day, just between us.
          </p>
        </div>
      </header>

      {myFactToday ? (
        <Card className="bg-transparent border-none shadow-none rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex-1 flex flex-col mx-2 md:mx-0 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] opacity-50 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-60 animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
          
          <CardContent className="p-6 md:p-8 flex-1 flex flex-col justify-center items-center text-center relative z-10">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-6 animate-in slide-in-from-bottom-2 duration-500 ${partnerFactToday ? 'bg-amber-50/80 text-amber-600' : 'bg-green-50/80 text-green-600'}`}>
              <Clock className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <h2 className="font-serif text-[1.8rem] md:text-[2.2rem] text-black mb-2 animate-in slide-in-from-bottom-3 duration-500 delay-100" data-testid="text-sealed-title">
              {partnerFactToday ? "Both shared!" : "Sealed."}
            </h2>
            <p className="text-[#909090] text-base md:text-lg max-w-[320px] leading-relaxed animate-in slide-in-from-bottom-4 duration-500 delay-200" data-testid="text-sealed-message">
              {partnerFactToday
                ? "Head to the archive to see today\u2019s discoveries."
                : partnerUser.id === "0"
                  ? "Your discovery is safe. Invite someone to start the exchange."
                  : `Waiting for ${partnerUser.name} to share theirs.`}
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
          data-testid="card-add-discovery"
        >
          <CardContent className="p-4 flex-1 flex flex-col justify-center items-center text-center group">
            <div className="w-16 h-16 bg-[#FBF9F6] rounded-full flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110">
              <Plus className="w-8 h-8 text-[#1C1C1C]" strokeWidth={1} />
            </div>
            
            <div className="space-y-1 opacity-80 group-hover:opacity-100 transition-opacity mt-5">
              <h2 className="font-serif text-[1.5rem] md:text-[1.75rem] text-[#1C1C1C]">Add a discovery</h2>
              <p className="text-[10px] md:text-[11px] font-bold tracking-[0.25em] text-[#909090] uppercase mt-2">
                To the archive
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="fixed inset-0 z-[60] bg-[#FBF9F6] flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
          
          <div className="flex items-center justify-between p-4 md:p-6 sticky top-0 z-20 bg-[#FBF9F6]/90 backdrop-blur-md">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#909090] uppercase pl-1">
              New entry
            </p>
            <button 
              onClick={() => {
                setIsAdding(false);
                setNewFact("");
                setSelectedCategories([]);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-black/5 text-[#909090] hover:text-black transition-colors"
              data-testid="button-close-form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col px-6 md:px-10 pb-6 relative z-10">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-8 md:space-y-12">
              
              <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="flex items-center gap-1 mb-3">
                  <button
                    type="button"
                    onClick={() => textareaRef.current && insertFormatting(textareaRef.current, '**', '**', setNewFact)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-black hover:bg-black/5 transition-colors"
                    title="Bold"
                    data-testid="button-format-bold"
                  >
                    <Bold className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => textareaRef.current && insertFormatting(textareaRef.current, '*', '*', setNewFact)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-black hover:bg-black/5 transition-colors"
                    title="Italic"
                    data-testid="button-format-italic"
                  >
                    <Italic className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => textareaRef.current && insertFormatting(textareaRef.current, '__', '__', setNewFact)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-black hover:bg-black/5 transition-colors"
                    title="Underline"
                    data-testid="button-format-underline"
                  >
                    <Underline className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                  <div className="w-px h-5 bg-black/10 mx-1" />
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showPreview ? 'text-black bg-black/5' : 'text-[#909090] hover:text-black hover:bg-black/5'}`}
                    title={showPreview ? "Edit" : "Preview"}
                    data-testid="button-toggle-preview"
                  >
                    {showPreview ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                  </button>
                </div>

                {showPreview ? (
                  <div className="flex-1 min-h-[120px] p-0">
                    <p className="text-[1.75rem] md:text-[2.5rem] font-serif leading-[1.3] text-[#1C1C1C]">
                      {newFact.trim() ? formatText(newFact) : <span className="text-[#909090]/40">Preview will appear here...</span>}
                    </p>
                  </div>
                ) : (
                  <Textarea
                    ref={textareaRef}
                    placeholder="What caught your eye today..."
                    className="flex-1 resize-none bg-transparent border-none focus-visible:ring-0 text-[1.75rem] md:text-[2.5rem] font-serif leading-[1.3] placeholder:text-[#909090]/40 p-0 text-[#1C1C1C] min-h-[120px]"
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    maxLength={1000}
                    autoFocus
                  />
                )}

                {newFact.trim() && (
                  <p className="text-[10px] text-[#909090] mt-2 tracking-wider">
                    Use <span className="font-mono bg-black/5 px-1 rounded">**bold**</span> <span className="font-mono bg-black/5 px-1 rounded">*italic*</span> <span className="font-mono bg-black/5 px-1 rounded">__underline__</span>
                  </p>
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

                <div className="flex items-center justify-end pt-8 border-t border-black/5">
                  <button 
                    type="submit" 
                    className="rounded-full px-8 h-12 bg-[#1C1C1C] text-white hover:bg-black font-semibold text-sm tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-sm flex items-center" 
                    disabled={!newFact.trim() || selectedCategories.length === 0 || isSubmitting}
                    data-testid="button-save-fact"
                  >
                    {isSubmitting ? "Adding..." : "Add to archive"}
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