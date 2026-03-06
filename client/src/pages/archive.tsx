import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Fact, User, DailyAnswer, ReactionType, Bookmark, JournalEntry, DailyGratitude } from "@/lib/mock-data";
import { getLocalDateStr } from "@/lib/date-utils";
import { format, differenceInDays } from "date-fns";
import { Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, Filter, Sparkles, Brain, Laugh, Lightbulb, BookOpen, MessageCircle, Search, X, Bookmark as BookmarkIcon, BookmarkCheck, Rewind, Shuffle, Award, Gem, Star, PenLine, Trash2, MapPin, HandHeart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatText } from "@/lib/format-text";
import { VALID_CATEGORIES_LIST } from "@/lib/firestore";
import { QUESTION_CATEGORIES } from "@/lib/daily-questions";

type TabMode = "discoveries" | "questions" | "memories";

type MemoryItem = {
  type: 'fact' | 'qa';
  label: string;
  timeAgo: string;
  data: Fact | DailyAnswer;
  priority: number;
};

type Milestone = {
  label: string;
  description: string;
  fact?: Fact;
  qa?: DailyAnswer;
  icon: React.ElementType;
  achieved: boolean;
};

export default function Archive({
  facts, onReact, onQAReact, activeUser, partnerUser, reactingFacts, dailyAnswers,
  gratitudes = [], bookmarks = [], onToggleBookmark,
  anniversaryDate, journalEntries = [], onDeleteJournalEntry,
}: {
  facts: Fact[],
  onReact: (factId: string, reaction: string | null) => void,
  onQAReact?: (answerId: string, reaction: string | null) => void,
  activeUser: User,
  partnerUser: User,
  reactingFacts?: Set<string>,
  dailyAnswers: DailyAnswer[],
  gratitudes?: DailyGratitude[],
  bookmarks?: Bookmark[],
  onToggleBookmark?: (itemType: 'fact' | 'qa', itemId: string) => void,
  anniversaryDate?: string | null,
  journalEntries?: JournalEntry[],
  onDeleteJournalEntry?: (entryId: string) => Promise<void>,
}) {
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterQACategories, setFilterQACategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showQAFilters, setShowQAFilters] = useState(false);
  const [burstReaction, setBurstReaction] = useState<{id: string, type: string} | null>(null);
  const [todayStr, setTodayStr] = useState(() => getLocalDateStr());
  const [activeTab, setActiveTab] = useState<TabMode>("discoveries");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showQASavedOnly, setShowQASavedOnly] = useState(false);
  const [showQASearch, setShowQASearch] = useState(false);
  const [qaSearchQuery, setQASearchQuery] = useState("");
  const qaSearchInputRef = useRef<HTMLInputElement>(null);
  const [randomFact, setRandomFact] = useState<Fact | null>(null);
  const [randomRevealed, setRandomRevealed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const bookmarkedFactIds = new Set(bookmarks.filter(b => b.itemType === 'fact').map(b => b.itemId));
  const bookmarkedQAIds = new Set(bookmarks.filter(b => b.itemType === 'qa').map(b => b.itemId));
  useEffect(() => {
    const check = setInterval(() => {
      const now = getLocalDateStr();
      if (now !== todayStr) setTodayStr(now);
    }, 30000);
    return () => clearInterval(check);
  }, [todayStr]);
  useEffect(() => {
    return () => { if (burstTimerRef.current) clearTimeout(burstTimerRef.current); };
  }, []);

  const [ty, tm, td] = todayStr.split('-').map(Number);

  const searchLower = searchQuery.toLowerCase().trim();

  const filteredFacts = facts.filter(fact => {
    if (showSavedOnly && !bookmarkedFactIds.has(fact.id)) return false;
    if (filterPerson && fact.authorId !== filterPerson) return false;
    if (filterCategories.length > 0 && !fact.categories.some(c => filterCategories.includes(c))) return false;
    if (searchLower && !fact.text.toLowerCase().includes(searchLower)) return false;
    return true;
  });

  const groupedFacts = filteredFacts.reduce((acc, fact) => {
    if (!acc[fact.date]) {
      acc[fact.date] = [];
    }
    acc[fact.date].push(fact);
    return acc;
  }, {} as Record<string, Fact[]>);

  const sortedDates = Object.keys(groupedFacts).sort((a, b) => b.localeCompare(a));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'History': return <Globe className="w-3 h-3" />;
      case 'Etymology': return <BookA className="w-3 h-3" />;
      case 'Science': return <Microscope className="w-3 h-3" />;
      case 'Space': return <Telescope className="w-3 h-3" />;
      case 'Art': return <Palette className="w-3 h-3" />;
      case 'Geography': return <MapPin className="w-3 h-3" />;
      case 'Us': return <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />;
      default: return <HelpCircle className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    if (category === 'Us') return 'bg-rose-50 text-rose-600 border-none';
    return 'bg-[#FAF9F7] text-[#737373] border-none';
  };

  const handleReact = (factId: string, type: 'mind-blown' | 'heart' | 'laugh' | 'thinking') => {
    if (reactingFacts?.has(factId)) return;
    const fact = facts.find(f => f.id === factId);
    const currentReaction = fact?.reactions?.[activeUser.id];
    const isRemoving = currentReaction === type;

    if (navigator.vibrate) navigator.vibrate(50);
    if (!isRemoving) {
      setBurstReaction({ id: factId, type });
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      burstTimerRef.current = setTimeout(() => {
        setBurstReaction(null);
      }, 1000);
    }
    onReact(factId, type);
  };

  const hasPartner = partnerUser.id !== "0";

  const throwback = useMemo(() => {
    if (!hasPartner) return null;
    const candidates: { type: 'fact' | 'qa'; label: string; data: Fact | DailyAnswer }[] = [];
    for (const f of facts) {
      const [fy, fm, fd] = f.date.split('-').map(Number);
      if (fm === tm && fd === td && fy < ty) {
        const diff = ty - fy;
        candidates.push({ type: 'fact', label: diff === 1 ? '1 year ago' : `${diff} years ago`, data: f });
      }
    }
    for (const a of dailyAnswers) {
      const [ay, am, ad] = a.date.split('-').map(Number);
      if (am === tm && ad === td && ay < ty && Object.keys(a.answers || {}).length >= 2) {
        const diff = ty - ay;
        candidates.push({ type: 'qa', label: diff === 1 ? '1 year ago' : `${diff} years ago`, data: a });
      }
    }
    for (const f of facts) {
      const [fy, fm, fd] = f.date.split('-').map(Number);
      if (fd === td && (fy < ty || (fy === ty && fm < tm))) {
        if (fm === tm && fd === td && fy < ty) continue;
        const monthsDiff = (ty - fy) * 12 + (tm - fm);
        if (monthsDiff >= 1 && monthsDiff <= 11) {
          candidates.push({ type: 'fact', label: monthsDiff === 1 ? '1 month ago' : `${monthsDiff} months ago`, data: f });
        }
      }
    }
    for (const a of dailyAnswers) {
      const [ay, am, ad] = a.date.split('-').map(Number);
      if (ad === td && (ay < ty || (ay === ty && am < tm)) && Object.keys(a.answers || {}).length >= 2) {
        if (am === tm && ad === td && ay < ty) continue;
        const monthsDiff = (ty - ay) * 12 + (tm - am);
        if (monthsDiff >= 1 && monthsDiff <= 11) {
          candidates.push({ type: 'qa', label: monthsDiff === 1 ? '1 month ago' : `${monthsDiff} months ago`, data: a });
        }
      }
    }
    if (candidates.length === 0) return null;
    const seed = todayStr.split('-').reduce((a, b) => a + parseInt(b), 0);
    return candidates[seed % candidates.length];
  }, [facts, dailyAnswers, todayStr, hasPartner]);

  const completedAnswers = dailyAnswers.filter(a => {
    const answers = a.answers || {};
    if (!(activeUser.id in answers && partnerUser.id in answers)) return false;
    if (showQASavedOnly && !bookmarkedQAIds.has(a.id)) return false;
    if (filterQACategories.length > 0 && !filterQACategories.includes(a.category)) return false;
    const qaSearchLower = qaSearchQuery.toLowerCase().trim();
    if (qaSearchLower) {
      const questionMatch = a.questionText.toLowerCase().includes(qaSearchLower);
      const answerMatch = Object.values(a.answers || {}).some(ans => typeof ans === 'string' && ans.toLowerCase().includes(qaSearchLower));
      if (!questionMatch && !answerMatch) return false;
    }
    return true;
  });

  const completedGratitudes = gratitudes.filter(g => {
    const entries = g.entries || {};
    return activeUser.id in entries && partnerUser.id in entries;
  });

  const gratitudeByDate = useMemo(() => {
    const map: Record<string, DailyGratitude> = {};
    for (const g of completedGratitudes) {
      map[g.date] = g;
    }
    return map;
  }, [completedGratitudes]);

  const togetherDates = useMemo(() => {
    const dateSet = new Set<string>();
    for (const a of completedAnswers) dateSet.add(a.date);
    for (const g of completedGratitudes) dateSet.add(g.date);
    return [...dateSet].sort((a, b) => b.localeCompare(a));
  }, [completedAnswers, completedGratitudes]);

  const qaByDate = useMemo(() => {
    const map: Record<string, DailyAnswer> = {};
    for (const a of completedAnswers) map[a.date] = a;
    return map;
  }, [completedAnswers]);

  const uniqueDays = new Set(facts.map(f => f.date)).size;
  const totalFacts = facts.length;
  const totalQA = dailyAnswers.filter(a => Object.keys(a.answers || {}).length >= 2).length;

  const onThisDay = useMemo(() => {
    const items: MemoryItem[] = [];
    for (const f of facts) {
      const [fy, fm, fd] = f.date.split('-').map(Number);
      if (fm === tm && fd === td && fy < ty) {
        const diff = ty - fy;
        items.push({ type: 'fact', label: format(new Date(fy, fm - 1, fd), 'MMM d, yyyy'), timeAgo: diff === 1 ? '1 year ago' : `${diff} years ago`, data: f, priority: diff });
      }
    }
    for (const a of dailyAnswers) {
      const [ay, am, ad] = a.date.split('-').map(Number);
      if (am === tm && ad === td && ay < ty && Object.keys(a.answers || {}).length >= 2) {
        const diff = ty - ay;
        items.push({ type: 'qa', label: format(new Date(ay, am - 1, ad), 'MMM d, yyyy'), timeAgo: diff === 1 ? '1 year ago' : `${diff} years ago`, data: a, priority: diff });
      }
    }
    for (const f of facts) {
      const [fy, fm, fd] = f.date.split('-').map(Number);
      if (fd === td && (fy < ty || (fy === ty && fm < tm))) {
        if (fm === tm && fd === td && fy < ty) continue;
        const monthsDiff = (ty - fy) * 12 + (tm - fm);
        if (monthsDiff >= 1 && monthsDiff <= 11) {
          items.push({ type: 'fact', label: format(new Date(fy, fm - 1, fd), 'MMM d, yyyy'), timeAgo: monthsDiff === 1 ? '1 month ago' : `${monthsDiff} months ago`, data: f, priority: monthsDiff * 0.1 });
        }
      }
    }
    for (const a of dailyAnswers) {
      const [ay, am, ad] = a.date.split('-').map(Number);
      if (ad === td && (ay < ty || (ay === ty && am < tm)) && Object.keys(a.answers || {}).length >= 2) {
        if (am === tm && ad === td && ay < ty) continue;
        const monthsDiff = (ty - ay) * 12 + (tm - am);
        if (monthsDiff >= 1 && monthsDiff <= 11) {
          items.push({ type: 'qa', label: format(new Date(ay, am - 1, ad), 'MMM d, yyyy'), timeAgo: monthsDiff === 1 ? '1 month ago' : `${monthsDiff} months ago`, data: a, priority: monthsDiff * 0.1 });
        }
      }
    }
    items.sort((a, b) => b.priority - a.priority);
    return items;
  }, [facts, dailyAnswers, todayStr]);

  const milestones = useMemo(() => {
    const sorted = [...facts].sort((a, b) => a.date.localeCompare(b.date));
    const completedQAs = dailyAnswers
      .filter(a => Object.keys(a.answers || {}).length >= 2)
      .sort((a, b) => a.date.localeCompare(b.date));
    const list: Milestone[] = [];
    const pd = (dateStr: string) => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); };
    if (sorted.length > 0) {
      list.push({ label: 'First Discovery', description: `Shared on ${format(pd(sorted[0].date), 'MMM d, yyyy')}`, fact: sorted[0], icon: Star, achieved: true });
    }
    if (completedQAs.length > 0) {
      list.push({ label: 'First Q&A Together', description: `Answered on ${format(pd(completedQAs[0].date), 'MMM d, yyyy')}`, qa: completedQAs[0], icon: MessageCircle, achieved: true });
    }
    const milestoneNumbers = [10, 25, 50, 100, 250, 500];
    for (const n of milestoneNumbers) {
      if (sorted.length >= n) {
        list.push({ label: `${n} Discoveries`, description: `Reached on ${format(pd(sorted[n - 1].date), 'MMM d, yyyy')}`, fact: sorted[n - 1], icon: n >= 100 ? Gem : Award, achieved: true });
      } else {
        list.push({ label: `${n} Discoveries`, description: `${n - sorted.length} more to go`, icon: n >= 100 ? Gem : Award, achieved: false });
        break;
      }
    }
    const qaMilestones = [10, 25, 50, 100];
    for (const n of qaMilestones) {
      if (completedQAs.length >= n) {
        list.push({ label: `${n} Q&As Answered`, description: `Reached on ${format(pd(completedQAs[n - 1].date), 'MMM d, yyyy')}`, qa: completedQAs[n - 1], icon: MessageCircle, achieved: true });
      } else if (completedQAs.length > 0) {
        list.push({ label: `${n} Q&As Answered`, description: `${n - completedQAs.length} more to go`, icon: MessageCircle, achieved: false });
        break;
      }
    }
    return list;
  }, [facts, dailyAnswers]);

  const memStats = useMemo(() => {
    const allDates = [...new Set(facts.map(f => f.date))].sort();
    let longestStreak = 0;
    let currentStreak = 0;
    if (allDates.length > 0) {
      currentStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < allDates.length; i++) {
        const prev = allDates[i - 1].split('-').map(Number);
        const curr = allDates[i].split('-').map(Number);
        const prevDate = new Date(prev[0], prev[1] - 1, prev[2]);
        const currDate = new Date(curr[0], curr[1] - 1, curr[2]);
        const diff = differenceInDays(currDate, prevDate);
        if (diff === 1) { currentStreak++; longestStreak = Math.max(longestStreak, currentStreak); } else { currentStreak = 1; }
      }
    }
    let daysTogether: number | null = null;
    if (anniversaryDate) {
      const [ay, am, ad] = anniversaryDate.split('-').map(Number);
      daysTogether = differenceInDays(new Date(ty, tm - 1, td), new Date(ay, am - 1, ad));
    }
    const mostReactedFact = facts.reduce<Fact | null>((best, f) => {
      const count = Object.keys(f.reactions || {}).length;
      if (count > 0 && (!best || count > Object.keys(best.reactions || {}).length)) return f;
      return best;
    }, null);
    return { longestStreak, daysTogether, mostReactedFact };
  }, [facts, anniversaryDate, todayStr]);

  const handleRediscover = useCallback(() => {
    if (facts.length === 0) return;
    const oldFacts = facts.filter(f => f.date !== todayStr);
    const pool = oldFacts.length > 0 ? oldFacts : facts;
    const idx = Math.floor(Math.random() * pool.length);
    setRandomFact(pool[idx]);
    setRandomRevealed(true);
  }, [facts, todayStr]);

  const parseDate = (dateStr: string) => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); };

  const groupedJournal = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    for (const entry of journalEntries) {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [journalEntries]);

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto py-4 md:py-8 flex flex-col min-h-[calc(100vh-140px)]">

      <header className="mb-5 md:mb-8 shrink-0">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-[#1C1C1C] tracking-tight leading-tight" data-testid="text-archive-title">
              Your story
            </h1>
            {totalFacts > 0 && (
              <p className="text-[11px] text-[#b0b0b0] mt-1 font-medium" data-testid="text-archive-stats">
                {totalFacts} {totalFacts === 1 ? 'discovery' : 'discoveries'}{totalQA > 0 ? ` · ${totalQA} conversations` : ''} · {uniqueDays} {uniqueDays === 1 ? 'day' : 'days'}
              </p>
            )}
          </div>
        </div>

        {throwback && activeTab !== "memories" && (
          <div className="mb-5" data-testid="card-throwback">
            <div className="rounded-2xl bg-[#1C1C1C] overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-4 pb-2">
                <Rewind className="w-4 h-4 text-white/50" />
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">{throwback.label}</p>
              </div>
              <div className="px-5 pb-5">
                {throwback.type === 'fact' ? (() => {
                  const f = throwback.data as Fact;
                  const authorName = f.authorId === activeUser.id ? activeUser.name : partnerUser.name;
                  const authorAvatar = f.authorId === activeUser.id ? activeUser.avatar : partnerUser.avatar;
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <img src={authorAvatar} alt={authorName} className="w-4 h-4 rounded-full opacity-60" />
                        <p className="text-[10px] font-bold tracking-[0.15em] text-white/40 uppercase">{authorName}</p>
                      </div>
                      <div className="text-sm text-white/90 font-serif leading-relaxed">{formatText(f.text)}</div>
                    </div>
                  );
                })() : (() => {
                  const a = throwback.data as DailyAnswer;
                  const myAns = a.answers[activeUser.id];
                  const partAns = a.answers[partnerUser.id];
                  return (
                    <div>
                      <p className="font-serif text-sm text-white/90 leading-relaxed mb-3">{a.questionText}</p>
                      <div className="space-y-2">
                        {myAns && (
                          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <img src={activeUser.avatar} alt={activeUser.name} className="w-4 h-4 rounded-full opacity-60" />
                              <p className="text-[9px] font-bold tracking-[0.15em] text-white/40 uppercase">{activeUser.name}</p>
                            </div>
                            <p className="text-[13px] text-white/80 font-serif leading-relaxed">{myAns}</p>
                          </div>
                        )}
                        {partAns && (
                          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <img src={partnerUser.avatar} alt={partnerUser.name} className="w-4 h-4 rounded-full opacity-60" />
                              <p className="text-[9px] font-bold tracking-[0.15em] text-white/40 uppercase">{partnerUser.name}</p>
                            </div>
                            <p className="text-[13px] text-white/80 font-serif leading-relaxed">{partAns}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-[#FAF9F7] rounded-full p-1 shrink-0 relative">
            {(["discoveries", "questions", "memories"] as TabMode[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { if (navigator.vibrate) navigator.vibrate(20); setActiveTab(tab); }}
                className={`px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-all relative z-10 flex items-center gap-1.5 ${
                  activeTab === tab ? "text-white" : "text-[#909090] hover:text-black"
                }`}
                data-testid={`tab-${tab === "questions" ? "questions" : tab}`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-[#1C1C1C] rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab === "memories" && <Sparkles className="w-3 h-3" />}
                  {tab === "discoveries" ? "Discoveries" : tab === "questions" ? "Q&A" : "Memories"}
                </span>
              </button>
            ))}
          </div>

          {activeTab === "discoveries" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-colors shrink-0 ${showSavedOnly ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#1C1C1C] hover:bg-black/5'}`}
                data-testid="button-toggle-saved"
              >
                {showSavedOnly ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkIcon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { setShowSearch(!showSearch); if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 100); else setSearchQuery(""); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-colors shrink-0 ${showSearch || searchQuery ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#1C1C1C] hover:bg-black/5'}`}
                data-testid="button-toggle-search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-colors shrink-0 ${showFilters || filterPerson || filterCategories.length > 0 ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#1C1C1C] hover:bg-black/5'}`}
                data-testid="button-toggle-filters"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {activeTab === "questions" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowQASavedOnly(!showQASavedOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-colors shrink-0 ${showQASavedOnly ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#1C1C1C] hover:bg-black/5'}`}
                data-testid="button-toggle-qa-saved"
              >
                {showQASavedOnly ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkIcon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { setShowQASearch(!showQASearch); if (!showQASearch) setTimeout(() => qaSearchInputRef.current?.focus(), 100); else setQASearchQuery(""); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-colors shrink-0 ${showQASearch || qaSearchQuery ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#1C1C1C] hover:bg-black/5'}`}
                data-testid="button-toggle-qa-search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setShowQAFilters(!showQAFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-colors shrink-0 ${showQAFilters || filterQACategories.length > 0 ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#1C1C1C] hover:bg-black/5'}`}
                data-testid="button-toggle-qa-filters"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showSearch && activeTab === "discoveries" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0b0b0]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search discoveries..."
                  className="w-full bg-[#FAF9F7] rounded-xl pl-10 pr-10 py-3 text-sm text-[#1C1C1C] placeholder:text-[#c0c0c0] focus:outline-none focus:ring-2 focus:ring-black/5 font-serif border border-black/5"
                  data-testid="input-search"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#909090]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showQASearch && activeTab === "questions" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0b0b0]" />
                <input
                  ref={qaSearchInputRef}
                  type="text"
                  value={qaSearchQuery}
                  onChange={(e) => setQASearchQuery(e.target.value)}
                  placeholder="Search questions & answers..."
                  className="w-full bg-[#FAF9F7] rounded-xl pl-10 pr-10 py-3 text-sm text-[#1C1C1C] placeholder:text-[#c0c0c0] focus:outline-none focus:ring-2 focus:ring-black/5 font-serif border border-black/5"
                  data-testid="input-qa-search"
                />
                {qaSearchQuery && (
                  <button onClick={() => setQASearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#909090]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === "discoveries" && showFilters && (
          <div className="mt-4 p-4 bg-[#FAF9F7] rounded-2xl animate-in slide-in-from-top-2 duration-200 border border-black/5">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-2.5 text-left">By Person</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterPerson(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === null ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`} data-testid="filter-everyone">Everyone</button>
                  <button onClick={() => setFilterPerson(activeUser.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === activeUser.id ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`} data-testid="filter-me">Me</button>
                  {partnerUser.id !== "0" && (
                    <button onClick={() => setFilterPerson(partnerUser.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === partnerUser.id ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`} data-testid="filter-partner">{partnerUser.name}</button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-2.5 text-left">By Category</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterCategories([])} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategories.length === 0 ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`} data-testid="filter-category-all">All</button>
                  {VALID_CATEGORIES_LIST.map(cat => (
                    <button key={cat} onClick={() => setFilterCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategories.includes(cat) ? (cat === 'Us' ? 'bg-rose-50 text-rose-600' : 'bg-black text-white') : 'bg-white text-[#737373] hover:bg-black/5'}`} data-testid={`filter-category-${cat.toLowerCase()}`}>{cat}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "questions" && showQAFilters && (
          <div className="mt-4 p-4 bg-[#FAF9F7] rounded-2xl animate-in slide-in-from-top-2 duration-200 border border-black/5">
            <div>
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-2.5 text-left">By Category</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterQACategories([])} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterQACategories.length === 0 ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`} data-testid="filter-qa-category-all">All</button>
                {QUESTION_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setFilterQACategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterQACategories.includes(cat) ? (cat === 'Us' ? 'bg-rose-50 text-rose-600' : 'bg-black text-white') : 'bg-white text-[#737373] hover:bg-black/5'}`} data-testid={`filter-qa-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}>{cat}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {activeTab === "memories" ? (
        <MemoriesTab
          facts={facts}
          dailyAnswers={dailyAnswers}
          activeUser={activeUser}
          partnerUser={partnerUser}
          onThisDay={onThisDay}
          milestones={milestones}
          memStats={memStats}
          totalFacts={totalFacts}
          totalQA={totalQA}
          journalEntries={journalEntries}
          groupedJournal={groupedJournal}
          onDeleteJournalEntry={onDeleteJournalEntry}
          randomFact={randomFact}
          randomRevealed={randomRevealed}
          handleRediscover={handleRediscover}
          parseDate={parseDate}
          todayStr={todayStr}
          bookmarks={bookmarks}
          onToggleBookmark={onToggleBookmark}
        />
      ) : activeTab === "questions" ? (
        <div className="space-y-6 flex-1 flex flex-col">
          {togetherDates.length > 0 ? (
            togetherDates.map((date, dateIdx) => {
              const qa = qaByDate[date];
              const grat = gratitudeByDate[date];
              const dateLabel = date === todayStr
                ? <><span className="text-[#1C1C1C]">Today</span> · {(() => { const [y, m, d] = date.split('-').map(Number); return format(new Date(y, m - 1, d), 'MMM d'); })()}</>
                : (() => { const [y, m, d] = date.split('-').map(Number); return format(new Date(y, m - 1, d), 'MMMM d, yyyy'); })();
              return (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(dateIdx * 0.08, 0.8) }}
                  className="space-y-3"
                >
                  <p className="text-[10px] font-bold tracking-[0.15em] text-[#b0b0b0] uppercase px-1">
                    {dateLabel}
                  </p>

                  {qa && (() => {
                    const myAns = qa.answers[activeUser.id];
                    const partnerAns = qa.answers[partnerUser.id];
                    const myQAReaction = qa.reactions?.[activeUser.id] as ReactionType | undefined;
                    const partnerQAReaction = qa.reactions?.[partnerUser.id] as ReactionType | undefined;
                    return (
                      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden" data-testid={`card-qa-${qa.id}`}>
                        <div className="px-5 pt-4 pb-1 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FAF9F7] flex items-center justify-center shrink-0">
                            <MessageCircle className="w-3.5 h-3.5 text-[#909090]" />
                          </div>
                          <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase flex-1">
                            Q&A
                            <span className="ml-2 text-[#c0c0c0]">{qa.category}</span>
                          </p>
                          {onToggleBookmark && (
                            <button
                              onClick={() => onToggleBookmark('qa', qa.id)}
                              className={`p-1.5 rounded-full transition-all active:scale-90 ${bookmarkedQAIds.has(qa.id) ? 'text-[#1C1C1C]' : 'text-[#c0c0c0] hover:text-[#909090]'}`}
                              aria-label={bookmarkedQAIds.has(qa.id) ? "Remove bookmark" : "Bookmark"}
                              data-testid={`button-bookmark-qa-${qa.id}`}
                            >
                              {bookmarkedQAIds.has(qa.id) ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        <div className="px-5 pb-4">
                          <p className="font-serif text-[15px] text-[#1C1C1C] leading-relaxed mb-3">{qa.questionText}</p>
                          <div className="space-y-2">
                            {myAns && (
                              <div className="rounded-xl bg-[#FAF9F7] px-4 py-3 border border-black/5">
                                <div className="flex items-center gap-2 mb-1">
                                  <img src={activeUser.avatar} alt={activeUser.name} className="w-4 h-4 rounded-full" />
                                  <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase">{activeUser.name}</p>
                                </div>
                                <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{myAns}</p>
                              </div>
                            )}
                            {partnerAns && (
                              <div className="rounded-xl bg-[#FAF9F7] px-4 py-3 border border-black/5">
                                <div className="flex items-center gap-2 mb-1">
                                  <img src={partnerUser.avatar} alt={partnerUser.name} className="w-4 h-4 rounded-full" />
                                  <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase">{partnerUser.name}</p>
                                </div>
                                <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{partnerAns}</p>
                              </div>
                            )}
                          </div>
                          {onQAReact && (
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
                              <div className="flex items-center gap-0.5">
                                {([
                                  { type: 'heart' as ReactionType, Icon: Heart, active: 'bg-rose-500 text-white', hover: 'hover:text-rose-500 hover:bg-rose-50', fill: true },
                                  { type: 'mind-blown' as ReactionType, Icon: Brain, active: 'bg-black text-white', hover: 'hover:text-black hover:bg-black/5' },
                                  { type: 'laugh' as ReactionType, Icon: Laugh, active: 'bg-amber-100 text-amber-700', hover: 'hover:text-amber-600 hover:bg-amber-50' },
                                  { type: 'thinking' as ReactionType, Icon: Lightbulb, active: 'bg-blue-100 text-blue-700', hover: 'hover:text-blue-600 hover:bg-blue-50' },
                                ]).map(({ type, Icon, active, hover, fill }) => (
                                  <button
                                    key={type}
                                    onClick={() => onQAReact(qa.id, type)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                                      myQAReaction === type ? active : `text-[#c0c0c0] ${hover}`
                                    }`}
                                    data-testid={`button-qa-react-${type}-${qa.id}`}
                                  >
                                    <Icon className={`w-3.5 h-3.5 ${fill && myQAReaction === type ? 'fill-white' : ''}`} />
                                  </button>
                                ))}
                              </div>
                              {partnerQAReaction && (
                                <div className="flex items-center gap-1.5 text-[#909090] text-[10px] font-bold tracking-wider uppercase">
                                  {partnerQAReaction === 'heart' && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />}
                                  {partnerQAReaction === 'mind-blown' && <Brain className="w-3.5 h-3.5 shrink-0" />}
                                  {partnerQAReaction === 'laugh' && <Laugh className="w-3.5 h-3.5 shrink-0" />}
                                  {partnerQAReaction === 'thinking' && <Lightbulb className="w-3.5 h-3.5 shrink-0" />}
                                  <span className="truncate">{partnerUser.name}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {grat && (() => {
                    const myGrat = grat.entries[activeUser.id];
                    const partnerGrat = grat.entries[partnerUser.id];
                    return (
                      <div className="bg-rose-50/40 rounded-2xl border border-rose-100/60 overflow-hidden" data-testid={`card-gratitude-${grat.id}`}>
                        <div className="px-5 pt-4 pb-1 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-100/60 flex items-center justify-center shrink-0">
                            <HandHeart className="w-3.5 h-3.5 text-rose-400" />
                          </div>
                          <p className="text-[10px] font-bold tracking-[0.15em] text-rose-400/80 uppercase flex-1">
                            Gratitude
                          </p>
                        </div>
                        <div className="px-5 pb-4">
                          <div className="space-y-2">
                            {myGrat && (
                              <div className="rounded-xl bg-rose-50/50 px-4 py-3 border border-rose-100/50">
                                <div className="flex items-center gap-2 mb-1">
                                  <img src={activeUser.avatar} alt={activeUser.name} className="w-4 h-4 rounded-full" />
                                  <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase">{activeUser.name}</p>
                                </div>
                                <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{myGrat}</p>
                              </div>
                            )}
                            {partnerGrat && (
                              <div className="rounded-xl bg-rose-50/50 px-4 py-3 border border-rose-100/50">
                                <div className="flex items-center gap-2 mb-1">
                                  <img src={partnerUser.avatar} alt={partnerUser.name} className="w-4 h-4 rounded-full" />
                                  <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase">{partnerUser.name}</p>
                                </div>
                                <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{partnerGrat}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              );
            })
          ) : dailyAnswers.filter(a => Object.keys(a.answers || {}).length >= 2).length > 0 && togetherDates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col justify-center items-center py-16 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#F0EEEA] flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-[#b0b0b0]" />
              </div>
              <p className="text-[#909090] font-serif italic text-lg mb-1">No conversations match</p>
              <p className="text-[#c0c0c0] text-xs mb-4">Try adjusting your filters</p>
              <button
                onClick={() => { setFilterQACategories([]); setQASearchQuery(""); setShowQASavedOnly(false); }}
                className="text-xs font-bold tracking-widest uppercase text-[#909090] hover:text-black transition-colors px-4 py-2 rounded-full hover:bg-black/5"
                data-testid="button-clear-qa-filters"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 flex flex-col justify-center items-center py-16"
            >
              <div className="flex flex-col items-center justify-center text-center px-6 max-w-sm">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl bg-[#EDEAE6] flex items-center justify-center mb-6"
                >
                  <MessageCircle className="w-7 h-7 text-[#8B7E74]" strokeWidth={1.5} />
                </motion.div>
                <h3 className="font-serif text-xl text-[#1C1C1C] mb-2">Conversations live here</h3>
                <p className="text-[#909090] text-sm leading-relaxed">
                  Answer today's question together and your shared answers will appear here.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-6 flex-1 flex flex-col">
          {sortedDates.length > 0 ? (
            sortedDates.map((date, dateIdx) => {
              const dateFacts = groupedFacts[date];
              const allFactsForDate = facts.filter(f => f.date === date);
              const iPostedThisDate = allFactsForDate.some(f => f.authorId === activeUser.id);
              const dateLabel = date === todayStr
                ? <><span className="text-[#1C1C1C]">Today</span> · {(() => { const [y, m, d] = date.split('-').map(Number); return format(new Date(y, m - 1, d), 'MMM d'); })()}</>
                : (() => { const [y, m, d] = date.split('-').map(Number); return format(new Date(y, m - 1, d), 'MMMM d, yyyy'); })();
              return (
                <div key={date}>
                  <p className="text-[10px] font-bold tracking-[0.15em] text-[#b0b0b0] uppercase mb-3 px-1">
                    {dateLabel}
                  </p>
                  <div className="space-y-3">
                    {dateFacts.map((fact, index) => {
                      const isMe = fact.authorId === activeUser.id;
                      const author = isMe ? activeUser : partnerUser;
                      const isAboutUs = fact.categories.includes('Us');
                      const isHidden = !isMe && !iPostedThisDate;
                      const myReaction = fact.reactions?.[activeUser.id];

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: Math.min(index * 0.08 + dateIdx * 0.04, 0.6) }}
                          key={fact.id}
                        >
                          {isHidden ? (
                            <div className="rounded-2xl bg-[#FAF9F7] border border-dashed border-black/10 py-5 px-4 text-center">
                              <p className="text-sm font-serif italic text-black/30 flex items-center justify-center gap-2">
                                {date === todayStr && <span className="w-1.5 h-1.5 rounded-full bg-black/10 animate-ping" style={{ animationDuration: '1.5s' }}></span>}
                                {date === todayStr ? "Sealed until you share yours" : "You didn\u2019t share that day"}
                                {date === todayStr && <span className="w-1.5 h-1.5 rounded-full bg-black/10 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}></span>}
                              </p>
                            </div>
                          ) : (
                            <div className={`rounded-2xl overflow-hidden ${isAboutUs ? 'bg-rose-50/30' : 'bg-white'} border border-black/5`}>
                              <div className="px-5 pt-4 pb-1 flex items-center gap-2">
                                <img src={author.avatar} alt={author.name} className="w-5 h-5 rounded-full" />
                                <span className="text-[10px] font-bold tracking-[0.12em] text-[#909090] uppercase">{author.name}</span>
                                <div className="flex items-center gap-1 ml-auto">
                                  {fact.categories.map((category) => (
                                    <div key={category} className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold ${getCategoryColor(category)}`}>
                                      {getCategoryIcon(category)}
                                      {category}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="px-5 pt-2 pb-3">
                                <div className={`font-serif leading-relaxed text-[15px] md:text-base ${isAboutUs ? 'text-rose-950' : 'text-[#1C1C1C]'}`}>
                                  {formatText(fact.text)}
                                </div>
                              </div>

                              <div className="px-5 pb-3 flex items-center justify-between">
                                <div className="flex items-center gap-0.5">
                                  {onToggleBookmark && (
                                    <button
                                      onClick={() => onToggleBookmark('fact', fact.id)}
                                      className={`p-1.5 rounded-full transition-all active:scale-90 ${bookmarkedFactIds.has(fact.id) ? 'text-[#1C1C1C]' : 'text-[#d0d0d0] hover:text-[#909090]'}`}
                                      aria-label={bookmarkedFactIds.has(fact.id) ? "Remove bookmark" : "Bookmark"}
                                      data-testid={`button-bookmark-fact-${fact.id}`}
                                    >
                                      {bookmarkedFactIds.has(fact.id) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkIcon className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                </div>

                                {!isMe && (
                                  <div className="flex items-center gap-0.5">
                                    {([
                                      { type: 'heart' as const, Icon: Heart, active: 'bg-rose-500 text-white', hover: 'hover:text-rose-500 hover:bg-rose-50', fill: true },
                                      { type: 'mind-blown' as const, Icon: Brain, active: 'bg-black text-white', hover: 'hover:text-black hover:bg-black/5' },
                                      { type: 'laugh' as const, Icon: Laugh, active: 'bg-amber-100 text-amber-700', hover: 'hover:text-amber-600 hover:bg-amber-50' },
                                      { type: 'thinking' as const, Icon: Lightbulb, active: 'bg-blue-100 text-blue-700', hover: 'hover:text-blue-600 hover:bg-blue-50' },
                                    ]).map(({ type, Icon, active, hover, fill }) => (
                                      <div key={type} className="relative">
                                        <button
                                          onClick={() => handleReact(fact.id, type)}
                                          aria-label={`React ${type}`}
                                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                                            myReaction === type ? active : `text-[#c0c0c0] ${hover}`
                                          }`}
                                          data-testid={`button-react-${type}-${fact.id}`}
                                        >
                                          <Icon className={`w-3.5 h-3.5 ${fill && myReaction === type ? 'fill-white' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                          {burstReaction?.id === fact.id && burstReaction?.type === type && (
                                            <motion.div
                                              initial={{ opacity: 1, y: 0, scale: 1 }}
                                              animate={{ opacity: 0, y: -30, scale: 1.4 }}
                                              exit={{ opacity: 0 }}
                                              transition={{ duration: 0.7, ease: "easeOut" }}
                                              className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                                            >
                                              <Icon className={`w-5 h-5 ${type === 'heart' ? 'text-rose-500 fill-rose-500' : type === 'laugh' ? 'text-amber-500' : type === 'thinking' ? 'text-blue-500' : 'text-[#1C1C1C]'}`} />
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {isMe && fact.reactions?.[partnerUser.id] && (
                                  <div className="flex items-center gap-1.5 text-[#909090] text-[10px] font-bold tracking-wider uppercase animate-in zoom-in-95 duration-300">
                                    {fact.reactions[partnerUser.id] === 'heart' && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />}
                                    {fact.reactions[partnerUser.id] === 'mind-blown' && <Brain className="w-3.5 h-3.5 shrink-0" />}
                                    {fact.reactions[partnerUser.id] === 'laugh' && <Laugh className="w-3.5 h-3.5 shrink-0" />}
                                    {fact.reactions[partnerUser.id] === 'thinking' && <Lightbulb className="w-3.5 h-3.5 shrink-0" />}
                                    <span className="truncate">{partnerUser.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : facts.length > 0 && filteredFacts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col justify-center items-center py-16 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#F0EEEA] flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-[#b0b0b0]" />
              </div>
              <p className="text-[#909090] font-serif italic text-lg mb-1">No discoveries match</p>
              <p className="text-[#c0c0c0] text-xs mb-4">Try adjusting your filters</p>
              <button
                onClick={() => { setFilterPerson(null); setFilterCategories([]); setSearchQuery(""); setShowSavedOnly(false); }}
                className="text-xs font-bold tracking-widest uppercase text-[#909090] hover:text-black transition-colors px-4 py-2 rounded-full hover:bg-black/5"
                data-testid="button-clear-filters"
              >
                Clear all
              </button>
            </motion.div>
          ) : facts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 flex flex-col justify-center items-center py-16"
            >
              <div className="flex flex-col items-center justify-center text-center px-6 max-w-sm">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl bg-[#EDEAE6] flex items-center justify-center mb-6"
                >
                  <BookOpen className="w-7 h-7 text-[#8B7E74]" strokeWidth={1.5} />
                </motion.div>
                <h3 className="font-serif text-xl text-[#1C1C1C] mb-2">Your story starts today</h3>
                <p className="text-[#909090] text-sm leading-relaxed">
                  Share your first discovery and watch your collection grow together.
                </p>
              </div>
            </motion.div>
          ) : null}
        </div>
      )}

    </div>
  );
}

function MemoriesTab({
  facts, dailyAnswers, activeUser, partnerUser,
  onThisDay, milestones, memStats, totalFacts, totalQA,
  journalEntries, groupedJournal, onDeleteJournalEntry,
  randomFact, randomRevealed, handleRediscover, parseDate, todayStr,
  bookmarks, onToggleBookmark,
}: {
  facts: Fact[];
  dailyAnswers: DailyAnswer[];
  activeUser: User;
  partnerUser: User;
  onThisDay: MemoryItem[];
  milestones: Milestone[];
  memStats: { longestStreak: number; daysTogether: number | null; mostReactedFact: Fact | null };
  totalFacts: number;
  totalQA: number;
  journalEntries: JournalEntry[];
  groupedJournal: [string, JournalEntry[]][];
  onDeleteJournalEntry?: (entryId: string) => Promise<void>;
  randomFact: Fact | null;
  randomRevealed: boolean;
  handleRediscover: () => void;
  parseDate: (d: string) => Date;
  todayStr: string;
  bookmarks: Bookmark[];
  onToggleBookmark?: (itemType: 'fact' | 'qa', itemId: string) => void;
}) {
  const [ty, tm, td] = todayStr.split('-').map(Number);

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">

      {groupedJournal.length > 0 && (
        <section data-testid="section-journal-entries">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#EDEAE6] flex items-center justify-center shrink-0">
              <PenLine className="w-4.5 h-4.5 text-[#8B7E74]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C]">Journal</h2>
              <p className="text-[11px] text-[#b0b0b0]">Your shared moments</p>
            </div>
          </div>
          <div className="space-y-3">
            {groupedJournal.map(([date, entries]) => (
              <div key={date}>
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#b0b0b0] uppercase mb-2 px-1">
                  {format(parseDate(date), 'EEEE, MMMM d, yyyy')}
                </p>
                <div className="space-y-2">
                  {entries.map(entry => {
                    const isMe = entry.authorId === activeUser.id;
                    const authorName = isMe ? activeUser.name : partnerUser.name;
                    const authorAvatar = isMe ? activeUser.avatar : partnerUser.avatar;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-white border border-black/5 overflow-hidden"
                      >
                        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={authorAvatar} alt={authorName} className="w-5 h-5 rounded-full" />
                            <span className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase">{authorName}</span>
                          </div>
                          {isMe && onDeleteJournalEntry && (
                            <button
                              onClick={() => onDeleteJournalEntry(entry.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-full text-[#c0c0c0] hover:text-red-400 hover:bg-red-50 transition-all"
                              data-testid={`button-delete-journal-${entry.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="px-5 pb-4">
                          {entry.text && (
                            <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed mb-2">{entry.text}</p>
                          )}
                          {entry.imageData && (
                            <img
                              src={entry.imageData}
                              alt="Memory"
                              className="rounded-xl max-w-full border border-black/5"
                              data-testid={`img-journal-${entry.id}`}
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {totalFacts > 0 && (
        <div className="grid grid-cols-2 gap-3" data-testid="section-stats">
          <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{totalFacts}</p>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mt-1">Discoveries</p>
          </div>
          <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{totalQA}</p>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mt-1">Q&As Together</p>
          </div>
          {memStats.daysTogether !== null && memStats.daysTogether >= 0 && (
            <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{memStats.daysTogether}</p>
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mt-1">Days Together</p>
            </div>
          )}
          <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{memStats.longestStreak}</p>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mt-1">Longest Streak</p>
          </div>
        </div>
      )}

      {onThisDay.length > 0 && (
        <section data-testid="section-on-this-day">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#EDEAE6] flex items-center justify-center shrink-0">
              <Rewind className="w-4.5 h-4.5 text-[#8B7E74]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C]">On This Day</h2>
              <p className="text-[11px] text-[#b0b0b0]">{format(new Date(ty, tm - 1, td), 'MMMM d')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {onThisDay.map((item, i) => (
              <motion.div
                key={`otd-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl bg-white border border-black/5 overflow-hidden"
              >
                <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.15em] text-[#b0b0b0] uppercase">{item.timeAgo}</span>
                  <span className="text-[10px] text-[#c0c0c0]">{item.label}</span>
                </div>
                <div className="px-5 pb-4 pt-2">
                  {item.type === 'fact' ? (
                    <MemFactCard fact={item.data as Fact} activeUser={activeUser} partnerUser={partnerUser} />
                  ) : (
                    <MemQACard qa={item.data as DailyAnswer} activeUser={activeUser} partnerUser={partnerUser} />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {facts.length > 1 && (
        <section data-testid="section-rediscover">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#EDEAE6] flex items-center justify-center shrink-0">
              <Shuffle className="w-4.5 h-4.5 text-[#8B7E74]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C]">Rediscover</h2>
              <p className="text-[11px] text-[#b0b0b0]">A random memory from your collection</p>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {!randomRevealed ? (
              <motion.button
                key="reveal-btn"
                onClick={handleRediscover}
                className="w-full rounded-2xl bg-white border border-black/5 p-6 flex flex-col items-center gap-3 hover:border-black/10 transition-all active:scale-[0.99] group"
                data-testid="button-rediscover"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FAF9F7] flex items-center justify-center group-hover:bg-[#EDEAE6] transition-colors">
                  <Sparkles className="w-5 h-5 text-[#8B7E74]" />
                </div>
                <span className="text-sm font-medium text-[#737373]">Tap to reveal a random memory</span>
              </motion.button>
            ) : randomFact ? (
              <motion.div
                key={`random-${randomFact.id}`}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                className="rounded-2xl bg-white border border-black/5 overflow-hidden"
              >
                <div className="px-5 pt-4 pb-1">
                  <span className="text-[10px] font-bold tracking-[0.15em] text-[#b0b0b0] uppercase">
                    {format(parseDate(randomFact.date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="px-5 pb-3 pt-2">
                  <MemFactCard fact={randomFact} activeUser={activeUser} partnerUser={partnerUser} />
                </div>
                <div className="px-5 pb-4 flex justify-center">
                  <button
                    onClick={handleRediscover}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold text-[#737373] hover:text-[#1C1C1C] hover:bg-black/5 transition-all active:scale-95"
                    data-testid="button-rediscover-another"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    Another one
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      )}

      {memStats.mostReactedFact && (
        <section data-testid="section-most-loved">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <Heart className="w-4.5 h-4.5 text-rose-400 fill-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C]">Most Loved</h2>
              <p className="text-[11px] text-[#b0b0b0]">The discovery with the most reactions</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-black/5 overflow-hidden">
            <div className="px-5 pt-4 pb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.15em] text-[#b0b0b0] uppercase">
                {format(parseDate(memStats.mostReactedFact.date), 'MMM d, yyyy')}
              </span>
              <span className="text-[10px] text-[#c0c0c0]">{Object.keys(memStats.mostReactedFact.reactions || {}).length} reactions</span>
            </div>
            <div className="px-5 pb-4 pt-2">
              <MemFactCard fact={memStats.mostReactedFact} activeUser={activeUser} partnerUser={partnerUser} />
            </div>
          </div>
        </section>
      )}

      {milestones.length > 0 && (
        <section data-testid="section-milestones">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Award className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C]">Milestones</h2>
              <p className="text-[11px] text-[#b0b0b0]">Your journey together</p>
            </div>
          </div>
          <div className="space-y-2">
            {milestones.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={`milestone-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${
                    m.achieved ? 'bg-white border-black/5' : 'bg-[#FAF9F7] border-dashed border-black/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.achieved ? 'bg-amber-50' : 'bg-black/[0.03]'}`}>
                    <Icon className={`w-4 h-4 ${m.achieved ? 'text-amber-500' : 'text-[#c0c0c0]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${m.achieved ? 'text-[#1C1C1C]' : 'text-[#b0b0b0]'}`}>{m.label}</p>
                    <p className="text-[11px] text-[#b0b0b0] mt-0.5">{m.description}</p>
                  </div>
                  {m.achieved && (
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {facts.length === 0 && dailyAnswers.length === 0 && journalEntries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 flex flex-col items-center justify-center py-16 text-center"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-[#EDEAE6] flex items-center justify-center mb-6"
          >
            <Sparkles className="w-7 h-7 text-[#8B7E74]" />
          </motion.div>
          <p className="text-lg font-serif text-[#1C1C1C] mb-2">Memories take shape here</p>
          <p className="text-sm text-[#909090] max-w-[260px] leading-relaxed">
            Share discoveries, answer questions, and write in your journal to build your collection.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function MemFactCard({ fact, activeUser, partnerUser }: { fact: Fact; activeUser: User; partnerUser: User }) {
  const authorName = fact.authorId === activeUser.id ? activeUser.name : partnerUser.name;
  const authorAvatar = fact.authorId === activeUser.id ? activeUser.avatar : partnerUser.avatar;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <img src={authorAvatar} alt={authorName} className="w-5 h-5 rounded-full" />
        <span className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase">{authorName}</span>
      </div>
      <div className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{formatText(fact.text)}</div>
      {fact.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {fact.categories.map(c => (
            <span key={c} className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.1em] uppercase ${c === 'Us' ? 'bg-rose-50 text-rose-500' : 'bg-[#FAF9F7] text-[#909090]'}`}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function MemQACard({ qa, activeUser, partnerUser }: { qa: DailyAnswer; activeUser: User; partnerUser: User }) {
  const myAns = qa.answers[activeUser.id];
  const partAns = qa.answers[partnerUser.id];
  return (
    <div>
      <p className="font-serif text-sm text-[#1C1C1C] leading-relaxed mb-2.5">{qa.questionText}</p>
      <div className="space-y-2">
        {myAns && (
          <div className="rounded-xl bg-[#FAF9F7] px-3.5 py-2.5 border border-black/5">
            <div className="flex items-center gap-2 mb-0.5">
              <img src={activeUser.avatar} alt={activeUser.name} className="w-4 h-4 rounded-full" />
              <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase">{activeUser.name}</p>
            </div>
            <p className="text-[13px] text-[#1C1C1C] font-serif leading-relaxed">{myAns}</p>
          </div>
        )}
        {partAns && (
          <div className="rounded-xl bg-[#FAF9F7] px-3.5 py-2.5 border border-black/5">
            <div className="flex items-center gap-2 mb-0.5">
              <img src={partnerUser.avatar} alt={partnerUser.name} className="w-4 h-4 rounded-full" />
              <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase">{partnerUser.name}</p>
            </div>
            <p className="text-[13px] text-[#1C1C1C] font-serif leading-relaxed">{partAns}</p>
          </div>
        )}
      </div>
    </div>
  );
}
