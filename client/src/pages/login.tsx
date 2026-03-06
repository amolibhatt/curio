import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, BookOpen, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Login({ onLogin, error, isLoading }: { onLogin: (name: string) => void; error?: string; isLoading?: boolean }) {
  const [name, setName] = useState("");

  const isInvite = window.location.pathname.startsWith("/invite/");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed.length >= 2) {
      if (navigator.vibrate) navigator.vibrate(50);
      onLogin(trimmed);
    }
  };

  return (
    <div className="flex-1 bg-[#FAF9F7] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-20 h-20 flex items-center justify-center mb-6 bg-[#EDEAE6] rounded-2xl shadow-sm"
          >
            <BookOpen className="w-10 h-10 text-[#8B7E74]" strokeWidth={1.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl font-serif tracking-tight text-[#1C1C1C]"
          >
            Curio
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-[#909090] text-lg font-serif italic max-w-[260px] mx-auto leading-relaxed"
          >
            {isInvite ? "You've been invited." : "A shared space for two curious hearts."}
          </motion.p>

          {isInvite && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center justify-center gap-2 pt-1"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <Heart className="w-4 h-4 text-[#8B7E74] fill-[#8B7E74]" />
              </motion.div>
              <span className="text-[13px] font-medium text-[#8B7E74]">Your partner is waiting</span>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="pt-8 pb-8 px-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                placeholder="What's your name?"
                className="h-14 rounded-2xl px-6 bg-white border-none focus-visible:ring-black/5 focus-visible:border-black/5 text-base text-center placeholder:text-center shadow-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                data-testid="input-name"
                autoFocus
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#B86A6A] text-sm text-center"
                data-testid="text-error"
              >
                {error}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                type="submit"
                disabled={!name.trim() || name.trim().length < 2 || isLoading}
                className="w-full h-14 text-base font-medium rounded-2xl justify-center gap-2 px-6 bg-[#1C1C1C] hover:bg-black text-white shadow-none transition-all active:scale-[0.97] disabled:opacity-40 mt-4"
                data-testid="button-submit"
              >
                {isLoading ? "Entering..." : "Enter"}
                <ArrowRight className={`w-5 h-5 opacity-70 transition-transform ${isLoading ? 'animate-pulse' : 'group-hover:translate-x-0.5'}`} />
              </Button>
            </motion.div>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-center text-[11px] text-[#c0c0c0] font-medium"
        >
          Share discoveries, answer questions, grow closer.
        </motion.p>
      </div>
    </div>
  );
}
