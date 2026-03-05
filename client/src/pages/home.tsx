import { useState, useRef, useEffect, useMemo } from "react";
import { Fact, Category, User, DailyAnswer, ReactionType, DailyGratitude, JournalEntry } from "@/lib/mock-data";
import { getLocalDateStr } from "@/lib/date-utils";
import { Link } from "wouter";
import { Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, X, Bold, Italic, Underline, Pencil, ArrowRight, Check, Send, MessageCircle, Lock, Flame, Sparkles, Brain, Laugh, Lightbulb, Frown, HandHeart, PenLine, Camera, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import RichEditor from "@/components/rich-editor";
import { getDailyQuestion } from "@/lib/daily-questions";
import { format } from "date-fns";
import { formatText } from "@/lib/format-text";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "@/lib/image-utils";

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
  const { editorRef, applyFormat, applyHeading, charCount, maxLength, editorElement } = RichEditor({
    value: newFact,
    onChange: setNewFact,
    placeholder: "What caught your eye today...",
    maxLength: 1000,
    autoFocus: true,
    className: "flex-1 min-h-[120px] text-base md:text-lg font-serif leading-relaxed text-[#1C1C1C]",
  });

  const headingMenuRef = useRef<HTMLDivElement>(null);
  const headingBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showHeadingMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        headingMenuRef.current && !headingMenuRef.current.contains(e.target as Node) &&
        headingBtnRef.current && !headingBtnRef.current.contains(e.target as Node)
      ) {
        setShowHeadingMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHeadingMenu, setShowHeadingMenu]);

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500 delay-100">
      <div className="flex items-center gap-1 mb-3">
        <div className="relative">
          <button
            ref={headingBtnRef}
            type="button"
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            className={`h-8 px-2.5 flex items-center justify-center rounded-lg text-[11px] font-bold tracking-wide transition-colors ${showHeadingMenu ? 'text-black bg-black/5' : 'text-[#909090] hover:text-black hover:bg-black/5'}`}
            title="Text style"
            data-testid="button-format-heading"
          >
            Aa
          </button>
          {showHeadingMenu && (
            <div ref={headingMenuRef} className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-black/5 py-1 z-30 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
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
      {maxLength > 0 && (
        <p className={`text-[10px] mt-2 text-right transition-colors ${charCount > maxLength * 0.9 ? 'text-red-400' : 'text-[#c0c0c0]'}`}>
          {charCount}/{maxLength}
        </p>
      )}
    </div>
  );
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home({ facts, onAddFact, onEditFact, activeUser, partnerUser, dailyAnswers, onSubmitAnswer, onQAReact, gratitudes = [], onSubmitGratitude, onAddJournalEntry }: { facts: Fact[], onAddFact: (text: string, categories: Category[]) => Promise<void>, onEditFact: (factId: string, text: string, categories: Category[]) => Promise<void>, activeUser: User, partnerUser: User, dailyAnswers: DailyAnswer[], onSubmitAnswer: (questionText: string, category: string, answer: string) => Promise<DailyAnswer>, onQAReact?: (answerId: string, reaction: string | null) => void, gratitudes?: DailyGratitude[], onSubmitGratitude?: (text: string) => Promise<DailyGratitude>, onAddJournalEntry?: (text: string, imageData?: string) => Promise<void> }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [newFact, setNewFact] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const submittingAnswerRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gratitudeText, setGratitudeText] = useState("");
  const [isSubmittingGratitude, setIsSubmittingGratitude] = useState(false);
  const submittingGratitudeRef = useRef(false);
  const gratitudeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [journalText, setJournalText] = useState("");
  const [journalImage, setJournalImage] = useState<string | null>(null);
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);
  const [showJournalComposer, setShowJournalComposer] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const journalFileInputRef = useRef<HTMLInputElement>(null);
  const journalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const hasPartner = partnerUser.id !== "0";

  const [todayStr, setTodayStr] = useState(() => getLocalDateStr());
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const check = setInterval(() => {
      const now = getLocalDateStr();
      if (now !== todayStr) setTodayStr(now);
      const h = new Date().getHours();
      if (h !== currentHour) setCurrentHour(h);
    }, 30000);
    return () => clearInterval(check);
  }, [todayStr, currentHour]);
  const todayFacts = facts.filter(f => f.date === todayStr);
  const myFactToday = todayFacts.find(f => f.authorId === activeUser.id);
  const partnerFactToday = todayFacts.find(f => f.authorId === partnerUser.id);

  const dailyQuestion = useMemo(() => getDailyQuestion(todayStr), [todayStr]);
  const todayAnswer = dailyAnswers.find(a => a.date === todayStr);
  const myAnswer = todayAnswer?.answers?.[activeUser.id];
  const partnerAnswer = todayAnswer?.answers?.[partnerUser.id];
  const bothAnswered = !!myAnswer && !!partnerAnswer;

  const myQAReaction = todayAnswer?.reactions?.[activeUser.id] as ReactionType | undefined;

  const todayGratitude = gratitudes.find(g => g.date === todayStr);
  const myGratitude = todayGratitude?.entries?.[activeUser.id];
  const partnerGratitude = todayGratitude?.entries?.[partnerUser.id];
  const bothGratitudesDone = !!myGratitude && !!partnerGratitude;

  const handleSubmitGratitude = async () => {
    if (!gratitudeText.trim() || submittingGratitudeRef.current || !onSubmitGratitude) return;
    submittingGratitudeRef.current = true;
    if (navigator.vibrate) navigator.vibrate(50);
    setIsSubmittingGratitude(true);
    try {
      await onSubmitGratitude(gratitudeText.trim());
      setGratitudeText("");
      if (gratitudeTextareaRef.current) gratitudeTextareaRef.current.style.height = '';
    } catch (err: any) {
      toast({ title: "Couldn't submit", description: err?.message || "Try again.", variant: "destructive" });
    } finally {
      setIsSubmittingGratitude(false);
      submittingGratitudeRef.current = false;
    }
  };

  const handleJournalImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setCompressingImage(true);
    try {
      const compressed = await compressImage(file);
      setJournalImage(compressed);
    } catch {
    } finally {
      setCompressingImage(false);
      if (journalFileInputRef.current) journalFileInputRef.current.value = '';
    }
  };

  const handleSubmitJournal = async () => {
    if ((!journalText.trim() && !journalImage) || isSubmittingJournal || !onAddJournalEntry) return;
    setIsSubmittingJournal(true);
    try {
      await onAddJournalEntry(journalText.trim(), journalImage || undefined);
      setJournalText("");
      setJournalImage(null);
      setShowJournalComposer(false);
      toast({ title: "Memory saved" });
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err?.message || "Try again.", variant: "destructive" });
    } finally {
      setIsSubmittingJournal(false);
    }
  };

  const handleSubmitDailyAnswer = async () => {
    if (!answerText.trim() || submittingAnswerRef.current) return;
    submittingAnswerRef.current = true;
    if (navigator.vibrate) navigator.vibrate(50);
    setIsSubmittingAnswer(true);
    try {
      await onSubmitAnswer(dailyQuestion.text, dailyQuestion.category, answerText.trim());
      setAnswerText("");
      if (answerTextareaRef.current) answerTextareaRef.current.style.height = '';
    } catch (err: any) {
      toast({ title: "Couldn't submit", description: err?.message || "Try again.", variant: "destructive" });
    } finally {
      submittingAnswerRef.current = false;
      setIsSubmittingAnswer(false);
    }
  };

  const streak = useMemo(() => {
    if (!hasPartner) return 0;
    let currentStreak = 0;
    const factsByDate = new Map<string, { user1: boolean; user2: boolean }>();
    for (const f of facts) {
      const entry = factsByDate.get(f.date) || { user1: false, user2: false };
      if (f.authorId === activeUser.id) entry.user1 = true;
      if (f.authorId === partnerUser.id) entry.user2 = true;
      factsByDate.set(f.date, entry);
    }
    let skippedToday = false;
    const [ty, tm, td] = todayStr.split('-').map(Number);
    for (let i = 0; i < 365; i++) {
      const d = new Date(ty, tm - 1, td);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateStr(d);
      const entry = factsByDate.get(dateStr);
      if (entry?.user1 && entry?.user2) {
        currentStreak++;
      } else if (i === 0 && !skippedToday) {
        skippedToday = true;
        continue;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [facts, activeUser.id, partnerUser.id, hasPartner, todayStr]);

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
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#D4C5B9', '#B8A99A', '#C9B8A8', '#E0D5CC', '#A89888', '#C2B2A2', '#DDD0C4'] });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#D4C5B9', '#B8A99A', '#C9B8A8', '#E0D5CC', '#A89888', '#C2B2A2', '#DDD0C4'] });
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

  const closeEditorRef = useRef<(force?: boolean) => void>(() => {});

  const closeEditor = (force?: boolean) => {
    if (!force) {
      const hasContent = isEditing
        ? (newFact.trim() !== (myFactToday?.text || '') || [...selectedCategories].sort().join(',') !== [...(myFactToday?.categories || [])].sort().join(','))
        : (newFact.trim() || selectedCategories.length > 0);
      if (hasContent && !window.confirm("Discard your changes?")) return;
    }
    setIsAdding(false); setIsEditing(false); setEditingFactId(null); setNewFact(""); setSelectedCategories([]); setShowHeadingMenu(false);
  };

  closeEditorRef.current = closeEditor;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isAdding || isEditing)) {
        closeEditorRef.current();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isAdding, isEditing]);

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
        toast({ title: "Shared!", description: "Your discovery has been added." });
      }
      closeEditor(true);
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
      <div className="fixed inset-0 z-[60] bg-[#FAF9F7] flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-y-auto" role="dialog" aria-modal="true" aria-label={isEditing ? "Edit discovery" : "New discovery"}>
        <div className="flex items-center justify-between p-4 md:p-6 pt-[max(env(safe-area-inset-top),1rem)] sticky top-0 z-20 bg-[#FAF9F7]/90 backdrop-blur-md">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#909090] uppercase pl-1">
            {isEditing ? "Edit entry" : "New entry"}
          </p>
          <button
            onClick={() => closeEditor()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-black/5 text-[#909090] hover:text-black transition-colors"
            data-testid="button-close-form"
            aria-label="Close editor"
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
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto flex flex-col pt-2 md:pt-6 pb-4 gap-5 md:gap-6">

      <header className="flex-shrink-0 px-1 md:px-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white shadow-sm border-2 border-white ring-2 ring-black/5">
              <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full" />
            </div>
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white shadow-sm border-2 border-white ring-2 ring-black/5 -ml-3">
              <img src={partnerUser.avatar} alt={partnerUser.name} className="w-full h-full" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg md:text-xl text-[#1C1C1C] leading-tight truncate" data-testid="text-greeting">
              {getGreeting(currentHour)} <span className="text-[#909090]">✦</span>
            </p>
            <p className="text-[11px] text-[#909090] font-medium mt-0.5">
              {(() => { const [y, m, d] = todayStr.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }); })()}
            </p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-[#1C1C1C] text-white px-3 py-1.5 rounded-full shrink-0" data-testid="badge-streak">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span className="text-[11px] font-bold">{streak}</span>
            </div>
          )}
        </div>
      </header>

      <div className="px-1 md:px-0">
        <div className={`rounded-2xl border transition-colors ${
          myFactToday && partnerFactToday ? 'bg-[#F0EEEA] border-[#E0DDD8]' : 'bg-white border-black/5'
        }`}>
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-9 h-9 rounded-xl bg-[#1C1C1C] flex items-center justify-center shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#909090] uppercase">Daily Discovery</p>
              <p className="text-[11px] text-[#b0b0b0] mt-0.5">Share something you learned today</p>
            </div>
            {myFactToday && partnerFactToday && (
              <span className="text-[9px] font-bold tracking-wider text-[#1C1C1C] bg-[#E0DDD8] px-2.5 py-1 rounded-full uppercase shrink-0">Done</span>
            )}
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`rounded-xl p-3.5 flex flex-col gap-1.5 transition-colors ${
                myFactToday ? 'bg-[#1C1C1C]' : 'bg-[#FAF9F7] border border-black/5'
              }`}>
                <div className="flex items-center gap-2">
                  <img src={activeUser.avatar} alt={activeUser.name} className="w-5 h-5 rounded-full" />
                  <span className={`text-[11px] font-semibold truncate ${myFactToday ? 'text-white' : 'text-[#737373]'}`}>
                    {activeUser.name}
                  </span>
                  {myFactToday && <Check className="w-3 h-3 text-white ml-auto shrink-0" strokeWidth={3} />}
                </div>
                <p className={`text-[10px] leading-tight ${myFactToday ? 'text-white/60' : 'text-[#b0b0b0]'}`}>
                  {myFactToday ? "Shared" : "Not yet"}
                </p>
              </div>
              <div className={`rounded-xl p-3.5 flex flex-col gap-1.5 transition-colors ${
                partnerFactToday ? 'bg-[#1C1C1C]' : 'bg-[#FAF9F7] border border-black/5'
              }`}>
                <div className="flex items-center gap-2">
                  <img src={partnerUser.avatar} alt={partnerUser.name} className="w-5 h-5 rounded-full" />
                  <span className={`text-[11px] font-semibold truncate ${partnerFactToday ? 'text-white' : 'text-[#737373]'}`}>
                    {hasPartner ? partnerUser.name : "Partner"}
                  </span>
                  {partnerFactToday && <Check className="w-3 h-3 text-white ml-auto shrink-0" strokeWidth={3} />}
                </div>
                <p className={`text-[10px] leading-tight ${partnerFactToday ? 'text-white/60' : 'text-[#b0b0b0]'}`}>
                  {!hasPartner ? "Invite to join" : partnerFactToday ? "Shared" : "Waiting..."}
                </p>
              </div>
            </div>

            {myFactToday && partnerFactToday ? (
              <Link href="/archive" className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#1C1C1C] text-white text-sm font-semibold hover:bg-black transition-all active:scale-[0.98] shadow-sm" data-testid="link-view-archive">
                <Sparkles className="w-4 h-4" />
                Both shared — reveal discoveries
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : myFactToday ? (
              <button onClick={startEditing} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#FAF9F7] text-[#737373] text-sm font-semibold hover:bg-[#F0EEEA] transition-all border border-black/5" data-testid="button-edit-fact">
                <Pencil className="w-3.5 h-3.5" />
                Edit your discovery
              </button>
            ) : (
              <button
                onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setIsAdding(true); }}
                className="w-full bg-[#1C1C1C] text-white rounded-xl py-3.5 px-6 flex items-center justify-center gap-2.5 font-semibold text-sm transition-all active:scale-[0.98] hover:bg-black shadow-sm"
                data-testid="card-add-discovery"
              >
                <Send className="w-4 h-4" />
                Share your discovery
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-1 md:px-0">
        <div className={`rounded-2xl border transition-colors ${
          bothAnswered ? 'bg-[#F0EEEA] border-[#E0DDD8]' : 'bg-white border-black/5'
        }`} data-testid="card-daily-question">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-9 h-9 rounded-xl bg-[#1C1C1C] flex items-center justify-center shrink-0">
              <MessageCircle className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#909090] uppercase">Daily Question</p>
              <p className="text-[11px] text-[#b0b0b0] mt-0.5">{dailyQuestion.category}</p>
            </div>
            {bothAnswered && (
              <span className="text-[9px] font-bold tracking-wider text-[#1C1C1C] bg-[#E0DDD8] px-2.5 py-1 rounded-full uppercase shrink-0">Done</span>
            )}
          </div>

          <div className="px-5 pb-5">
            <p className="font-serif text-[1.05rem] md:text-lg text-[#1C1C1C] leading-relaxed mb-4" data-testid="text-daily-question">
              {dailyQuestion.text}
            </p>

            {!myAnswer ? (
              <div className="space-y-3">
                <textarea
                  ref={answerTextareaRef}
                  value={answerText}
                  onChange={(e) => {
                    setAnswerText(e.target.value);
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                  }}
                  placeholder="Type your answer..."
                  className="w-full bg-[#FAF9F7] rounded-xl px-4 py-3 text-sm text-[#1C1C1C] placeholder:text-[#c0c0c0] resize-none focus:outline-none focus:ring-2 focus:ring-black/5 font-serif leading-relaxed border border-black/5"
                  rows={2}
                  data-testid="input-daily-answer"
                />
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleSubmitDailyAnswer}
                    disabled={!answerText.trim() || isSubmittingAnswer}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[12px] font-semibold bg-[#1C1C1C] text-white hover:bg-black transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                    data-testid="button-submit-answer"
                  >
                    {isSubmittingAnswer ? "Sending..." : "Answer"}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : bothAnswered ? (
              <div className="space-y-2.5 animate-in fade-in duration-500">
                <div className="rounded-xl bg-white/80 px-4 py-3 border border-black/5">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-1">{activeUser.name}</p>
                  <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{myAnswer}</p>
                </div>
                <div className="rounded-xl bg-white/80 px-4 py-3 border border-black/5">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-1">{partnerUser.name}</p>
                  <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{partnerAnswer}</p>
                </div>
                {onQAReact && todayAnswer && (
                  <div className="flex items-center gap-1 pt-1">
                    {([
                      { type: 'heart' as ReactionType, Icon: Heart, active: 'bg-rose-500 text-white', hover: 'hover:text-rose-500 hover:bg-rose-50', fill: true },
                      { type: 'mind-blown' as ReactionType, Icon: Brain, active: 'bg-black text-white', hover: 'hover:text-black hover:bg-black/5' },
                      { type: 'laugh' as ReactionType, Icon: Laugh, active: 'bg-amber-100 text-amber-700', hover: 'hover:text-amber-600 hover:bg-amber-50' },
                      { type: 'thinking' as ReactionType, Icon: Lightbulb, active: 'bg-blue-100 text-blue-700', hover: 'hover:text-blue-600 hover:bg-blue-50' },
                    ]).map(({ type, Icon, active, hover, fill }) => (
                      <button
                        key={type}
                        onClick={() => onQAReact(todayAnswer.id, type)}
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-[10px] transition-all active:scale-95 ${
                          myQAReaction === type ? active : `text-[#b0b0b0] ${hover}`
                        }`}
                        data-testid={`button-qa-react-${type}`}
                      >
                        <Icon className={`w-4 h-4 ${fill && myQAReaction === type ? 'fill-white' : ''}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#1C1C1C] p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <img src={activeUser.avatar} alt={activeUser.name} className="w-5 h-5 rounded-full" />
                    <span className="text-[11px] font-semibold text-white truncate">{activeUser.name}</span>
                    <Check className="w-3 h-3 text-white ml-auto shrink-0" strokeWidth={3} />
                  </div>
                  <p className="text-[10px] text-white/60">Answered</p>
                </div>
                <div className="rounded-xl bg-[#FAF9F7] p-3.5 flex flex-col gap-1.5 border border-black/5">
                  <div className="flex items-center gap-2">
                    <img src={partnerUser.avatar} alt={partnerUser.name} className="w-5 h-5 rounded-full" />
                    <span className="text-[11px] font-semibold text-[#737373] truncate">{hasPartner ? partnerUser.name : "Partner"}</span>
                    <Lock className="w-3 h-3 text-[#b0b0b0] ml-auto shrink-0" />
                  </div>
                  <p className="text-[10px] text-[#b0b0b0]">{hasPartner ? "Waiting..." : "Invite to join"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {onSubmitGratitude && (
        <div className="px-1 md:px-0">
          <div className={`rounded-2xl border transition-colors ${
            bothGratitudesDone ? 'bg-rose-50/50 border-rose-100' : 'bg-white border-black/5'
          }`} data-testid="card-daily-gratitude">
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <HandHeart className="w-4.5 h-4.5 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold tracking-[0.2em] text-[#909090] uppercase">Daily Gratitude</p>
                <p className="text-[11px] text-[#b0b0b0] mt-0.5">One thing you appreciate about {hasPartner ? partnerUser.name : 'your partner'}</p>
              </div>
              {bothGratitudesDone && (
                <span className="text-[9px] font-bold tracking-wider text-rose-600 bg-rose-100 px-2.5 py-1 rounded-full uppercase shrink-0">Done</span>
              )}
            </div>

            <div className="px-5 pb-5">
              {!myGratitude ? (
                <div className="space-y-3">
                  <textarea
                    ref={gratitudeTextareaRef}
                    value={gratitudeText}
                    onChange={(e) => {
                      setGratitudeText(e.target.value);
                      const el = e.target;
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                    }}
                    placeholder={`Today I appreciate ${hasPartner ? partnerUser.name : 'my partner'} for...`}
                    className="w-full bg-[#FAF9F7] rounded-xl px-4 py-3 text-sm text-[#1C1C1C] placeholder:text-[#c0c0c0] resize-none focus:outline-none focus:ring-2 focus:ring-rose-100 font-serif leading-relaxed border border-black/5"
                    rows={2}
                    data-testid="input-daily-gratitude"
                  />
                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleSubmitGratitude}
                      disabled={!gratitudeText.trim() || isSubmittingGratitude}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[12px] font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                      data-testid="button-submit-gratitude"
                    >
                      {isSubmittingGratitude ? "Sending..." : "Share"}
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : bothGratitudesDone ? (
                <div className="space-y-2.5 animate-in fade-in duration-500">
                  <div className="rounded-xl bg-white/80 px-4 py-3 border border-rose-100">
                    <p className="text-[10px] font-bold tracking-[0.15em] text-rose-400 uppercase mb-1">{activeUser.name}</p>
                    <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{myGratitude}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 px-4 py-3 border border-rose-100">
                    <p className="text-[10px] font-bold tracking-[0.15em] text-rose-400 uppercase mb-1">{partnerUser.name}</p>
                    <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{partnerGratitude}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-rose-500 p-3.5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <img src={activeUser.avatar} alt={activeUser.name} className="w-5 h-5 rounded-full" />
                      <span className="text-[11px] font-semibold text-white truncate">{activeUser.name}</span>
                      <Check className="w-3 h-3 text-white ml-auto shrink-0" strokeWidth={3} />
                    </div>
                    <p className="text-[10px] text-white/60">Shared</p>
                  </div>
                  <div className="rounded-xl bg-[#FAF9F7] p-3.5 flex flex-col gap-1.5 border border-black/5">
                    <div className="flex items-center gap-2">
                      <img src={partnerUser.avatar} alt={partnerUser.name} className="w-5 h-5 rounded-full" />
                      <span className="text-[11px] font-semibold text-[#737373] truncate">{partnerUser.name}</span>
                      <Lock className="w-3 h-3 text-[#b0b0b0] ml-auto shrink-0" />
                    </div>
                    <p className="text-[10px] text-[#b0b0b0]">Waiting...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {onAddJournalEntry && (
        <div className="px-1 md:px-0">
          <div className="rounded-2xl border border-black/5 bg-white" data-testid="card-capture-memory">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EDEAE6] flex items-center justify-center shrink-0">
                  <PenLine className="w-4.5 h-4.5 text-[#8B7E74]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#909090] uppercase">Capture a Memory</p>
                  <p className="text-[11px] text-[#b0b0b0] mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
                </div>
              </div>
              {!showJournalComposer && (
                <button
                  onClick={() => { setShowJournalComposer(true); setTimeout(() => journalTextareaRef.current?.focus(), 150); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold bg-[#1C1C1C] text-white hover:bg-black transition-all active:scale-95 shadow-sm"
                  data-testid="button-open-journal"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Add
                </button>
              )}
            </div>

            <AnimatePresence>
              {showJournalComposer && (
                <motion.div
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-3">
                    <textarea
                      ref={journalTextareaRef}
                      value={journalText}
                      onChange={(e) => {
                        setJournalText(e.target.value);
                        const el = e.target;
                        el.style.height = 'auto';
                        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
                      }}
                      placeholder="What happened today? How did it feel?"
                      className="w-full bg-[#FAF9F7] rounded-xl px-4 py-3 text-sm text-[#1C1C1C] placeholder:text-[#c0c0c0] resize-none focus:outline-none focus:ring-2 focus:ring-black/5 font-serif leading-relaxed border border-black/5"
                      rows={3}
                      data-testid="input-journal-text"
                    />

                    {journalImage && (
                      <div className="relative inline-block">
                        <img
                          src={journalImage}
                          alt="Preview"
                          className="rounded-xl max-h-48 object-cover border border-black/5"
                          data-testid="img-journal-preview"
                        />
                        <button
                          onClick={() => setJournalImage(null)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                          data-testid="button-remove-journal-image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          ref={journalFileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleJournalImagePick}
                          className="hidden"
                          data-testid="input-journal-image"
                        />
                        <button
                          onClick={() => journalFileInputRef.current?.click()}
                          disabled={compressingImage}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium text-[#737373] hover:text-[#1C1C1C] hover:bg-black/5 transition-all active:scale-95 border border-black/5"
                          data-testid="button-add-journal-image"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          {compressingImage ? 'Processing...' : 'Photo'}
                        </button>
                        <button
                          onClick={() => { setShowJournalComposer(false); setJournalText(""); setJournalImage(null); }}
                          className="px-3 py-2 rounded-full text-[11px] font-medium text-[#b0b0b0] hover:text-[#737373] hover:bg-black/5 transition-all"
                          data-testid="button-cancel-journal"
                        >
                          Cancel
                        </button>
                      </div>
                      <button
                        onClick={handleSubmitJournal}
                        disabled={(!journalText.trim() && !journalImage) || isSubmittingJournal}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[12px] font-semibold bg-[#1C1C1C] text-white hover:bg-black transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                        data-testid="button-submit-journal"
                      >
                        {isSubmittingJournal ? "Saving..." : "Save"}
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
