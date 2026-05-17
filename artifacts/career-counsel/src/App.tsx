import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import NewProfile from "@/pages/profile/new";
import ProfileDashboard from "@/pages/profile/dashboard";
import Assessment from "@/pages/profile/assessment";
import Results from "@/pages/profile/results";
import Roadmap from "@/pages/profile/roadmap";
import Skills from "@/pages/profile/skills";
import ChatIndex from "@/pages/chat/index";
import ChatView from "@/pages/chat/view";
import Community from "@/pages/community";
import PublicProfile from "@/pages/public-profile";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/profile/new" component={NewProfile} />
      <Route path="/profile/:id" component={ProfileDashboard} />
      <Route path="/profile/:id/assessment" component={Assessment} />
      <Route path="/profile/:id/results" component={Results} />
      <Route path="/profile/:id/roadmap" component={Roadmap} />
      <Route path="/profile/:id/skills" component={Skills} />
      <Route path="/chat" component={ChatIndex} />
      <Route path="/chat/:id" component={ChatView} />
      <Route path="/community" component={Community} />
      <Route path="/community/profile/:id" component={PublicProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
