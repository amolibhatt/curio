import { useState } from "react";
import { Switch, Route } from "wouter";
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

  const handleAddFact = (text: string, category: string) => {
    const newFact: Fact = {
      id: `f_${Date.now()}`,
      text,
      authorId: activeUser.id,
      date: new Date().toISOString().split('T')[0],
      category: category as any
    };
    setFacts(prev => [newFact, ...prev]);
  };

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Layout>
             <Home facts={facts} onAddFact={handleAddFact} />
          </Layout>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Switch>
            <Route path="/">
              <Home facts={facts} onAddFact={handleAddFact} />
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
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
