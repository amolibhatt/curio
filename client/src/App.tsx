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

import { mockFacts, currentUser, friendUser, Fact, User } from "./lib/mock-data";

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState<User>(currentUser);
  const [facts, setFacts] = useState<Fact[]>(mockFacts);

  const handleLogin = (name: string) => {
    // If we're on the invite page, user 1 invited us. We are user 2.
    const isFriend = window.location.pathname.includes('/invite');
    
    const newUser: User = {
      id: isFriend ? 'user_2' : 'user_1',
      name: name,
      // Simple avatar generation based on name
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${name}&backgroundColor=${isFriend ? 'ffd5dc' : 'e5e4df'}`,
    };
    
    // Update active user state
    setActiveUser(newUser);
    
    // Also update the mock data users based on who logged in
    if (isFriend) {
      friendUser.name = name;
      friendUser.avatar = newUser.avatar;
    } else {
      currentUser.name = name;
      currentUser.avatar = newUser.avatar;
    }

    setIsAuthenticated(true);
    
    // If they logged in from invite page, redirect them home
    if (isFriend) {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate')); // Tell wouter to re-render
    }
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
