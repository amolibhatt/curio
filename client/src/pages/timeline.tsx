import { useState, useMemo } from "react";
import { User } from "@/lib/mock-data";
import { Heart, Calendar, Star, Gift, Sparkles, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

type Milestone = {
  days: number;
  label: string;
  icon: React.ElementType;
  color: string;
};

const MILESTONES: Milestone[] = [
  { days: 1, label: "Day One", icon: Heart, color: "text-rose-500" },
  { days: 7, label: "One Week", icon: Star, color: "text-amber-500" },
  { days: 30, label: "One Month", icon: Sparkles, color: "text-purple-500" },
  { days: 50, label: "50 Days", icon: Star, color: "text-blue-500" },
  { days: 100, label: "100 Days", icon: PartyPopper, color: "text-amber-600" },
  { days: 150, label: "150 Days", icon: Star, color: "text-teal-500" },
  { days: 200, label: "200 Days", icon: Gift, color: "text-rose-500" },
  { days: 250, label: "250 Days", icon: Star, color: "text-indigo-500" },
  { days: 300, label: "300 Days", icon: Sparkles, color: "text-amber-500" },
  { days: 365, label: "One Year", icon: PartyPopper, color: "text-rose-600" },
  { days: 500, label: "500 Days", icon: Gift, color: "text-purple-600" },
  { days: 730, label: "Two Years", icon: PartyPopper, color: "text-amber-600" },
  { days: 1000, label: "1000 Days", icon: Star, color: "text-rose-500" },
  { days: 1095, label: "Three Years", icon: PartyPopper, color: "text-purple-500" },
  { days: 1461, label: "Four Years", icon: PartyPopper, color: "text-blue-600" },
  { days: 1826, label: "Five Years", icon: Gift, color: "text-amber-600" },
];

function DaysCounter({ days }: { days: number }) {
  const digits = String(days).split("");
  return (
    <div className="flex items-center justify-center gap-1.5 md:gap-2">
      {digits.map((digit, i) => (
        <motion.div
          key={`${i}-${digit}`}
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
          className="w-12 h-16 md:w-16 md:h-20 bg-white rounded-xl md:rounded-2xl shadow-sm border border-black/5 flex items-center justify-center"
        >
          <span className="font-serif text-3xl md:text-4xl text-[#1C1C1C]">{digit}</span>
        </motion.div>
      ))}
    </div>
  );
}

function AnniversaryCountdown({ anniversaryDate }: { anniversaryDate: string }) {
  const countdown = useMemo(() => {
    const now = new Date();
    const anniv = new Date(anniversaryDate);
    const thisYear = new Date(now.getFullYear(), anniv.getMonth(), anniv.getDate());
    let next = thisYear;
    if (thisYear < now) {
      next = new Date(now.getFullYear() + 1, anniv.getMonth(), anniv.getDate());
    }
    const diff = next.getTime() - now.getTime();
    const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (totalDays === 0 || totalDays === 365 || totalDays === 366) return { days: 0, isToday: true };
    return { days: totalDays, isToday: false };
  }, [anniversaryDate]);

  if (countdown.isToday) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-[2rem] p-6 md:p-8 text-center"
      >
        <PartyPopper className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="font-serif text-2xl md:text-3xl text-[#1C1C1C] mb-2">Happy Anniversary!</h3>
        <p className="text-[#909090] text-sm font-serif italic">Today is your special day</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-[2rem] p-6 md:p-8 text-center shadow-sm border border-black/5"
    >
      <Calendar className="w-6 h-6 text-[#909090] mx-auto mb-3" />
      <p className="text-[10px] font-bold tracking-[0.2em] text-[#909090] uppercase mb-3">Next Anniversary</p>
      <p className="font-serif text-4xl md:text-5xl text-[#1C1C1C] mb-1">{countdown.days}</p>
      <p className="text-sm text-[#909090] font-serif italic">days away</p>
    </motion.div>
  );
}

