import { useState, useMemo } from "react";
import { User } from "@/lib/mock-data";
import { getLocalDateStr } from "@/lib/date-utils";
import { Heart, Calendar, Star, Gift, Sparkles, PartyPopper, CalendarHeart } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

type Milestone = {
  days: number;
  label: string;
  icon: React.ElementType;
  color: string;
};

const MILESTONES: Milestone[] = [
  { days: 1, label: "Day One", icon: Heart, color: "text-[#1C1C1C]" },
  { days: 7, label: "One Week", icon: Star, color: "text-[#1C1C1C]" },
  { days: 30, label: "One Month", icon: Sparkles, color: "text-[#1C1C1C]" },
  { days: 50, label: "50 Days", icon: Star, color: "text-[#1C1C1C]" },
  { days: 100, label: "100 Days", icon: PartyPopper, color: "text-[#1C1C1C]" },
  { days: 150, label: "150 Days", icon: Star, color: "text-[#1C1C1C]" },
  { days: 200, label: "200 Days", icon: Gift, color: "text-[#1C1C1C]" },
  { days: 250, label: "250 Days", icon: Star, color: "text-[#1C1C1C]" },
  { days: 300, label: "300 Days", icon: Sparkles, color: "text-[#1C1C1C]" },
  { days: 365, label: "One Year", icon: PartyPopper, color: "text-[#1C1C1C]" },
  { days: 500, label: "500 Days", icon: Gift, color: "text-[#1C1C1C]" },
  { days: 730, label: "Two Years", icon: PartyPopper, color: "text-[#1C1C1C]" },
  { days: 1000, label: "1000 Days", icon: Star, color: "text-[#1C1C1C]" },
  { days: 1095, label: "Three Years", icon: PartyPopper, color: "text-[#1C1C1C]" },
  { days: 1461, label: "Four Years", icon: PartyPopper, color: "text-[#1C1C1C]" },
  { days: 1826, label: "Five Years", icon: Gift, color: "text-[#1C1C1C]" },
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

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function effectiveDay(annivDay: number, year: number, month: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(annivDay, lastDay);
}

function getMonthlyAnniversary(anniversaryDate: string) {
  const anniv = parseLocalDate(anniversaryDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const annivDay = anniv.getDate();

  const effToday = effectiveDay(annivDay, now.getFullYear(), now.getMonth());
  let monthsCompleted = (now.getFullYear() - anniv.getFullYear()) * 12 + (now.getMonth() - anniv.getMonth());
  if (now.getDate() < effToday) monthsCompleted--;
  if (monthsCompleted < 0) monthsCompleted = 0;

  const thisMonthAnniv = new Date(now.getFullYear(), now.getMonth(), effToday);
  let nextMonthlyDate: Date;
  if (thisMonthAnniv > now) {
    nextMonthlyDate = thisMonthAnniv;
  } else if (thisMonthAnniv.getTime() === now.getTime()) {
    return { monthsCompleted, daysUntilNext: 0, isToday: true, nextMonth: monthsCompleted };
  } else {
    const nextM = now.getMonth() + 1;
    const nextY = now.getFullYear() + (nextM > 11 ? 1 : 0);
    const nextMNorm = nextM % 12;
    const effNext = effectiveDay(annivDay, nextY, nextMNorm);
    nextMonthlyDate = new Date(nextY, nextMNorm, effNext);
  }

  const diff = Math.round((nextMonthlyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { monthsCompleted, daysUntilNext: Math.max(0, diff), isToday: false, nextMonth: monthsCompleted + 1 };
}

function effectiveAnnivForYear(anniv: Date, year: number): Date {
  const d = new Date(year, anniv.getMonth(), anniv.getDate());
  if (d.getMonth() !== anniv.getMonth()) {
    return new Date(year, anniv.getMonth() + 1, 0);
  }
  return d;
}

function getYearlyAnniversary(anniversaryDate: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const anniv = parseLocalDate(anniversaryDate);
  const thisYear = effectiveAnnivForYear(anniv, now.getFullYear());
  thisYear.setHours(0, 0, 0, 0);

  const yearsCompleted = now.getFullYear() - anniv.getFullYear() - (now < thisYear ? 1 : 0);

  if (thisYear.getTime() === now.getTime()) {
    return { daysUntilNext: 0, isToday: true, nextYear: yearsCompleted, yearsCompleted };
  }

  let next = thisYear;
  if (thisYear < now) {
    next = effectiveAnnivForYear(anniv, now.getFullYear() + 1);
    next.setHours(0, 0, 0, 0);
  }
  const diff = Math.round((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { daysUntilNext: Math.max(0, diff), isToday: false, nextYear: yearsCompleted + 1, yearsCompleted };
}

function CountdownCards({ anniversaryDate }: { anniversaryDate: string }) {
  const monthly = useMemo(() => getMonthlyAnniversary(anniversaryDate), [anniversaryDate]);
  const yearly = useMemo(() => getYearlyAnniversary(anniversaryDate), [anniversaryDate]);

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-[1.5rem] p-5 md:p-6 text-center shadow-sm border border-black/5 ${monthly.isToday ? 'bg-[#F0EEEA]' : 'bg-white'}`}
        data-testid="card-monthly-countdown"
      >
        <CalendarHeart className={`w-5 h-5 mx-auto mb-2 ${monthly.isToday ? 'text-[#1C1C1C]' : 'text-[#909090]'}`} />
        <p className="text-[9px] font-bold tracking-[0.2em] text-[#909090] uppercase mb-2">
          {monthly.isToday ? `Month ${monthly.monthsCompleted}` : "Monthly"}
        </p>
        {monthly.isToday ? (
          <>
            <p className="font-serif text-lg md:text-xl text-[#1C1C1C]">Happy</p>
            <p className="font-serif text-lg md:text-xl text-[#1C1C1C] -mt-1">Monthiversary!</p>
          </>
        ) : (
          <>
            <p className="font-serif text-3xl md:text-4xl text-[#1C1C1C] mb-0.5">{monthly.daysUntilNext}</p>
            <p className="text-[11px] text-[#909090] font-serif italic">
              {monthly.daysUntilNext === 1 ? "day" : "days"} to month {monthly.nextMonth}
            </p>
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`rounded-[1.5rem] p-5 md:p-6 text-center shadow-sm border border-black/5 ${yearly.isToday ? 'bg-[#F0EEEA]' : 'bg-white'}`}
        data-testid="card-yearly-countdown"
      >
        <Calendar className={`w-5 h-5 mx-auto mb-2 ${yearly.isToday ? 'text-[#1C1C1C]' : 'text-[#909090]'}`} />
        <p className="text-[9px] font-bold tracking-[0.2em] text-[#909090] uppercase mb-2">
          {yearly.isToday ? `Year ${yearly.yearsCompleted}` : "Anniversary"}
        </p>
        {yearly.isToday ? (
          <>
            <p className="font-serif text-lg md:text-xl text-[#1C1C1C]">Happy</p>
            <p className="font-serif text-lg md:text-xl text-[#1C1C1C] -mt-1">Anniversary!</p>
          </>
        ) : (
          <>
            <p className="font-serif text-3xl md:text-4xl text-[#1C1C1C] mb-0.5">{yearly.daysUntilNext}</p>
            <p className="text-[11px] text-[#909090] font-serif italic">
              {yearly.daysUntilNext === 1 ? "day" : "days"} to year {yearly.nextYear}
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

function MonthBadge({ months }: { months: number }) {
  if (months < 1) return null;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  let label = "";
  if (years > 0 && rem > 0) label = `${years}y ${rem}m`;
  else if (years > 0) label = `${years} ${years === 1 ? "year" : "years"}`;
  else label = `${rem} ${rem === 1 ? "month" : "months"}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.1em] uppercase mt-3"
      data-testid="badge-months"
    >
      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
      {label}
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
    const start = parseLocalDate(anniversaryDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [anniversaryDate]);

  const monthsTogether = useMemo(() => {
    if (!anniversaryDate) return 0;
    return getMonthlyAnniversary(anniversaryDate).monthsCompleted;
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
      setShowDatePicker(false);
    } catch {
      setShowDatePicker(false);
    } finally {
      setIsSaving(false);
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
            max={getLocalDateStr()}
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
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto py-6 md:py-10">
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
            since {parseLocalDate(anniversaryDate!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <MonthBadge months={monthsTogether} />
        </motion.div>
      </header>

      <div className="space-y-6 px-2 md:px-0">
        <CountdownCards anniversaryDate={anniversaryDate!} />

        {next && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-black/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-[#909090] uppercase mb-1">Next Milestone</p>
                <p className="font-serif text-xl md:text-2xl text-[#1C1C1C]">{next.label}</p>
              </div>
              <div className={`w-12 h-12 rounded-full bg-[#FAF9F7] flex items-center justify-center ${next.color}`}>
                <next.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="relative h-2 bg-[#FAF9F7] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
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
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-black/5"
                  data-testid={`milestone-${milestone.days}`}
                >
                  <div className={`w-10 h-10 rounded-full bg-[#FAF9F7] flex items-center justify-center shrink-0 ${milestone.color}`}>
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
