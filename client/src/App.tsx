import { useState, useEffect, useCallback, useRef } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

import Layout from "./components/layout";
import Home from "./pages/home";
import Archive from "./pages/archive";
import Login from "./pages/login";

import { auth as firebaseAuth, authReady } from "./lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import * as firestoreOps from "./lib/firestore";

import type { AuthState, Fact, ReactionType, Category } from "./lib/mock-data";

function AuthenticatedApp({ auth }: { auth: AuthState }) {
  const { toast } = useToast();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [isReacting, setIsReacting] = useState(false);
  const pairingIdRef = useRef(auth.pairing?.id);
  pairingIdRef.current = auth.pairing?.id;

  const fetchFacts = useCallback(async () => {
    const pid = pairingIdRef.current;
    if (!pid) return;
    try {
      const data = await firestoreOps.getFactsByPairing(pid);
      setFacts(data);
    } catch (err: any) {
      console.error("[Curio] Failed to fetch facts:", err);
      toast({
        title: "Couldn't load discoveries",
        description: err?.message || "Check Firestore rules",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchFacts();
    const interval = setInterval(fetchFacts, 15000);
    return () => clearInterval(interval);
  }, [fetchFacts]);

  const handleAddFact = async (text: string, categories: Category[]): Promise<void> => {
    if (!auth.pairing) throw new Error("No pairing");
    const date = new Date().toISOString().split("T")[0];

    const alreadyPosted = await firestoreOps.hasPostedToday(auth.user.id, auth.pairing.id, date);
    if (alreadyPosted) {
      throw new Error("You've already shared a discovery today");
    }

    const newFact = await firestoreOps.createFact(auth.user.id, auth.pairing.id, text, categories, date);
    setFacts(prev => [newFact, ...prev]);
    fetchFacts().catch(() => {});
  };

  const handleEditFact = async (factId: string, text: string, categories: Category[]): Promise<void> => {
    await firestoreOps.updateFact(factId, text, categories);
    setFacts(prev => prev.map(f => f.id === factId ? { ...f, text, categories } : f));
  };

  const handleReact = async (factId: string, type: ReactionType) => {
    setIsReacting(true);
    const userId = auth.user.id;

    setFacts(prev => prev.map(f => {
      if (f.id !== factId) return f;
      const currentReaction = f.reactions?.[userId];
      const newReactions = { ...f.reactions };
      if (currentReaction === type) {
        delete newReactions[userId];
      } else {
        newReactions[userId] = type;
      }
      return { ...f, reactions: newReactions };
    }));

    try {
      await firestoreOps.toggleReaction(factId, userId, type);
    } catch (err: any) {
      toast({
        title: "Couldn't react",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
      fetchFacts().catch(() => {});
    } finally {
      setIsReacting(false);
    }
  };

  const partner = auth.partner || {
    id: "0",
    name: "Your partner",
    avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=partner&backgroundColor=e5e4df`,
  };

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
            isReacting={isReacting}
          />
        </Route>
        <Route path="/invite/:code">
          <Home
            facts={facts}
            onAddFact={handleAddFact}
            onEditFact={handleEditFact}
            activeUser={auth.user}
            partnerUser={partner}
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
    authReady.then(() => {
      unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setFirebaseUid(user.uid);
          try {
            const state = await firestoreOps.getAuthState(user.uid);
            if (state) {
              setAuthState(state);
              setNeedsName(false);
            } else {
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

        window.history.pushState({}, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        const existingPairing = await firestoreOps.findExistingPairingForUser(uid);
        if (existingPairing) {
          const isUser1 = existingPairing.user1Id === uid;
          await firestoreOps.createUser(uid, name, existingPairing.id, isUser1);
        } else {
          const pairing = await firestoreOps.createPairing(uid);
          await firestoreOps.createUser(uid, name, pairing.id, true);
        }
      }

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
      <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center">
        <div className="animate-pulse font-serif text-2xl text-[#909090]">Curio</div>
      </div>
    );
  }

  if (!authState || needsName) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center font-sans">
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
