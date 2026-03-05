import { useState, useMemo, useCallback, useRef } from "react";
import { Fact, User, DailyAnswer, ReactionType, JournalEntry, Bookmark } from "@/lib/mock-data";
import { getLocalDateStr } from "@/lib/date-utils";
import { format, differenceInDays } from "date-fns";
import { Heart, Rewind, Sparkles, Star, Shuffle, Brain, Laugh, Lightbulb, Award, Gem, BookOpen, MessageCircle, Camera, X, Send, ImageIcon, Trash2, PenLine, Bookmark as BookmarkIcon, BookmarkCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatText } from "@/lib/format-text";
import { compressImage } from "@/lib/image-utils";

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

export default function Memories({
  facts,
  dailyAnswers,
  activeUser,
  partnerUser,
  onReact,
  onQAReact,
  reactingFacts,
  anniversaryDate,
  journalEntries,
  onAddJournalEntry,
  onDeleteJournalEntry,
  bookmarks = [],
  onToggleBookmark,
}: {
  facts: Fact[];
  dailyAnswers: DailyAnswer[];
  activeUser: User;
  partnerUser: User;
  onReact?: (factId: string, reaction: string | null) => void;
  onQAReact?: (answerId: string, reaction: string | null) => void;
  reactingFacts?: Set<string>;
  anniversaryDate?: string | null;
  journalEntries: JournalEntry[];
  onAddJournalEntry: (text: string, imageData?: string) => Promise<void>;
  onDeleteJournalEntry: (entryId: string) => Promise<void>;
  bookmarks?: Bookmark[];
  onToggleBookmark?: (itemType: 'fact' | 'qa', itemId: string) => void;
}) {
  const [randomFact, setRandomFact] = useState<Fact | null>(null);
  const [randomRevealed, setRandomRevealed] = useState(false);
  const todayStr = getLocalDateStr();
  const [ty, tm, td] = todayStr.split('-').map(Number);

  const [journalText, setJournalText] = useState("");
  const [journalImage, setJournalImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onThisDay = useMemo(() => {
    const items: MemoryItem[] = [];

    for (const f of facts) {
      const [fy, fm, fd] = f.date.split('-').map(Number);
      if (fm === tm && fd === td && fy < ty) {
        const diff = ty - fy;
        items.push({
          type: 'fact',
          label: format(new Date(fy, fm - 1, fd), 'MMM d, yyyy'),
          timeAgo: diff === 1 ? '1 year ago' : `${diff} years ago`,
          data: f,
          priority: diff,
        });
      }
    }

    for (const a of dailyAnswers) {
      const [ay, am, ad] = a.date.split('-').map(Number);
      if (am === tm && ad === td && ay < ty && Object.keys(a.answers || {}).length >= 2) {
        const diff = ty - ay;
        items.push({
          type: 'qa',
          label: format(new Date(ay, am - 1, ad), 'MMM d, yyyy'),
          timeAgo: diff === 1 ? '1 year ago' : `${diff} years ago`,
          data: a,
          priority: diff,
        });
      }
    }

    for (const f of facts) {
      const [fy, fm, fd] = f.date.split('-').map(Number);
      if (fd === td && (fy < ty || (fy === ty && fm < tm))) {
        if (fm === tm && fd === td && fy < ty) continue;
        const monthsDiff = (ty - fy) * 12 + (tm - fm);
        if (monthsDiff >= 1 && monthsDiff <= 11) {
          items.push({
            type: 'fact',
            label: format(new Date(fy, fm - 1, fd), 'MMM d, yyyy'),
            timeAgo: monthsDiff === 1 ? '1 month ago' : `${monthsDiff} months ago`,
            data: f,
            priority: monthsDiff * 0.1,
          });
        }
      }
    }

    for (const a of dailyAnswers) {
      const [ay, am, ad] = a.date.split('-').map(Number);
      if (ad === td && (ay < ty || (ay === ty && am < tm)) && Object.keys(a.answers || {}).length >= 2) {
        if (am === tm && ad === td && ay < ty) continue;
        const monthsDiff = (ty - ay) * 12 + (tm - am);
        if (monthsDiff >= 1 && monthsDiff <= 11) {
          items.push({
            type: 'qa',
            label: format(new Date(ay, am - 1, ad), 'MMM d, yyyy'),
            timeAgo: monthsDiff === 1 ? '1 month ago' : `${monthsDiff} months ago`,
            data: a,
            priority: monthsDiff * 0.1,
          });
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

    const pd = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    if (sorted.length > 0) {
      list.push({
        label: 'First Discovery',
        description: `Shared on ${format(pd(sorted[0].date), 'MMM d, yyyy')}`,
        fact: sorted[0],
        icon: Star,
        achieved: true,
      });
    }

    if (completedQAs.length > 0) {
      list.push({
        label: 'First Q&A Together',
        description: `Answered on ${format(pd(completedQAs[0].date), 'MMM d, yyyy')}`,
        qa: completedQAs[0],
        icon: MessageCircle,
        achieved: true,
      });
    }

    const milestoneNumbers = [10, 25, 50, 100, 250, 500];
    for (const n of milestoneNumbers) {
      if (sorted.length >= n) {
        list.push({
          label: `${n} Discoveries`,
          description: `Reached on ${format(pd(sorted[n - 1].date), 'MMM d, yyyy')}`,
          fact: sorted[n - 1],
          icon: n >= 100 ? Gem : Award,
          achieved: true,
        });
      } else {
        list.push({
          label: `${n} Discoveries`,
          description: `${n - sorted.length} more to go`,
          icon: n >= 100 ? Gem : Award,
          achieved: false,
        });
        break;
      }
    }

    const qaMilestones = [10, 25, 50, 100];
    for (const n of qaMilestones) {
      if (completedQAs.length >= n) {
        list.push({
          label: `${n} Q&As Answered`,
          description: `Reached on ${format(pd(completedQAs[n - 1].date), 'MMM d, yyyy')}`,
          qa: completedQAs[n - 1],
          icon: MessageCircle,
          achieved: true,
        });
      } else if (completedQAs.length > 0) {
        list.push({
          label: `${n} Q&As Answered`,
          description: `${n - completedQAs.length} more to go`,
          icon: MessageCircle,
          achieved: false,
        });
        break;
      }
    }

    return list;
  }, [facts, dailyAnswers]);

  const stats = useMemo(() => {
    const totalFacts = facts.length;
    const totalQAs = dailyAnswers.filter(a => Object.keys(a.answers || {}).length >= 2).length;

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
        if (diff === 1) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
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

    return { totalFacts, totalQAs, longestStreak, daysTogether, mostReactedFact };
  }, [facts, dailyAnswers, activeUser.id, partnerUser.id, anniversaryDate, todayStr]);

  const handleRediscover = useCallback(() => {
    if (facts.length === 0) return;
    const oldFacts = facts.filter(f => f.date !== todayStr);
    const pool = oldFacts.length > 0 ? oldFacts : facts;
    const idx = Math.floor(Math.random() * pool.length);
    setRandomFact(pool[idx]);
    setRandomRevealed(true);
  }, [facts, todayStr]);

  const parseDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setCompressingImage(true);
    try {
      const compressed = await compressImage(file);
      setJournalImage(compressed);
    } catch {
      // silently fail
    } finally {
      setCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmitJournal = async () => {
    if (isSubmitting) return;
    if (!journalText.trim() && !journalImage) return;
    setIsSubmitting(true);
    try {
      await onAddJournalEntry(journalText.trim(), journalImage || undefined);
      setJournalText("");
      setJournalImage(null);
      setShowComposer(false);
    } catch {
      // handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedJournal = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    for (const entry of journalEntries) {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [journalEntries]);

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto py-6 md:py-10 flex flex-col gap-6">
      <header className="text-center md:text-left">
        <h1 className="text-[2rem] md:text-[3.5rem] font-serif text-[#1C1C1C] tracking-tight leading-tight">
          Memories
        </h1>
        <p className="text-base text-[#909090] italic font-serif mt-2">
          The moments that made you, together.
        </p>
      </header>

      <section data-testid="section-capture">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EDEAE6] flex items-center justify-center shrink-0">
              <PenLine className="w-4.5 h-4.5 text-[#8B7E74]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C]">Capture Today</h2>
              <p className="text-[11px] text-[#b0b0b0]">{format(new Date(ty, tm - 1, td), 'EEEE, MMMM d')}</p>
            </div>
          </div>
          {!showComposer && (
            <button
              onClick={() => { setShowComposer(true); setTimeout(() => textareaRef.current?.focus(), 150); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold bg-[#1C1C1C] text-white hover:bg-black transition-all active:scale-95 shadow-sm"
              data-testid="button-open-journal"
            >
              <Camera className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>

        <AnimatePresence>
          {showComposer && (
            <motion.div
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="rounded-2xl bg-white border border-black/5 overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <textarea
                  ref={textareaRef}
                  value={journalText}
                  onChange={(e) => {
                    setJournalText(e.target.value);
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
                  }}
                  placeholder="What happened today? How did it feel?"
                  maxLength={2000}
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
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImagePick}
                      className="hidden"
                      data-testid="input-journal-image"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={compressingImage}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium text-[#737373] hover:text-[#1C1C1C] hover:bg-black/5 transition-all active:scale-95 border border-black/5"
                      data-testid="button-add-journal-image"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      {compressingImage ? 'Processing...' : 'Photo'}
                    </button>
                    <button
                      onClick={() => { setShowComposer(false); setJournalText(""); setJournalImage(null); }}
                      className="px-3 py-2 rounded-full text-[11px] font-medium text-[#b0b0b0] hover:text-[#737373] hover:bg-black/5 transition-all"
                      data-testid="button-cancel-journal"
                    >
                      Cancel
                    </button>
                  </div>
                  <button
                    onClick={handleSubmitJournal}
                    disabled={(!journalText.trim() && !journalImage) || isSubmitting}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[12px] font-semibold bg-[#1C1C1C] text-white hover:bg-black transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                    data-testid="button-submit-journal"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-[#c0c0c0] text-right">{journalText.length}/2000</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {groupedJournal.length > 0 && (
          <div className="space-y-3 mt-4">
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
                          {isMe && (
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
        )}
      </section>

      {stats.totalFacts > 0 && (
        <div className="grid grid-cols-2 gap-3" data-testid="section-stats">
          <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{stats.totalFacts}</p>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mt-1">Discoveries</p>
          </div>
          <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{stats.totalQAs}</p>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mt-1">Q&As Together</p>
          </div>
          {stats.daysTogether !== null && stats.daysTogether >= 0 && (
            <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{stats.daysTogether}</p>
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mt-1">Days Together</p>
            </div>
          )}
          <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{stats.longestStreak}</p>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mt-1">Longest Streak</p>
          </div>
        </div>
      )}

      {bookmarks.length > 0 && (
        <section data-testid="section-saved">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#EDEAE6] flex items-center justify-center shrink-0">
              <BookmarkCheck className="w-4.5 h-4.5 text-[#8B7E74]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C]">Saved</h2>
              <p className="text-[11px] text-[#b0b0b0]">{bookmarks.length} {bookmarks.length === 1 ? 'item' : 'items'} bookmarked</p>
            </div>
          </div>
          <div className="space-y-3">
            {bookmarks.sort((a, b) => b.savedAt.localeCompare(a.savedAt)).map((bm, i) => {
              const item = bm.itemType === 'fact'
                ? facts.find(f => f.id === bm.itemId)
                : dailyAnswers.find(a => a.id === bm.itemId);
              if (!item) return null;
              return (
                <motion.div
                  key={`saved-${bm.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl bg-white border border-black/5 overflow-hidden"
                >
                  <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-[0.15em] text-[#b0b0b0] uppercase">
                      {bm.itemType === 'fact' ? 'Discovery' : 'Q&A'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#c0c0c0]">
                        {(() => { const [y, m, d] = (item as any).date.split('-').map(Number); return format(new Date(y, m - 1, d), 'MMM d, yyyy'); })()}
                      </span>
                      {onToggleBookmark && (
                        <button
                          onClick={() => onToggleBookmark(bm.itemType, bm.itemId)}
                          className="p-1 rounded-full text-[#1C1C1C] hover:bg-black/5 transition-all active:scale-90"
                          aria-label="Remove bookmark"
                          data-testid={`button-unsave-${bm.itemType}-${bm.itemId}`}
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="px-5 pb-4 pt-2">
                    {bm.itemType === 'fact' ? (
                      <FactCard fact={item as Fact} activeUser={activeUser} partnerUser={partnerUser} />
                    ) : (
                      <QACard qa={item as DailyAnswer} activeUser={activeUser} partnerUser={partnerUser} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
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
                    <FactCard fact={item.data as Fact} activeUser={activeUser} partnerUser={partnerUser} />
                  ) : (
                    <QACard qa={item.data as DailyAnswer} activeUser={activeUser} partnerUser={partnerUser} />
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
                <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.15em] text-[#b0b0b0] uppercase">
                    {format(parseDate(randomFact.date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="px-5 pb-3 pt-2">
                  <FactCard fact={randomFact} activeUser={activeUser} partnerUser={partnerUser} />
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

      {stats.mostReactedFact && (
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
                {format(parseDate(stats.mostReactedFact.date), 'MMM d, yyyy')}
              </span>
              <span className="text-[10px] text-[#c0c0c0]">{Object.keys(stats.mostReactedFact.reactions || {}).length} reactions</span>
            </div>
            <div className="px-5 pb-4 pt-2">
              <FactCard fact={stats.mostReactedFact} activeUser={activeUser} partnerUser={partnerUser} />
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
                    m.achieved
                      ? 'bg-white border-black/5'
                      : 'bg-[#FAF9F7] border-dashed border-black/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    m.achieved ? 'bg-amber-50' : 'bg-black/[0.03]'
                  }`}>
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EDEAE6] flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-[#8B7E74]" />
          </div>
          <p className="text-lg font-serif text-[#1C1C1C] mb-2">No memories yet</p>
          <p className="text-sm text-[#909090] max-w-[260px]">
            Start sharing discoveries and capturing moments to build your memory collection.
          </p>
        </div>
      )}
    </div>
  );
}

function FactCard({ fact, activeUser, partnerUser }: { fact: Fact; activeUser: User; partnerUser: User }) {
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
            <span key={c} className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.1em] uppercase ${c === 'Us' ? 'bg-rose-50 text-rose-500' : 'bg-[#FAF9F7] text-[#909090]'}`}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function QACard({ qa, activeUser, partnerUser }: { qa: DailyAnswer; activeUser: User; partnerUser: User }) {
  const myAns = qa.answers[activeUser.id];
  const partAns = qa.answers[partnerUser.id];

  return (
    <div>
      <p className="font-serif text-sm text-[#1C1C1C] leading-relaxed mb-2.5">{qa.questionText}</p>
      <div className="space-y-2">
        {myAns && (
          <div className="rounded-xl bg-[#FAF9F7] px-3.5 py-2.5 border border-black/5">
            <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-0.5">{activeUser.name}</p>
            <p className="text-[13px] text-[#1C1C1C] font-serif leading-relaxed">{myAns}</p>
          </div>
        )}
        {partAns && (
          <div className="rounded-xl bg-[#FAF9F7] px-3.5 py-2.5 border border-black/5">
            <p className="text-[9px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-0.5">{partnerUser.name}</p>
            <p className="text-[13px] text-[#1C1C1C] font-serif leading-relaxed">{partAns}</p>
          </div>
        )}
      </div>
    </div>
  );
}
