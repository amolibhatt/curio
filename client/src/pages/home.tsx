import { useState, useRef, useEffect, useMemo } from "react";
import { Fact, Category, User } from "@/lib/mock-data";
import { getLocalDateStr } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, X, Bold, Italic, Underline, Pencil, Lightbulb, RefreshCw, ArrowRight, Check, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import RichEditor from "@/components/rich-editor";
import { getDailyPrompt, getDailyPromptAlternatives } from "@/lib/daily-prompts";

const CATEGORIES: { name: Category; icon: React.ElementType }[] = [
  { name: 'History', icon: Globe },
  { name: 'Etymology', icon: BookA },
  { name: 'Science', icon: Microscope },
  { name: 'Space', icon: Telescope },
  { name: 'Art', icon: Palette },
  { name: 'Us', icon: Heart },
  { name: 'Random', icon: HelpCircle },
];

function RichEditorSection({ newFact, setNewFact, showHeadingMenu, setShowHeadingMenu }: { newFact: string, setNewFact: (v: string) => void, showHeadingMenu: boolean, setShowHeadingMenu: (v: boolean) => void }) {
  const { editorRef, applyFormat, applyHeading, editorElement } = RichEditor({
    value: newFact,
    onChange: setNewFact,
    placeholder: "What caught your eye today...",
    maxLength: 1000,
    autoFocus: true,
    className: "flex-1 min-h-[120px] text-base md:text-lg font-serif leading-relaxed text-[#1C1C1C]",
  });

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500 delay-100">
      <div className="flex items-center gap-1 mb-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            className={`h-8 px-2.5 flex items-center justify-center rounded-lg text-[11px] font-bold tracking-wide transition-colors ${showHeadingMenu ? 'text-black bg-black/5' : 'text-[#909090] hover:text-black hover:bg-black/5'}`}
            title="Text style"
            data-testid="button-format-heading"
          >
            Aa
          </button>
          {showHeadingMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-black/5 py-1 z-30 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => { applyHeading(0); setShowHeadingMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-[#1C1C1C] hover:bg-black/5 transition-colors"
                data-testid="button-style-normal"
              >
                Normal text
              </button>
              {[1, 2, 3, 4, 5, 6].map((level) => {
                const sizes = ['text-xl font-bold', 'text-lg font-bold', 'text-base font-semibold', 'text-sm font-semibold', 'text-xs font-medium', 'text-xs font-medium text-[#737373]'];
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => { applyHeading(level); setShowHeadingMenu(false); }}
                    className={`w-full px-3 py-2 text-left hover:bg-black/5 transition-colors ${sizes[level - 1]}`}
                    data-testid={`button-style-h${level}`}
                  >
                    Heading {level}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="w-px h-5 bg-black/10 mx-0.5" />
        <button
          type="button"
          onClick={() => applyFormat('bold')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-black hover:bg-black/5 transition-colors"
          title="Bold"
          data-testid="button-format-bold"
        >
          <Bold className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-black hover:bg-black/5 transition-colors"
          title="Italic"
          data-testid="button-format-italic"
        >
          <Italic className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('underline')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-black hover:bg-black/5 transition-colors"
          title="Underline"
          data-testid="button-format-underline"
        >
          <Underline className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      {editorElement}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home({ facts, onAddFact, onEditFact, activeUser, partnerUser }: { facts: Fact[], onAddFact: (text: string, categories: Category[]) => Promise<void>, onEditFact: (factId: string, text: string, categories: Category[]) => Promise<void>, activeUser: User, partnerUser: User }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [newFact, setNewFact] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const { toast } = useToast();

  const hasPartner = partnerUser.id !== "0";

  const [todayStr, setTodayStr] = useState(() => getLocalDateStr());
  useEffect(() => {
    const check = setInterval(() => {
      const now = getLocalDateStr();
      if (now !== todayStr) setTodayStr(now);
    }, 30000);
    return () => clearInterval(check);
  }, [todayStr]);
  const todayFacts = facts.filter(f => f.date === todayStr);
  const myFactToday = todayFacts.find(f => f.authorId === activeUser.id);
  const partnerFactToday = todayFacts.find(f => f.authorId === partnerUser.id);

  const allPrompts = useMemo(() => {
    const primary = getDailyPrompt(todayStr);
    const alts = getDailyPromptAlternatives(todayStr, 4);
    return [primary, ...alts];
  }, [todayStr]);
  const currentPrompt = allPrompts[promptIndex % allPrompts.length];

  const shufflePrompt = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setPromptIndex(prev => prev + 1);
  };

  const usePrompt = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    setNewFact(`<p>${currentPrompt}</p><p><br></p>`);
    setIsAdding(true);
  };

  const streak = useMemo(() => {
    let currentStreak = 0;
    
    const factsByDate = new Map<string, { user1: boolean; user2: boolean }>();
    for (const f of facts) {
      const entry = factsByDate.get(f.date) || { user1: false, user2: false };
      if (f.authorId === activeUser.id) entry.user1 = true;
      if (f.authorId === partnerUser.id) entry.user2 = true;
      factsByDate.set(f.date, entry);
    }
    
    for (let i = 0; i < 365; i++) {
      const dateStr = getLocalDateStr(new Date(Date.now() - i * 86400000));
      
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
    if (isAdding || isEditing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isAdding, isEditing]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isAdding || isEditing)) {
        setIsAdding(false);
        setIsEditing(false);
        setEditingFactId(null);
        setNewFact("");
        setSelectedCategories([]);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isAdding, isEditing]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  const startEditing = () => {
    if (myFactToday) {
      setNewFact(myFactToday.text);
      setSelectedCategories([...myFactToday.categories]);
      setEditingFactId(myFactToday.id);
      setIsEditing(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    if (selectedCategories.length === 0) return;
    if (isSubmitting) return;
    
    if (navigator.vibrate) navigator.vibrate(50);
    setIsSubmitting(true);
    try {
      if (isEditing && editingFactId) {
        await onEditFact(editingFactId, newFact.trim(), selectedCategories);
        toast({ title: "Updated", description: "Your discovery has been updated." });
      } else {
        await onAddFact(newFact.trim(), selectedCategories);
      }
      setNewFact("");
      setSelectedCategories([]);
      setIsAdding(false);
      setIsEditing(false);
      setEditingFactId(null);
    } catch (err: any) {
      toast({
        title: isEditing ? "Couldn't update" : "Couldn't add",
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

  if (isAdding || isEditing) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#FBF9F6] flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 sticky top-0 z-20 bg-[#FBF9F6]/90 backdrop-blur-md">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#909090] uppercase pl-1">
            {isEditing ? "Edit entry" : "New entry"}
          </p>
          <button 
            onClick={() => {
              setIsAdding(false);
              setIsEditing(false);
              setEditingFactId(null);
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
            <RichEditorSection
              newFact={newFact}
              setNewFact={setNewFact}
              showHeadingMenu={showHeadingMenu}
              setShowHeadingMenu={setShowHeadingMenu}
            />

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
                  {isSubmitting ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save changes" : "Add to archive")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto flex flex-col pt-2 md:pt-6 pb-[max(env(safe-area-inset-bottom),5rem)] md:pb-4 gap-5 md:gap-6">

      <header className="flex-shrink-0 px-2 md:px-0 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm border border-black/5">
            <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full" />
          </div>
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-in zoom-in duration-500" />
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm border border-black/5">
            <img src={partnerUser.avatar} alt={partnerUser.name} className="w-full h-full" />
          </div>
        </div>

        <h1 className="font-serif text-[1.6rem] md:text-[2.5rem] leading-tight text-[#1C1C1C] tracking-tight mb-1" data-testid="text-greeting">
          {getGreeting()}, <span className="italic text-[#4A4A4A]">{activeUser.name}</span>
          {hasPartner && <span className="text-[#909090]"> & </span>}
          {hasPartner && <span className="italic text-[#4A4A4A]">{partnerUser.name}</span>}
        </h1>

        <div className="flex items-center justify-center gap-3 mt-3">
          {streak > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-[#1C1C1C] text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.1em]" data-testid="badge-streak">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {streak} DAY STREAK
            </div>
          )}
          <p className="text-[11px] text-[#909090] font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </header>

      <div className="px-2 md:px-0">
        <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-black/5" data-testid="card-today-checkin">
          <p className="text-[9px] font-bold tracking-[0.25em] text-[#909090] uppercase mb-3 px-1">Today's check-in</p>
          <div className="flex gap-3">
            <div className={`flex-1 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
              myFactToday ? 'bg-green-50/80' : 'bg-[#FBF9F6]'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                myFactToday ? 'bg-green-500 text-white' : 'border-2 border-dashed border-[#d0d0d0]'
              }`}>
                {myFactToday && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${myFactToday ? 'text-green-700' : 'text-[#909090]'}`}>
                  {activeUser.name}
                </p>
                <p className="text-[10px] text-[#b0b0b0]">
                  {myFactToday ? "Shared" : "Not yet"}
                </p>
              </div>
              {myFactToday && (
                <button
                  onClick={startEditing}
                  className="ml-auto w-7 h-7 flex items-center justify-center rounded-full hover:bg-green-100 transition-colors text-green-600"
                  data-testid="button-edit-fact"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className={`flex-1 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
              partnerFactToday ? 'bg-green-50/80' : 'bg-[#FBF9F6]'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                partnerFactToday ? 'bg-green-500 text-white' : 'border-2 border-dashed border-[#d0d0d0]'
              }`}>
                {partnerFactToday && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${partnerFactToday ? 'text-green-700' : 'text-[#909090]'}`}>
                  {hasPartner ? partnerUser.name : "Partner"}
                </p>
                <p className="text-[10px] text-[#b0b0b0]">
                  {!hasPartner ? "Invite them" : partnerFactToday ? "Shared" : "Not yet"}
                </p>
              </div>
            </div>
          </div>
          {myFactToday && partnerFactToday && (
            <a
              href="/archive"
              className="flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
              data-testid="link-view-archive"
            >
              Both shared! See today's discoveries
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="px-2 md:px-0">
        <div
          className="bg-white rounded-[1.5rem] p-5 md:p-6 shadow-sm border border-black/5"
          data-testid="card-daily-prompt"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold tracking-[0.25em] text-[#909090] uppercase mb-0.5">Today's prompt</p>
              <p className="font-serif text-base md:text-lg text-[#1C1C1C] leading-relaxed" data-testid="text-daily-prompt">
                {currentPrompt}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={shufflePrompt}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-medium text-[#909090] hover:text-black hover:bg-black/5 transition-all active:scale-95"
              data-testid="button-shuffle-prompt"
            >
              <RefreshCw className="w-3 h-3" />
              Another
            </button>
            {!myFactToday && (
              <button
                onClick={usePrompt}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold bg-[#1C1C1C] text-white hover:bg-black transition-all active:scale-95 ml-auto shadow-sm"
                data-testid="button-use-prompt"
              >
                Use this
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {!myFactToday && (
        <div className="px-2 md:px-0">
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(50);
              setIsAdding(true);
            }}
            className="w-full bg-[#1C1C1C] text-white rounded-[1.25rem] py-4 px-6 flex items-center justify-center gap-3 font-semibold text-sm tracking-wide transition-all active:scale-[0.98] hover:bg-black shadow-sm"
            data-testid="card-add-discovery"
          >
            <Send className="w-4 h-4" />
            Share today's discovery
          </button>
        </div>
      )}
    </div>
  );
}
