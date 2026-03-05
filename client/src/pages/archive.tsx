import { useState, useEffect, useRef, useMemo } from "react";
import { Fact, User, DailyAnswer, ReactionType, Bookmark } from "@/lib/mock-data";
import { getLocalDateStr } from "@/lib/date-utils";
import { format } from "date-fns";
import { Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, Filter, Sparkles, Brain, Laugh, Lightbulb, Frown, BookOpen, MessageCircle, Search, X, Bookmark as BookmarkIcon, BookmarkCheck, Rewind } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatText } from "@/lib/format-text";
import { VALID_CATEGORIES_LIST } from "@/lib/firestore";
import { QUESTION_CATEGORIES } from "@/lib/daily-questions";

type TabMode = "discoveries" | "questions";

export default function Archive({ facts, onReact, onQAReact, activeUser, partnerUser, reactingFacts, dailyAnswers, bookmarks = [], onToggleBookmark }: { facts: Fact[], onReact: (factId: string, reaction: string | null) => void, onQAReact?: (answerId: string, reaction: string | null) => void, activeUser: User, partnerUser: User, reactingFacts?: Set<string>, dailyAnswers: DailyAnswer[], bookmarks?: Bookmark[], onToggleBookmark?: (itemType: 'fact' | 'qa', itemId: string) => void }) {
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
      case 'Us': return <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />;
      default: return <HelpCircle className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    if (category === 'Us') return 'bg-rose-50 text-rose-600 border-none';
    return 'bg-[#FAF9F7] text-[#737373] border-none';
  };

  const handleReact = (factId: string, type: 'mind-blown' | 'fascinating' | 'heart' | 'laugh' | 'thinking' | 'sad') => {
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
    const [ty, tm, td] = todayStr.split('-').map(Number);
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
    if (showSavedOnly && !bookmarkedQAIds.has(a.id)) return false;
    if (filterQACategories.length > 0 && !filterQACategories.includes(a.category)) return false;
    return true;
  });

  const uniqueDays = new Set(facts.map(f => f.date)).size;
  const totalFacts = facts.length;
  const totalQA = dailyAnswers.filter(a => Object.keys(a.answers || {}).length >= 2).length;

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

        {throwback && (
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
                  return (
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.15em] text-white/40 uppercase mb-1.5">{authorName} shared</p>
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
                            <p className="text-[9px] font-bold tracking-[0.15em] text-white/40 uppercase mb-0.5">{activeUser.name}</p>
                            <p className="text-[13px] text-white/80 font-serif leading-relaxed">{myAns}</p>
                          </div>
                        )}
                        {partAns && (
                          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
                            <p className="text-[9px] font-bold tracking-[0.15em] text-white/40 uppercase mb-0.5">{partnerUser.name}</p>
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
          <div className="flex bg-[#FAF9F7] rounded-full p-1 shrink-0">
            <button
              onClick={() => setActiveTab("discoveries")}
              className={`px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-all ${
                activeTab === "discoveries" ? "bg-[#1C1C1C] text-white shadow-sm" : "text-[#909090] hover:text-black"
              }`}
              data-testid="tab-discoveries"
            >
              Discoveries
            </button>
            <button
              onClick={() => setActiveTab("questions")}
              className={`px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-all flex items-center gap-1.5 ${
                activeTab === "questions" ? "bg-[#1C1C1C] text-white shadow-sm" : "text-[#909090] hover:text-black"
              }`}
              data-testid="tab-questions"
            >
              <MessageCircle className="w-3 h-3" />
              Q&A
              {completedAnswers.length > 0 && (
                <span className={`text-[9px] font-bold ml-0.5 ${activeTab === "questions" ? "text-white/50" : "text-[#b0b0b0]"}`}>
                  {completedAnswers.length}
                </span>
              )}
            </button>
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
                {(filterPerson || filterCategories.length > 0) ? 'Filtered' : 'Filter'}
              </button>
            </div>
          )}
          {activeTab === "questions" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-colors shrink-0 ${showSavedOnly ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#1C1C1C] hover:bg-black/5'}`}
                data-testid="button-toggle-qa-saved"
              >
                {showSavedOnly ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkIcon className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setShowQAFilters(!showQAFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase transition-colors shrink-0 ${showQAFilters || filterQACategories.length > 0 ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#1C1C1C] hover:bg-black/5'}`}
                data-testid="button-toggle-qa-filters"
              >
                <Filter className="w-3.5 h-3.5" />
                {filterQACategories.length > 0 ? 'Filtered' : 'Filter'}
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

        {activeTab === "discoveries" && showFilters && (
          <div className="mt-4 p-4 bg-[#FAF9F7] rounded-2xl animate-in slide-in-from-top-2 duration-200 border border-black/5">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-2.5 text-left">By Person</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterPerson(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === null ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`}
                    data-testid="filter-everyone"
                  >
                    Everyone
                  </button>
                  <button
                    onClick={() => setFilterPerson(activeUser.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === activeUser.id ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`}
                    data-testid="filter-me"
                  >
                    Me
                  </button>
                  {partnerUser.id !== "0" && (
                    <button
                      onClick={() => setFilterPerson(partnerUser.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === partnerUser.id ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`}
                      data-testid="filter-partner"
                    >
                      {partnerUser.name}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-2.5 text-left">By Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterCategories([])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategories.length === 0 ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`}
                    data-testid="filter-category-all"
                  >
                    All
                  </button>
                  {VALID_CATEGORIES_LIST.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setFilterCategories(prev => 
                          prev.includes(cat) 
                            ? prev.filter(c => c !== cat) 
                            : [...prev, cat]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategories.includes(cat) ? (cat === 'Us' ? 'bg-rose-50 text-rose-600' : 'bg-black text-white') : 'bg-white text-[#737373] hover:bg-black/5'}`}
                      data-testid={`filter-category-${cat.toLowerCase()}`}
                    >
                      {cat}
                    </button>
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
                <button
                  onClick={() => setFilterQACategories([])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterQACategories.length === 0 ? 'bg-black text-white' : 'bg-white text-[#737373] hover:bg-black/5'}`}
                  data-testid="filter-qa-category-all"
                >
                  All
                </button>
                {QUESTION_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilterQACategories(prev => 
                        prev.includes(cat) 
                          ? prev.filter(c => c !== cat) 
                          : [...prev, cat]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterQACategories.includes(cat) ? (cat === 'Us' ? 'bg-rose-50 text-rose-600' : 'bg-black text-white') : 'bg-white text-[#737373] hover:bg-black/5'}`}
                    data-testid={`filter-qa-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {activeTab === "questions" ? (
        <div className="space-y-4 flex-1 flex flex-col">
          {completedAnswers.length > 0 ? (
            completedAnswers.map((qa, idx) => {
              const myAns = qa.answers[activeUser.id];
              const partnerAns = qa.answers[partnerUser.id];
              return (
                <motion.div
                  key={qa.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.08, 0.8) }}
                  className="bg-white rounded-2xl border border-black/5 overflow-hidden"
                  data-testid={`card-qa-${qa.id}`}
                >
                  <div className="px-5 pt-4 pb-1 flex items-center gap-2">
                    <p className="text-[10px] font-bold tracking-[0.15em] text-[#b0b0b0] uppercase flex-1">
                      {qa.date === todayStr ? (
                        <><span className="text-[#1C1C1C]">Today</span> · {(() => { const [y, m, d] = qa.date.split('-').map(Number); return format(new Date(y, m - 1, d), 'MMM d'); })()}</>
                      ) : (
                        (() => { const [y, m, d] = qa.date.split('-').map(Number); return format(new Date(y, m - 1, d), 'MMM d, yyyy'); })()
                      )}
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
                          <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-1">{activeUser.name}</p>
                          <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{myAns}</p>
                        </div>
                      )}
                      {partnerAns && (
                        <div className="rounded-xl bg-[#FAF9F7] px-4 py-3 border border-black/5">
                          <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-1">{partnerUser.name}</p>
                          <p className="text-sm text-[#1C1C1C] font-serif leading-relaxed">{partnerAns}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center animate-in fade-in duration-1000 py-12">
              <div className="flex flex-col items-center justify-center text-center px-6 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mb-6">
                  <MessageCircle className="w-7 h-7 text-[#b0b0b0]" strokeWidth={1.2} />
                </div>
                <h3 className="font-serif text-xl text-[#1C1C1C] mb-2">No conversations yet</h3>
                <p className="text-[#909090] text-sm leading-relaxed">
                  Answer today's question on the home page. Once you both answer, it'll appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {sortedDates.length > 0 && (
            <div className="relative">
              <div className="absolute left-[15px] md:left-[19px] top-8 bottom-0 w-px bg-black/[0.06]" />

              {sortedDates.map((date, dateIdx) => {
                const dateFacts = groupedFacts[date];
                const allFactsForDate = facts.filter(f => f.date === date);
                const iPostedThisDate = allFactsForDate.some(f => f.authorId === activeUser.id);
                return (
                  <div key={date} className="relative mb-8 last:mb-0">
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className={`w-[9px] h-[9px] md:w-[11px] md:h-[11px] rounded-full shrink-0 ml-[11px] md:ml-[14px] ${date === todayStr ? 'bg-[#1C1C1C]' : 'bg-[#c0c0c0]'}`} />
                      <h2 className="text-[11px] font-bold tracking-[0.15em] text-[#909090] uppercase">
                        {date === todayStr ? (
                          <><span className="text-[#1C1C1C]">Today</span> · {(() => { const [y, m, d] = date.split('-').map(Number); return format(new Date(y, m - 1, d), 'MMM d'); })()}</>
                        ) : (
                          (() => { const [y, m, d] = date.split('-').map(Number); return format(new Date(y, m - 1, d), 'MMMM d, yyyy'); })()
                        )}
                      </h2>
                    </div>
                    
                    <div className="pl-10 md:pl-12 space-y-4">
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
                            transition={{ duration: 0.4, delay: Math.min(index * 0.1 + dateIdx * 0.05, 0.6) }}
                            key={fact.id} 
                            className={`group ${isHidden ? 'opacity-50' : ''}`}
                          >
                            {isHidden ? (
                              <div className="py-4 px-4 rounded-xl text-center relative overflow-hidden">
                                {date === todayStr && (
                                  <>
                                    <div className="absolute inset-0 backdrop-blur-sm z-0 animate-breathe-blur"></div>
                                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
                                  </>
                                )}
                                <p className="text-sm font-serif italic text-black/40 relative z-10 flex items-center justify-center gap-2">
                                  {date === todayStr && <span className="w-1.5 h-1.5 rounded-full bg-black/10 animate-ping" style={{ animationDuration: '1.5s' }}></span>}
                                  {date === todayStr
                                    ? "Sealed until you share yours"
                                    : "You didn\u2019t share that day"}
                                  {date === todayStr && <span className="w-1.5 h-1.5 rounded-full bg-black/10 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}></span>}
                                </p>
                              </div>
                            ) : (
                              <div className={`rounded-2xl transition-all duration-300 ${isAboutUs ? 'bg-rose-50/30' : 'bg-white'} border border-black/5`}>
                                <div className="px-4 pt-4 pb-1 flex items-center gap-2">
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
                                
                                <div className="px-4 pt-2 pb-3">
                                  <div className={`font-serif leading-relaxed text-[15px] md:text-base ${isAboutUs ? 'text-rose-950' : 'text-[#1C1C1C]'}`}>
                                    {formatText(fact.text)}
                                  </div>
                                </div>

                                <div className="px-4 pb-3 flex items-center justify-between">
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
                                        { type: 'mind-blown' as const, Icon: Brain, active: 'bg-black text-white', hover: 'hover:text-black hover:bg-black/5' },
                                        { type: 'fascinating' as const, Icon: Sparkles, active: 'bg-black text-white', hover: 'hover:text-black hover:bg-black/5' },
                                        { type: 'heart' as const, Icon: Heart, active: 'bg-rose-500 text-white', hover: 'hover:text-rose-500 hover:bg-rose-50', fill: true },
                                        { type: 'laugh' as const, Icon: Laugh, active: 'bg-amber-100 text-amber-700', hover: 'hover:text-amber-600 hover:bg-amber-50' },
                                        { type: 'thinking' as const, Icon: Lightbulb, active: 'bg-blue-100 text-blue-700', hover: 'hover:text-blue-600 hover:bg-blue-50' },
                                        { type: 'sad' as const, Icon: Frown, active: 'bg-indigo-100 text-indigo-700', hover: 'hover:text-indigo-600 hover:bg-indigo-50' },
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
                                                <Icon className={`w-5 h-5 ${type === 'heart' ? 'text-rose-500 fill-rose-500' : type === 'laugh' ? 'text-amber-500' : type === 'thinking' ? 'text-blue-500' : type === 'sad' ? 'text-indigo-500' : 'text-[#1C1C1C]'}`} />
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {isMe && fact.reactions?.[partnerUser.id] && (
                                    <div className="flex items-center gap-1.5 text-[#909090] text-[10px] font-bold tracking-wider uppercase animate-in zoom-in-95 duration-300">
                                      {fact.reactions[partnerUser.id] === 'mind-blown' && <Brain className="w-3.5 h-3.5 shrink-0" />}
                                      {fact.reactions[partnerUser.id] === 'fascinating' && <Sparkles className="w-3.5 h-3.5 shrink-0" />}
                                      {fact.reactions[partnerUser.id] === 'heart' && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />}
                                      {fact.reactions[partnerUser.id] === 'laugh' && <Laugh className="w-3.5 h-3.5 shrink-0" />}
                                      {fact.reactions[partnerUser.id] === 'thinking' && <Lightbulb className="w-3.5 h-3.5 shrink-0" />}
                                      {fact.reactions[partnerUser.id] === 'sad' && <Frown className="w-3.5 h-3.5 shrink-0" />}
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
              })}
            </div>
          )}
          
          {facts.length > 0 && filteredFacts.length === 0 && (
            <div className="flex-1 flex flex-col justify-center items-center py-12 text-center animate-in fade-in duration-500">
              <p className="text-[#909090] font-serif italic text-lg">No discoveries match</p>
              <button
                onClick={() => { setFilterPerson(null); setFilterCategories([]); setSearchQuery(""); setShowSavedOnly(false); }}
                className="mt-3 text-xs font-bold tracking-widest uppercase text-[#909090] hover:text-black transition-colors"
                data-testid="button-clear-filters"
              >
                Clear filters
              </button>
            </div>
          )}

          {facts.length === 0 && (
            <div className="flex-1 flex flex-col justify-center items-center animate-in fade-in duration-1000 delay-300 py-12">
              <div className="flex flex-col items-center justify-center text-center px-6 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mb-6">
                  <BookOpen className="w-7 h-7 text-[#b0b0b0]" strokeWidth={1.2} />
                </div>
                <h3 className="font-serif text-xl text-[#1C1C1C] mb-2">Nothing here yet</h3>
                <p className="text-[#909090] text-sm leading-relaxed">
                  Share your first discovery to begin your story together.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
