import React from "react";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader2, LogOut } from "lucide-react";
import AuthPage from "@/pages/auth";
import LandingPage from "@/pages/landing";
import AdminPage from "@/pages/admin";

function AuthenticatedApp() {
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();
  const [showAuth, setShowAuth] = React.useState(false);

  React.useEffect(() => {
    if (!user && !isLoading && (location === "/admin" || location === "/signin")) {
      setShowAuth(true);
    }
  }, [user, isLoading, location]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />
      </div>
    );
  }

  if (!user) {
    if (showAuth) return <AuthPage />;
    return <LandingPage onSignIn={() => setShowAuth(true)} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 0" }}>
          <button
            onClick={logout}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#6b7280", cursor: "pointer" }}
          >
            <LogOut style={{ width: 14, height: 14 }} />
            Sign out
          </button>
        </div>
        <AdminPage />
      </div>
    </div>
  );
}

export default function App() {
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
