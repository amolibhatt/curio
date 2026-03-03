import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Layout from "./components/layout";
import Home from "./pages/home";
import Archive from "./pages/archive";
import Login from "./pages/login";

import { mockFacts, currentUser, friendUser, Fact } from "./lib/mock-data";

function Router({ 
  facts, 
  onAddFact 
}: { 
  facts: Fact[], 
  onAddFact: (text: string, categories: string[]) => void
}) {
  const [, setLocation] = useLocation();

  const handleAddFactAndRedirect = (text: string, categories: string[]) => {
    onAddFact(text, categories);
    setLocation('/archive');
  };

  return (
    <Switch>
      <Route path="/">
        <Home facts={facts} onAddFact={handleAddFactAndRedirect} />
      </Route>
      <Route path="/archive">
        <Archive facts={facts} />
      </Route>
      <Route path="/invite">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
          <h2 className="text-2xl font-bold">You've been invited!</h2>
          <p>Join {currentUser.name} to share daily facts.</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="bg-primary text-white px-6 py-2 rounded-full font-bold"
          >
            Accept Invite & Go to Dashboard
          </button>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState(currentUser);
  const [facts, setFacts] = useState<Fact[]>(mockFacts);

  const handleLogin = (userType: 'me' | 'friend') => {
    setActiveUser(userType === 'me' ? currentUser : friendUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleAddFact = (text: string, categories: string[]) => {
    const newFact: Fact = {
      id: `f_${Date.now()}`,
      text,
      authorId: activeUser.id,
      date: new Date().toISOString().split('T')[0],
      categories: categories as any
    };
    setFacts(prev => [newFact, ...prev]);
  };

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-[#E5E4DF] flex items-center justify-center md:py-8 font-sans">
            {/* Mobile Device Container for Login */}
            <div className="w-full h-[100dvh] md:h-[844px] md:max-h-[calc(100vh-4rem)] md:w-[390px] bg-[#FBF9F6] flex flex-col relative md:rounded-[3rem] md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] md:border-8 border-[#1C1C1C] overflow-hidden md:ring-1 ring-black/5">
               <Login onLogin={handleLogin} />
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout user={activeUser}>
          <Router facts={facts} onAddFact={handleAddFact} />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
