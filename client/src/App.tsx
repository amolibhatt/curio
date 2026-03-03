import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Layout from "./components/layout";
import Home from "./pages/home";
import Archive from "./pages/archive";
import Login from "./pages/login";

import type { AuthState, Fact, ReactionType, Category } from "./lib/mock-data";

function AuthenticatedApp({ auth }: { auth: AuthState }) {
  const { data: facts = [] } = useQuery<Fact[]>({
    queryKey: ["/api/facts"],
    refetchInterval: 15000,
    queryFn: async () => {
      const res = await fetch("/api/facts", { credentials: "include" });
      if (res.status === 401) {
        queryClient.setQueryData(["/api/auth/me"], null);
        return [];
      }
      if (!res.ok) throw new Error("Failed to fetch facts");
      return res.json();
    },
  });

  const addFactMutation = useMutation({
    mutationFn: async (data: { text: string; categories: Category[]; imageUrl?: string }) => {
      const res = await apiRequest("POST", "/api/facts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facts"] });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ factId, type }: { factId: number; type: ReactionType }) => {
      const res = await apiRequest("POST", `/api/facts/${factId}/react`, { type });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facts"] });
    },
  });

  const partner = auth.partner || { id: 0, name: "Your partner", avatar: "" };

  const handleAddFact = (text: string, categories: Category[], imageUrl?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      addFactMutation.mutate({ text, categories, imageUrl }, {
        onSuccess: () => resolve(),
        onError: (err) => reject(err),
      });
    });
  };

  return (
    <Layout user={auth.user} hasFriendJoined={!!auth.partner} inviteCode={auth.pairing?.inviteCode}>
      <Switch>
        <Route path="/">
          <Home
            facts={facts}
            onAddFact={handleAddFact}
            activeUser={auth.user}
            partnerUser={partner}
          />
        </Route>
        <Route path="/archive">
          <Archive
            facts={facts}
            onReact={(factId, reaction) => { if (reaction) reactMutation.mutate({ factId, type: reaction as ReactionType }); }}
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
  const { data: auth, isLoading } = useQuery<AuthState | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch auth");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const signupMutation = useMutation({
    mutationFn: async ({ name, inviteCode }: { name: string; inviteCode?: string }) => {
      const url = inviteCode ? `/api/auth/join/${inviteCode}` : "/api/auth/signup";
      const res = await apiRequest("POST", url, { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const handleLogin = (name: string) => {
    const match = window.location.pathname.match(/^\/invite\/(.+)/);
    const inviteCode = match?.[1];
    signupMutation.mutate({ name, inviteCode }, {
      onSuccess: () => {
        if (inviteCode) {
          window.history.pushState({}, "", "/");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center">
        <div className="animate-pulse font-serif text-2xl text-[#909090]">Curio</div>
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center font-sans">
        <div className="w-full min-h-screen flex flex-col relative overflow-hidden">
          <Login onLogin={handleLogin} error={signupMutation.error?.message} />
        </div>
      </div>
    );
  }

  return <AuthenticatedApp auth={auth} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
