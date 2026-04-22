import { useState } from "react";
import { Link } from "wouter";
import {
  GraduationCap, Loader2, BookOpen, Brain, BarChart3,
  RefreshCw, FileText, Sparkles, CheckCircle2, Zap, Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register: registerUser } = useAuth();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regDisplayName, setRegDisplayName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regInviteCode, setRegInviteCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regDisplayName || !regInviteCode) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (regPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      await registerUser(regEmail, regPassword, regDisplayName, regInviteCode);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top nav bar */}
        <header className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shadow-md">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Vector Prep</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/demo">
              <Button size="sm" variant="ghost" className="text-muted-foreground">
                <Play className="w-3.5 h-3.5" />
                Try Demo
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${isLogin ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign In
            </button>
            <Button
              size="sm"
              variant={!isLogin ? "default" : "outline"}
              onClick={() => setIsLogin(false)}
            >
              Get Started
            </Button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 py-8 max-w-7xl mx-auto w-full">

          {/* Left side — Hero + Features */}
          <div className="flex-1 max-w-xl space-y-8">
            {/* Hero text */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Built for first-year engineering students
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                Ace your exams with
                <span className="text-primary block">smarter studying</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Interactive lessons, unlimited practice problems, and a personal cheat sheet builder — everything you need in one place.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold">100+</div>
                <div className="text-xs text-muted-foreground">Practice Questions</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="text-2xl font-bold">Step-by-step</div>
                <div className="text-xs text-muted-foreground">Worked Solutions</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="text-2xl font-bold">Real-time</div>
                <div className="text-xs text-muted-foreground">Progress Tracking</div>
              </div>
            </div>

            {/* Feature cards grid */}
            <div className="grid grid-cols-2 gap-3">
              <FeatureCard
                icon={<BookOpen className="w-5 h-5" />}
                title="Learn Cards"
                description="Bite-sized lessons with key formulas, diagrams, and embedded videos"
                color="text-blue-500 bg-blue-500/10"
              />
              <FeatureCard
                icon={<Brain className="w-5 h-5" />}
                title="Adaptive Practice"
                description="Randomized problems that test your understanding with instant feedback"
                color="text-violet-500 bg-violet-500/10"
              />
              <FeatureCard
                icon={<BarChart3 className="w-5 h-5" />}
                title="Progress Tracking"
                description="See exactly where you stand on every topic and skill"
                color="text-emerald-500 bg-emerald-500/10"
              />
              <FeatureCard
                icon={<FileText className="w-5 h-5" />}
                title="Cheat Sheet Builder"
                description="Auto-generated formula sheets you can customize and take to exams"
                color="text-amber-500 bg-amber-500/10"
              />
            </div>

            {/* Bottom features list */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <MiniFeature label="Unlimited question regeneration" />
              <MiniFeature label="View full worked solutions" />
              <MiniFeature label="Multiple courses supported" />
              <MiniFeature label="Mobile friendly" />
            </div>
          </div>

          {/* Right side — Auth form */}
          <div className="w-full max-w-[420px] flex-shrink-0">
            <Card className="shadow-xl border-border/50 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">{isLogin ? "Welcome back" : "Create your account"}</CardTitle>
                <CardDescription>
                  {isLogin ? "Sign in to continue your study session" : "Join your classmates and start studying smarter"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLogin ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@university.edu"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        data-testid="input-email"
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        data-testid="input-password"
                        autoComplete="current-password"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isPending} data-testid="button-login">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                      Sign In
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="reg-display-name">Full Name</Label>
                      <Input
                        id="reg-display-name"
                        placeholder="John Doe"
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        data-testid="input-display-name"
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@university.edu"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        data-testid="input-reg-email"
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        data-testid="input-reg-password"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-invite-code">Invite Code</Label>
                      <Input
                        id="reg-invite-code"
                        placeholder="Enter your invite code"
                        value={regInviteCode}
                        onChange={(e) => setRegInviteCode(e.target.value.toUpperCase())}
                        data-testid="input-reg-invite-code"
                        autoComplete="off"
                        className="font-mono tracking-wider"
                      />
                      <p className="text-[11px] text-muted-foreground">Get an invite code from your instructor or a friend</p>
                    </div>
                    <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isPending} data-testid="button-register">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Start Studying
                    </Button>
                  </form>
                )}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-toggle-auth"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Demo CTA */}
            <div className="mt-4 text-center">
              <Link href="/demo">
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Try the demo before signing up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-4 space-y-2.5 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function MiniFeature({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
