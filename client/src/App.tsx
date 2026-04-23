import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutDashboard, ClipboardCheck, BookOpen, Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ClassesPage from "@/pages/topics";
import LearnPage from "@/pages/learn";
import PracticePage from "@/pages/practice";
import ProgressPage from "@/pages/progress";
import AdminPage from "@/pages/admin";
import CheatSheetPage from "@/pages/cheat-sheet";
import DemoPage from "@/pages/demo";

const navItems = [
  { label: "Home", url: "/", icon: LayoutDashboard },
  { label: "Classes", url: "/classes", icon: BookOpen },
  { label: "Practice", url: "/practice", icon: ClipboardCheck },
];

function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex">
      {navItems.map((item) => {
        const isActive = item.url === "/" ? location === "/" : location.startsWith(item.url);
        return (
          <Link key={item.url} href={item.url} className="flex-1">
            <div className={`flex flex-col items-center justify-center py-3 gap-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-mono uppercase tracking-wide">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/classes" component={ClassesPage} />
      <Route path="/classes/:courseId" component={ClassesPage} />
      <Route path="/learn" component={LearnPage} />
      <Route path="/learn/:courseId" component={LearnPage} />
      <Route path="/learn/:courseId/:toolId" component={LearnPage} />
      <Route path="/practice" component={PracticePage} />
      <Route path="/practice/:courseId" component={PracticePage} />
      <Route path="/practice/:courseId/:toolId" component={PracticePage} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/cheat-sheet" component={CheatSheetPage} />
      <Route path="/cheat-sheet/:courseId" component={CheatSheetPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();
  const [showAuth, setShowAuth] = useState(false);

  if (location === "/demo") return <DemoPage />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFD400] border-2 border-foreground flex items-center justify-center shadow-[0_3px_0_0_hsl(var(--foreground))]">
            <span className="text-lg font-black font-mono text-foreground">OQ</span>
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) return <AuthPage />;
    return <LandingPage onSignIn={() => setShowAuth(true)} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-card sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFD400] border-2 border-foreground flex items-center justify-center shadow-[0_2px_0_0_hsl(var(--foreground))]">
            <span className="text-xs font-black font-mono text-foreground">OQ</span>
          </div>
          <span className="text-sm font-bold font-mono text-foreground tracking-tight">OnQuest</span>
        </div>
        <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-auto pb-20">
        <Router />
      </main>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
