import { useState, useRef, useEffect, useMemo } from "react";
import { Fact, Category, User, DailyAnswer } from "@/lib/mock-data";
import { getLocalDateStr } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, X, Bold, Italic, Underline, Pencil, Lightbulb, RefreshCw, ArrowRight, Check, Send, MessageCircle, Lock, Flame, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import RichEditor from "@/components/rich-editor";
import { getDailyPrompt, getDailyPromptAlternatives } from "@/lib/daily-prompts";
import { getDailyQuestion, type QuestionCategory } from "@/lib/daily-questions";

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
        <button type="button" onClick={() => applyFormat('bold')} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-black hover:bg-black/5 transition-colors" title="Bold" data-testid="button-format-bold">
          <Bold className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => applyFormat('italic')} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-black hover:bg-black/5 transition-colors" title="Italic" data-testid="button-format-italic">
          <Italic className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => applyFormat('underline')} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-black hover:bg-black/5 transition-colors" title="Underline" data-testid="button-format-underline">
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

export default function Home({ facts, onAddFact, onEditFact, activeUser, partnerUser, dailyAnswers, onSubmitAnswer }: { facts: Fact[], onAddFact: (text: string, categories: Category[]) => Promise<void>, onEditFact: (factId: string, text: string, categories: Category[]) => Promise<void>, activeUser: User, partnerUser: User, dailyAnswers: DailyAnswer[], onSubmitAnswer: (questionText: string, category: string, answer: string) => Promise<DailyAnswer> }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [newFact, setNewFact] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
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

  const dailyQuestion = useMemo(() => getDailyQuestion(todayStr), [todayStr]);
  const todayAnswer = dailyAnswers.find(a => a.date === todayStr);
  const myAnswer = todayAnswer?.answers?.[activeUser.id];
  const partnerAnswer = todayAnswer?.answers?.[partnerUser.id];
  const bothAnswered = !!myAnswer && !!partnerAnswer;

  const handleSubmitDailyAnswer = async () => {
    if (!answerText.trim() || isSubmittingAnswer) return;
    if (navigator.vibrate) navigator.vibrate(50);
    setIsSubmittingAnswer(true);
    try {
      await onSubmitAnswer(dailyQuestion.text, dailyQuestion.category, answerText.trim());
      setAnswerText("");
    } catch (err: any) {
      toast({ title: "Couldn't submit", description: err?.message || "Try again.", variant: "destructive" });
    } finally {
      setIsSubmittingAnswer(false);
    }
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
    if (prevStreakRef.current === null) { prevStreakRef.current = streak; return; }
    if (streak > prevStreakRef.current && streak > 0) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'] });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'] });
      }, 250);
      prevStreakRef.current = streak;
      return () => clearInterval(interval);
    }
    prevStreakRef.current = streak;
  }, [streak, facts.length]);

  useEffect(() => {
    if (isAdding || isEditing) { document.body.style.overflow = "hidden"; } else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [isAdding, isEditing]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isAdding || isEditing)) {
        setIsAdding(false); setIsEditing(false); setEditingFactId(null); setNewFact(""); setSelectedCategories([]);
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
    if (!newFact.trim() || selectedCategories.length === 0 || isSubmitting) return;
    if (navigator.vibrate) navigator.vibrate(50);
    setIsSubmitting(true);
    try {
      if (isEditing && editingFactId) {
        await onEditFact(editingFactId, newFact.trim(), selectedCategories);
        toast({ title: "Updated", description: "Your discovery has been updated." });
      } else {
        await onAddFact(newFact.trim(), selectedCategories);
      }
      setNewFact(""); setSelectedCategories([]); setIsAdding(false); setIsEditing(false); setEditingFactId(null);
    } catch (err: any) {
      toast({ title: isEditing ? "Couldn't update" : "Couldn't add", description: err?.message || "Something went wrong. Try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  if (isAdding || isEditing) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#FAF9F7] flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 sticky top-0 z-20 bg-[#FAF9F7]/90 backdrop-blur-md">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#909090] uppercase pl-1">
            {isEditing ? "Edit entry" : "New entry"}
          </p>
          <button
            onClick={() => { setIsAdding(false); setIsEditing(false); setEditingFactId(null); setNewFact(""); setSelectedCategories([]); }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-black/5 text-[#909090] hover:text-black transition-colors"
            data-testid="button-close-form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col px-6 md:px-10 pb-6 relative z-10">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-8 md:space-y-12">
            <RichEditorSection newFact={newFact} setNewFact={setNewFact} showHeadingMenu={showHeadingMenu} setShowHeadingMenu={setShowHeadingMenu} />
            <div className="space-y-8 mt-auto pb-[env(safe-area-inset-bottom,2rem)] animate-in slide-in-from-bottom-8 duration-500 delay-200">
              <div className="space-y-4">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#909090] uppercase">Tags</p>
                <div className="flex flex-wrap gap-2.5">
                  {CATEGORIES.map(({ name, icon: Icon }) => (
                    <button key={name} type="button" onClick={() => { if (navigator.vibrate) navigator.vibrate(20); toggleCategory(name); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 active:scale-95 border ${
                        selectedCategories.includes(name)
                          ? name === 'Us' ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' : 'bg-black text-white border-black shadow-sm'
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
                <button type="submit" className="rounded-full px-8 h-12 bg-[#1C1C1C] text-white hover:bg-black font-semibold text-sm tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-sm flex items-center" disabled={!newFact.trim() || selectedCategories.length === 0 || isSubmitting} data-testid="button-save-fact">
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
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto flex flex-col pt-2 md:pt-6 pb-[max(env(safe-area-inset-bottom),5rem)] md:pb-4 gap-4 md:gap-5">

      <header className="flex-shrink-0 px-1 md:px-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white shadow-sm border-2 border-white ring-2 ring-rose-100">
              <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full" />
            </div>
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white shadow-sm border-2 border-white ring-2 ring-blue-100 -ml-3">
              <img src={partnerUser.avatar} alt={partnerUser.name} className="w-full h-full" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg md:text-xl text-[#1C1C1C] leading-tight truncate" data-testid="text-greeting">
              {getGreeting()} <span className="text-[#909090]">✦</span>
            </p>
            <p className="text-[11px] text-[#909090] font-medium mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3 py-1.5 rounded-full shrink-0" data-testid="badge-streak">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span className="text-[11px] font-bold">{streak}</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 px-1 md:px-0">
        <div className={`rounded-2xl p-4 flex flex-col gap-2 transition-colors ${
          myFactToday ? 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100' : 'bg-white border border-black/5'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              myFactToday ? 'bg-emerald-500 text-white' : 'border-2 border-dashed border-[#d0d0d0]'
            }`}>
              {myFactToday && <Check className="w-3 h-3" strokeWidth={3} />}
            </div>
            <span className={`text-[11px] font-semibold truncate ${myFactToday ? 'text-emerald-700' : 'text-[#909090]'}`}>
              {activeUser.name}
            </span>
          </div>
          <p className="text-[10px] text-[#b0b0b0] leading-tight">
            {myFactToday ? "Discovery shared" : "Share yours today"}
          </p>
          {myFactToday && (
            <button onClick={startEditing} className="mt-auto self-start flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors" data-testid="button-edit-fact">
              <Pencil className="w-2.5 h-2.5" /> Edit
            </button>
          )}
        </div>

        <div className={`rounded-2xl p-4 flex flex-col gap-2 transition-colors ${
          partnerFactToday ? 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100' : 'bg-white border border-black/5'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              partnerFactToday ? 'bg-emerald-500 text-white' : 'border-2 border-dashed border-[#d0d0d0]'
            }`}>
              {partnerFactToday && <Check className="w-3 h-3" strokeWidth={3} />}
            </div>
            <span className={`text-[11px] font-semibold truncate ${partnerFactToday ? 'text-emerald-700' : 'text-[#909090]'}`}>
              {hasPartner ? partnerUser.name : "Partner"}
            </span>
          </div>
          <p className="text-[10px] text-[#b0b0b0] leading-tight">
            {!hasPartner ? "Invite them to join" : partnerFactToday ? "Discovery shared" : "Waiting..."}
          </p>
        </div>
      </div>

      {myFactToday && partnerFactToday && (
        <div className="px-1 md:px-0">
          <a href="/archive" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 text-amber-700 text-xs font-semibold hover:from-amber-100 hover:to-orange-100 transition-all" data-testid="link-view-archive">
            <Sparkles className="w-3.5 h-3.5" />
            Both shared! See today's discoveries
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <div className="px-1 md:px-0">
        <div className="bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 rounded-2xl p-5 border border-violet-100/60" data-testid="card-daily-question">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-sm">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[9px] font-bold tracking-[0.25em] text-violet-500 uppercase">Today's question</p>
                <span className="text-[9px] font-bold tracking-[0.15em] text-violet-300 uppercase">· {dailyQuestion.category}</span>
              </div>
              <p className="font-serif text-[1.05rem] md:text-lg text-[#1C1C1C] leading-relaxed" data-testid="text-daily-question">
                {dailyQuestion.text}
              </p>
            </div>
          </div>

          {!myAnswer ? (
            <div className="space-y-3">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer..."
                maxLength={500}
                className="w-full bg-white/70 rounded-xl px-4 py-3 text-sm text-[#1C1C1C] placeholder:text-[#c0c0c0] resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 font-serif leading-relaxed border border-violet-100/50"
                rows={2}
                data-testid="input-daily-answer"
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-[#c0c0c0]">{answerText.length}/500</p>
                <button
                  onClick={handleSubmitDailyAnswer}
                  disabled={!answerText.trim() || isSubmittingAnswer}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[12px] font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                  data-testid="button-submit-answer"
                >
                  {isSubmittingAnswer ? "Sending..." : "Answer"}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : bothAnswered ? (
            <div className="space-y-2.5 animate-in fade-in duration-500">
              <div className="rounded-xl bg-white/80 px-4 py-3 border border-violet-100/40">
                <p className="text-[10px] font-bold tracking-[0.15em] text-violet-400 uppercase mb-1">{activeUser.name}</p>
                <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{myAnswer}</p>
              </div>
              <div className="rounded-xl bg-white/80 px-4 py-3 border border-blue-100/40">
                <p className="text-[10px] font-bold tracking-[0.15em] text-blue-400 uppercase mb-1">{partnerUser.name}</p>
                <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{partnerAnswer}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white/60 px-4 py-3.5 flex items-center gap-3 border border-violet-100/30">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#1C1C1C]">You answered!</p>
                <p className="text-[10px] text-[#909090]">Waiting for {partnerUser.name} to unlock both</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!myFactToday && (
        <div className="px-1 md:px-0">
          <button
            onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setIsAdding(true); }}
            className="w-full bg-gradient-to-r from-[#1C1C1C] to-[#333] text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-semibold text-sm tracking-wide transition-all active:scale-[0.98] hover:from-black hover:to-[#222] shadow-sm"
            data-testid="card-add-discovery"
          >
            <Send className="w-4 h-4" />
            Share today's discovery
          </button>
        </div>
      )}

      <div className="px-1 md:px-0">
        <div className="bg-white rounded-2xl p-4 border border-black/5" data-testid="card-daily-prompt">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold tracking-[0.25em] text-[#b0b0b0] uppercase mb-0.5">Inspiration</p>
              <p className="font-serif text-sm text-[#737373] leading-relaxed" data-testid="text-daily-prompt">
                {currentPrompt}
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button onClick={shufflePrompt} className="flex items-center gap-1 text-[10px] font-medium text-[#b0b0b0] hover:text-[#737373] transition-all active:scale-95" data-testid="button-shuffle-prompt">
                  <RefreshCw className="w-3 h-3" /> Shuffle
                </button>
                {!myFactToday && (
                  <button onClick={usePrompt} className="flex items-center gap-1 text-[10px] font-semibold text-[#1C1C1C] hover:text-black transition-all active:scale-95 ml-auto" data-testid="button-use-prompt">
                    Use this <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
