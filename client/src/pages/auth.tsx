import { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
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

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regDisplayName, setRegDisplayName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      await login(loginUsername, loginPassword);
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regDisplayName) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (regPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      await registerUser(regUsername, regPassword, regDisplayName);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 pointer-events-none z-0" />
      <div className="relative z-10 w-full max-w-[900px] grid md:grid-cols-2 gap-6 items-center">
        <div className="hidden md:flex flex-col gap-6 p-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">PrepEngine</h1>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Master your first-year engineering courses with interactive learn cards and adaptive practice questions.
          </p>
          <div className="space-y-4 mt-4">
            <FeaturePill label="Interactive Learn Cards" />
            <FeaturePill label="Adaptive Practice Mode" />
            <FeaturePill label="Track Your Progress" />
            <FeaturePill label="Regenerate Similar Questions" />
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 md:hidden mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">PrepEngine</span>
            </div>
            <CardTitle className="text-xl">{isLogin ? "Welcome back" : "Create account"}</CardTitle>
            <CardDescription>
              {isLogin ? "Sign in to continue your study session" : "Get started with your engineering prep"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    placeholder="Enter your username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    data-testid="input-username"
                    autoComplete="username"
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
                <Button type="submit" className="w-full" disabled={isPending} data-testid="button-login">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
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
                  <Label htmlFor="reg-username">Username</Label>
                  <Input
                    id="reg-username"
                    placeholder="johndoe"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    data-testid="input-reg-username"
                    autoComplete="username"
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
                <Button type="submit" className="w-full" disabled={isPending} data-testid="button-register">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Account
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
      </div>
    </div>
  );
}

function FeaturePill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
