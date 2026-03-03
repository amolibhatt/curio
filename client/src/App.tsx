import { useState, useEffect, useCallback, useRef } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

import Layout from "./components/layout";
import Home from "./pages/home";
import Archive from "./pages/archive";
import Timeline from "./pages/timeline";
import Login from "./pages/login";

import { auth as firebaseAuth, authReady } from "./lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import * as firestoreOps from "./lib/firestore";

import { getLocalDateStr } from "./lib/date-utils";
import type { AuthState, Fact, ReactionType, Category, DailyAnswer } from "./lib/mock-data";

function AuthenticatedApp({ auth }: { auth: AuthState }) {
  const { toast } = useToast();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [dailyAnswers, setDailyAnswers] = useState<DailyAnswer[]>([]);
  const [reactingFacts, setReactingFacts] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  const pairingIdRef = useRef(auth.pairing?.id);
  pairingIdRef.current = auth.pairing?.id;

  const fetchFacts = useCallback(async () => {
    const pid = pairingIdRef.current;
    if (!pid) return;
    try {
      const [factsData, answersData] = await Promise.all([
        firestoreOps.getFactsByPairing(pid),
        firestoreOps.getAllDailyAnswers(pid),
      ]);
      setFacts(factsData);
      setDailyAnswers(answersData);
    } catch (err: any) {
      console.error("[Curio] Failed to fetch data:", err);
      toast({
        title: "Couldn't load data",
        description: err?.message || "Check Firestore rules",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFacts();
    const interval = setInterval(fetchFacts, 15000);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchFacts();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) fetchFacts();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [fetchFacts]);

  const addingRef = useRef(false);

  const handleAddFact = async (text: string, categories: Category[]): Promise<void> => {
    if (!auth.pairing) throw new Error("No pairing");
    if (addingRef.current) throw new Error("Already submitting");
    addingRef.current = true;
    try {
      const date = getLocalDateStr();

      const localDup = facts.some(f => f.authorId === auth.user.id && f.date === date);
      if (localDup) {
        throw new Error("You've already shared a discovery today");
      }

      const alreadyPosted = await firestoreOps.hasPostedToday(auth.user.id, auth.pairing.id, date);
      if (alreadyPosted) {
        throw new Error("You've already shared a discovery today");
      }

      const newFact = await firestoreOps.createFact(auth.user.id, auth.pairing.id, text, categories, date);
      setFacts(prev => [newFact, ...prev]);
      fetchFacts().catch(() => {});
    } finally {
      addingRef.current = false;
    }
  };

  const handleEditFact = async (factId: string, text: string, categories: Category[]): Promise<void> => {
    await firestoreOps.updateFact(factId, text, categories);
    setFacts(prev => prev.map(f => f.id === factId ? { ...f, text, categories } : f));
  };

  const handleReact = async (factId: string, type: ReactionType) => {
    if (reactingFacts.has(factId)) return;
    setReactingFacts(prev => new Set(prev).add(factId));
    const userId = auth.user.id;

    const fact = facts.find(f => f.id === factId);
    const currentReaction = fact?.reactions?.[userId];
    const shouldRemove = currentReaction === type;

    setFacts(prev => prev.map(f => {
      if (f.id !== factId) return f;
      const newReactions = { ...f.reactions };
      if (shouldRemove) {
        delete newReactions[userId];
      } else {
        newReactions[userId] = type;
      }
      return { ...f, reactions: newReactions };
    }));

    try {
      if (shouldRemove) {
        await firestoreOps.removeReaction(factId, userId);
      } else {
        await firestoreOps.setReaction(factId, userId, type);
      }
    } catch (err: any) {
      toast({
        title: "Couldn't react",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
      fetchFacts().catch(() => {});
    } finally {
      setReactingFacts(prev => {
        const next = new Set(prev);
        next.delete(factId);
        return next;
      });
    }
  };

  const [anniversaryDate, setAnniversaryDate] = useState<string | null>(auth.pairing?.anniversaryDate || null);

  useEffect(() => {
    const incoming = auth.pairing?.anniversaryDate || null;
    setAnniversaryDate(prev => prev !== incoming ? incoming : prev);
  }, [auth.pairing?.anniversaryDate]);

  const handleSetAnniversaryDate = async (date: string) => {
    if (!auth.pairing) return;
    await firestoreOps.setAnniversaryDate(auth.pairing.id, date);
    setAnniversaryDate(date);
  };

  const handleSubmitAnswer = async (questionText: string, category: string, answer: string): Promise<DailyAnswer> => {
    if (!auth.pairing) throw new Error("No pairing");
    const date = getLocalDateStr();
    const result = await firestoreOps.submitDailyAnswer(auth.pairing.id, date, questionText, category, auth.user.id, answer);
    setDailyAnswers(prev => {
      const idx = prev.findIndex(a => a.id === result.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = result;
        return next;
      }
      return [result, ...prev];
    });
    return result;
  };

  const partner = auth.partner || {
    id: "0",
    name: "Your partner",
    avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=partner&backgroundColor=d5e0ff`,
  };

  if (initialLoading) {
    return (
      <Layout user={auth.user} hasFriendJoined={!!auth.partner} inviteCode={auth.pairing?.inviteCode}>
        <div className="animate-in fade-in duration-500 max-w-2xl mx-auto flex flex-col pt-6 md:pt-10 gap-4 px-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-full bg-black/[0.04] animate-pulse" />
              <div className="w-11 h-11 rounded-full bg-black/[0.04] animate-pulse -ml-3" />
            </div>
            <div className="flex-1">
              <div className="h-5 w-32 bg-black/[0.04] rounded-lg animate-pulse" />
              <div className="h-3 w-24 bg-black/[0.04] rounded-lg animate-pulse mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 h-24 bg-black/[0.03] animate-pulse" />
            <div className="rounded-2xl p-4 h-24 bg-black/[0.03] animate-pulse" />
          </div>
          <div className="rounded-2xl p-5 h-40 bg-black/[0.03] animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={auth.user} hasFriendJoined={!!auth.partner} inviteCode={auth.pairing?.inviteCode}>
      <Switch>
        <Route path="/">
          <Home
            facts={facts}
            onAddFact={handleAddFact}
            onEditFact={handleEditFact}
            activeUser={auth.user}
            partnerUser={partner}
            dailyAnswers={dailyAnswers}
            onSubmitAnswer={handleSubmitAnswer}
          />
        </Route>
        <Route path="/archive">
          <Archive
            facts={facts}
            onReact={(factId, reaction) => {
              if (reaction) handleReact(factId, reaction as ReactionType);
            }}
            activeUser={auth.user}
            partnerUser={partner}
            reactingFacts={reactingFacts}
            dailyAnswers={dailyAnswers}
          />
        </Route>
        <Route path="/us">
          <Timeline
            activeUser={auth.user}
            partnerUser={partner}
            anniversaryDate={anniversaryDate}
            onSetAnniversaryDate={handleSetAnniversaryDate}
          />
        </Route>
        <Route path="/invite/:code">
          <Home
            facts={facts}
            onAddFact={handleAddFact}
            onEditFact={handleEditFact}
            activeUser={auth.user}
            partnerUser={partner}
            dailyAnswers={dailyAnswers}
            onSubmitAnswer={handleSubmitAnswer}
          />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppContent() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsName, setNeedsName] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupError, setSignupError] = useState<string | undefined>();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    authReady.catch((err) => {
      console.error("[Curio] setPersistence failed:", err);
    }).then(() => {
      unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setFirebaseUid(user.uid);
          try {
            const state = await firestoreOps.getAuthState(user.uid);
            if (state) {
              setAuthState(state);
              setNeedsName(false);
            } else {
              const cookie = firestoreOps.getReconnectCookie();
              if (cookie && cookie.uid !== user.uid) {
                try {
                  await firestoreOps.reconnectUser(
                    user.uid,
                    cookie.uid,
                    cookie.name,
                    cookie.pairingId,
                    cookie.isUser1
                  );
                  const reconnectedState = await firestoreOps.getAuthState(user.uid);
                  if (reconnectedState) {
                    setAuthState(reconnectedState);
                    setNeedsName(false);
                    setIsLoading(false);
                    return;
                  }
                } catch (err) {
                  console.error("[Curio] Reconnect failed:", err);
                }
              }
              setNeedsName(true);
              setAuthState(null);
            }
          } catch (err) {
            console.error("[Curio] Auth state load error:", err);
            setNeedsName(true);
            setAuthState(null);
          }
        } else {
          try {
            await signInAnonymously(firebaseAuth);
          } catch (err) {
            console.error("[Curio] Auto sign-in failed:", err);
            setNeedsName(true);
          }
        }
        setIsLoading(false);
      });
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const refreshAuth = useCallback(async () => {
    const user = firebaseAuth.currentUser;
    if (user) {
      try {
        const state = await firestoreOps.getAuthState(user.uid);
        if (state) setAuthState(state);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!authState) return;
    const interval = setInterval(refreshAuth, 30000);
    return () => clearInterval(interval);
  }, [authState, refreshAuth]);

  const handleLogin = async (name: string) => {
    if (!name || name.length < 2) {
      setSignupError("Name must be at least 2 characters");
      return;
    }
    setIsSigningUp(true);
    setSignupError(undefined);
    try {
      const match = window.location.pathname.match(/^\/invite\/([a-z0-9]+)$/);
      const inviteCode = match?.[1];

      let uid = firebaseUid || firebaseAuth.currentUser?.uid;
      if (!uid) {
        const cred = await signInAnonymously(firebaseAuth);
        uid = cred.user.uid;
        setFirebaseUid(uid);
      }

      let isUser1 = true;
      let pairingId: string;

      if (inviteCode) {
        const pairing = await firestoreOps.getPairingByCode(inviteCode);
        if (!pairing) {
          setSignupError("Invite not found");
          setIsSigningUp(false);
          return;
        }
        if (pairing.user2Id) {
          setSignupError("This pairing is already full");
          setIsSigningUp(false);
          return;
        }
        await firestoreOps.createUser(uid, name, pairing.id, false);
        await firestoreOps.joinPairing(pairing.id, uid);
        isUser1 = false;
        pairingId = pairing.id;

        window.history.pushState({}, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        const pairing = await firestoreOps.createPairing(uid);
        await firestoreOps.createUser(uid, name, pairing.id, true);
        pairingId = pairing.id;
      }

      firestoreOps.setReconnectCookie({ uid, name, pairingId, isUser1 });

      const state = await firestoreOps.getAuthState(uid);
      setAuthState(state);
      setNeedsName(false);
    } catch (err: any) {
      setSignupError(err.message || "Something went wrong");
    } finally {
      setIsSigningUp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center">
        <div className="animate-pulse font-serif text-2xl text-[#909090]">Curio</div>
      </div>
    );
  }

  if (!authState || needsName) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center font-sans">
        <div className="w-full min-h-screen flex flex-col relative overflow-hidden">
          <Login onLogin={handleLogin} error={signupError} isLoading={isSigningUp} />
        </div>
      </div>
    );
  }

  return <AuthenticatedApp auth={authState} />;
}

function App() {
  return (
    <TooltipProvider>
      <AppContent />
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