export default function Timeline({
  activeUser,
  partnerUser,
  anniversaryDate,
  onSetAnniversaryDate,
}: {
  activeUser: User;
  partnerUser: User;
  anniversaryDate: string | null;
  onSetAnniversaryDate: (date: string) => Promise<void>;
}) {
  const [dateInput, setDateInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const daysTogether = useMemo(() => {
    if (!anniversaryDate) return 0;
    const start = new Date(anniversaryDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [anniversaryDate]);

  const { achieved, next } = useMemo(() => {
    const achieved = MILESTONES.filter(m => daysTogether >= m.days);
    const next = MILESTONES.find(m => daysTogether < m.days) || null;
    return { achieved: achieved.reverse(), next };
  }, [daysTogether]);

  const progress = useMemo(() => {
    if (!next) return 100;
    const prev = achieved.length > 0 ? achieved[0].days : 0;
    const range = next.days - prev;
    const current = daysTogether - prev;
    return Math.round((current / range) * 100);
  }, [next, achieved, daysTogether]);

  const handleSaveDate = async () => {
    if (!dateInput) return;
    setIsSaving(true);
    try {
      await onSetAnniversaryDate(dateInput);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff5e7e', '#ff36ff', '#a25afd', '#fcff42', '#ffa62d'],
      });
    } finally {
      setIsSaving(false);
      setShowDatePicker(false);
    }
  };

  if (!anniversaryDate && !showDatePicker) {
    return (
      <div className="animate-in fade-in duration-700 max-w-2xl mx-auto py-6 md:py-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center px-6"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Heart className="w-9 h-9 text-rose-400" />
          </div>
          <h1 className="font-serif text-[2rem] md:text-[3rem] text-[#1C1C1C] tracking-tight leading-tight mb-4">
            When did it all <span className="italic text-[#4A4A4A]">begin</span>?
          </h1>
          <p className="text-base md:text-lg text-[#909090] italic font-serif mb-10 max-w-sm mx-auto">
            Set your anniversary to start tracking your journey together.
          </p>
          <button
            onClick={() => setShowDatePicker(true)}
            className="rounded-full px-8 h-12 bg-[#1C1C1C] text-white hover:bg-black font-semibold text-sm tracking-wide transition-all active:scale-95 shadow-sm"
            data-testid="button-set-anniversary"
          >
            Set your date
          </button>
        </motion.div>
      </div>
    );
  }

  if (showDatePicker) {
    return (
      <div className="animate-in fade-in duration-700 max-w-2xl mx-auto py-6 md:py-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm px-6 text-center"
        >
          <h2 className="font-serif text-2xl md:text-3xl text-[#1C1C1C] mb-2">Your anniversary</h2>
          <p className="text-sm text-[#909090] font-serif italic mb-8">The day your story started</p>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full h-14 rounded-2xl border border-black/10 bg-white px-5 text-base text-[#1C1C1C] font-serif focus:outline-none focus:ring-2 focus:ring-black/10 mb-6 text-center"
            data-testid="input-anniversary-date"
          />
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowDatePicker(false)}
              className="rounded-full px-6 h-11 text-[#909090] hover:text-black font-medium text-sm transition-colors"
              data-testid="button-cancel-anniversary"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDate}
              disabled={!dateInput || isSaving}
              className="rounded-full px-8 h-11 bg-[#1C1C1C] text-white hover:bg-black font-semibold text-sm tracking-wide transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              data-testid="button-save-anniversary"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto py-6 md:py-10 pb-[max(env(safe-area-inset-bottom),6rem)]">
      <header className="text-center mb-8 md:mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm border border-black/5">
            <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full" />
          </div>
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm border border-black/5">
            <img src={partnerUser.avatar} alt={partnerUser.name} className="w-full h-full" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#909090] uppercase mb-4" data-testid="text-days-label">Days Together</p>
          <DaysCounter days={daysTogether} />
          <p className="text-sm text-[#909090] font-serif italic mt-4" data-testid="text-since-date">
            since {new Date(anniversaryDate!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </motion.div>
      </header>

      <div className="space-y-6 px-2 md:px-0">
        <AnniversaryCountdown anniversaryDate={anniversaryDate!} />

        {next && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-black/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-[#909090] uppercase mb-1">Next Milestone</p>
                <p className="font-serif text-xl md:text-2xl text-[#1C1C1C]">{next.label}</p>
              </div>
              <div className={`w-12 h-12 rounded-full bg-[#FBF9F6] flex items-center justify-center ${next.color}`}>
                <next.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="relative h-2 bg-[#FBF9F6] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 bg-[#1C1C1C] rounded-full"
              />
            </div>
            <p className="text-xs text-[#909090] mt-2 text-right">{next.days - daysTogether} days to go</p>
          </motion.div>
        )}

        {achieved.length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#909090] uppercase mb-4 px-1">Milestones Reached</p>
            <div className="space-y-3">
              {achieved.map((milestone, index) => (
                <motion.div
                  key={milestone.days}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-black/5"
                  data-testid={`milestone-${milestone.days}`}
                >
                  <div className={`w-10 h-10 rounded-full bg-[#FBF9F6] flex items-center justify-center shrink-0 ${milestone.color}`}>
                    <milestone.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base text-[#1C1C1C]">{milestone.label}</p>
                    <p className="text-[11px] text-[#909090]">Day {milestone.days}</p>
                  </div>
                  <div className="text-[10px] font-bold tracking-wider text-[#909090] uppercase shrink-0">
                    {milestone.days === daysTogether ? "Today!" : "Reached"}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center pt-4"
        >
          <button
            onClick={() => {
              setDateInput(anniversaryDate || "");
              setShowDatePicker(true);
            }}
            className="text-xs text-[#909090] hover:text-black transition-colors underline underline-offset-4 decoration-black/10 hover:decoration-black/30"
            data-testid="button-change-anniversary"
          >
            Change anniversary date
          </button>
        </motion.div>
      </div>
    </div>
  );
}
