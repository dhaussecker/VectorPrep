import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const floaters = [
  { sym: "∫", size: 4, top: 8, left: 7, dur: 5.2 },
  { sym: "Σ", size: 3, top: 18, left: 85, dur: 6.8 },
  { sym: "∇", size: 5, top: 55, left: 4, dur: 4.5 },
  { sym: "∂", size: 3.5, top: 72, left: 78, dur: 7.1 },
  { sym: "π", size: 4, top: 38, left: 92, dur: 5.9 },
  { sym: "√2", size: 3, top: 88, left: 20, dur: 6.3 },
  { sym: "dx", size: 3.5, top: 25, left: 50, dur: 4.9 },
  { sym: "lim", size: 3, top: 65, left: 55, dur: 7.5 },
  { sym: "×", size: 5, top: 45, left: 30, dur: 5.6 },
  { sym: "F=ma", size: 2.5, top: 80, left: 65, dur: 6.1 },
];

export default function AuthPage() {
  const { loginWithGoogle, login, register } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  const handleGoogle = async () => {
    setGooglePending(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("provider") || msg.includes("not enabled") || msg.includes("400")) {
        toast({
          title: "Google sign-in not configured",
          description: "Enable Google in your Supabase dashboard → Auth → Providers, then add your redirect URL.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Google sign-in failed", description: msg, variant: "destructive" });
      }
      setGooglePending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsPending(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          toast({ title: "Enter your name", variant: "destructive" });
          setIsPending(false);
          return;
        }
        await register(email, password, name, "");
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      toast({ title: mode === "signup" ? "Sign up failed" : "Sign in failed", description: err.message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-3deg); opacity: 0.035; }
          50% { transform: translateY(-22px) rotate(3deg); opacity: 0.06; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-card { animation: fadeUp 0.5s cubic-bezier(0.2,0.8,0.2,1) both; }
        .btn-press:active { transform: translateY(3px) !important; box-shadow: 0 1px 0 0 rgba(0,0,0,0.4) !important; }
      `}</style>

      {floaters.map((f, i) => (
        <div key={i} className="absolute font-mono font-black text-white select-none pointer-events-none"
          style={{ fontSize: `${f.size}rem`, top: `${f.top}%`, left: `${f.left}%`, animation: `float ${f.dur}s ease-in-out infinite`, animationDelay: `${i * 0.4}s`, opacity: 0.04 }}>
          {f.sym}
        </div>
      ))}

      <div className="auth-card relative z-10 w-full max-w-[340px] px-5">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FFD400] border-2 border-white/20 shadow-[0_4px_0_0_rgba(255,255,255,0.15)] flex items-center justify-center">
            <span className="text-2xl font-black font-mono text-[#0F0F0F] tracking-tighter">VP</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white font-mono tracking-tight">Vector Prep</h1>
            <p className="text-white/40 text-xs mt-1 font-mono">Ace your exams. Earn every point.</p>
          </div>
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} disabled={googlePending}
          className="btn-press w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white border-2 border-transparent shadow-[0_4px_0_0_rgba(255,255,255,0.25)] transition-all font-semibold text-[#0F0F0F] text-sm disabled:opacity-60 mb-4">
          {googlePending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] font-mono text-white/30">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
              className="bg-white/8 border-white/15 text-white placeholder:text-white/30 rounded-xl h-11" />
          )}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="bg-white/8 border-white/15 text-white placeholder:text-white/30 rounded-xl h-11"
            data-testid="input-email" />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="bg-white/8 border-white/15 text-white placeholder:text-white/30 rounded-xl h-11"
            data-testid="input-password" />
          <button type="submit" disabled={isPending}
            className="btn-press w-full py-3 rounded-2xl bg-[#FFD400] border-2 border-[#0F0F0F] shadow-[0_4px_0_0_#000] font-bold font-mono text-[#0F0F0F] text-sm transition-all disabled:opacity-60"
            data-testid="button-login">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : mode === "signin" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center mt-5 text-white/30 text-xs font-mono">
          {mode === "signin" ? "No account? " : "Have an account? "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
