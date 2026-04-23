import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const subjects = [
  { num: "01", diff: "hard", icon: "📈", name: "Calculus", desc: "Derivatives, integrals, limits", xp: 600 },
  { num: "02", diff: "hard", icon: "🔢", name: "Linear Algebra", desc: "Matrices, vectors, eigenvalues", xp: 580 },
  { num: "03", diff: "med", icon: "⚙️", name: "Mechanics", desc: "Forces, motion, equilibrium", xp: 500 },
  { num: "04", diff: "hard", icon: "⚡", name: "Circuits", desc: "Ohm's law, KVL, KCL, AC/DC", xp: 560 },
  { num: "05", diff: "med", icon: "🌊", name: "Physics", desc: "Waves, thermodynamics, optics", xp: 520 },
  { num: "06", diff: "med", icon: "🧪", name: "Chemistry", desc: "Stoichiometry, thermochem, bonds", xp: 480 },
];

const steps = [
  { n: "01", title: "Pick a quest", desc: "Choose your subject. Each one is a 3-hour adventure broken into short levels you can actually finish." },
  { n: "02", title: "Solve to move", desc: "Answer real exam problems. Every correct move earns XP and deals damage to the level." },
  { n: "03", title: "Unlock tools", desc: "Clear a level, earn a tool — the Chain Rule, Substitution, Integration by Parts. Watch your kit fill up." },
  { n: "04", title: "Beat the boss", desc: "The final level is a full mock exam. Pass it and the unit's yours — for good." },
];

const reviews = [
  { title: "Connected the dots my prof couldn't", body: "OnQuest connected the dots in calculus that my prof couldn't. Worth every penny.", name: "Zack", sub: "MATH 134" },
  { title: "A true system", body: "Not just a study tool — a true system. The ability to simplify difficult concepts has been invaluable.", name: "Ervin", sub: "MATH & SCIENCE" },
  { title: "Great for first year engineering", body: "Helped me understand difficult concepts by thoroughly explaining them and working through practice questions.", name: "Alan", sub: "FIRST YEAR ENG" },
  { title: "Felt confident applying the material", body: "Each lesson was tailored to my needs — I didn't just understand it, I felt confident applying it.", name: "Em", sub: "CALCULUS" },
  { title: "Swiss Army Knife of study tools", body: "Excellent for math and pretty much anything else I needed. Will absolutely use it again.", name: "Graham", sub: "MATH" },
  { title: "The perfect prep tool", body: "Knew what it was doing in every subject. Would highly recommend to any engineering student.", name: "Alec", sub: "MULTI-SUBJECT" },
];

export default function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  const { loginWithGoogle } = useAuth();
  const [heroSelected, setHeroSelected] = useState<string | null>(null);
  const [heroCorrect, setHeroCorrect] = useState(false);

  const handleHeroCheck = () => {
    if (heroSelected === "4") setHeroCorrect(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-foreground border-b border-border/20">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary border-2 border-[#FFD400] flex items-center justify-center font-mono font-bold text-[10px] text-[#FFD400] -rotate-3">OQ</div>
            <span className="text-white font-bold text-base tracking-tight">onquest</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSignIn}
              className="px-4 py-2 rounded-full bg-[#FFD400] text-[#0F0F0F] font-bold font-mono text-xs uppercase tracking-widest border-2 border-transparent shadow-[0_2px_0_0_rgba(255,255,255,0.2)] hover:-translate-y-px transition-transform"
            >
              Sign In →
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-5 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-[#FFD400] font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground shadow-[0_3px_0_0_hsl(var(--foreground))] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FFD400] animate-pulse" />
              First-year engineering · System now live
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-none mb-5">
              Turn <span className="line-through text-muted-foreground decoration-2">cramming</span>
              <br />into <span className="text-primary relative">grinding XP.<span className="absolute inset-x-0 bottom-1 h-3 bg-[#FFD400]/40 -z-10 rounded skew-x-1" /></span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-7 max-w-md">
              OnQuest turns every exam topic into a playable level. Earn XP, unlock tools, beat the boss — and somehow pass your finals while you're at it.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-[#0F0F0F] font-semibold text-sm border-2 border-foreground shadow-[0_4px_0_0_hsl(var(--foreground))] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_hsl(var(--foreground))] transition-all active:translate-y-1 active:shadow-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button
                onClick={onSignIn}
                className="px-6 py-3.5 rounded-2xl bg-card border-2 border-border text-foreground font-semibold text-sm hover:border-primary/50 transition-colors"
              >
                Sign in with Email
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {["3-hour quests", "No textbooks", "Real exam problems"].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Game card demo */}
          <div className="relative">
            <span className="absolute -top-6 -right-3 text-5xl font-black text-[#FFD400]" style={{ WebkitTextStroke: "2px hsl(var(--foreground))", animation: "bob 3.4s ease-in-out infinite" }}>∫</span>
            <span className="absolute -bottom-6 -left-4 text-4xl font-black text-primary" style={{ WebkitTextStroke: "2px hsl(var(--foreground))", animation: "bob 3.8s ease-in-out infinite 0.6s" }}>x²</span>
            <div className="bg-foreground rounded-3xl p-6 border-2 border-foreground shadow-[0_8px_0_0_hsl(var(--foreground))] rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <div className="text-[#FFD400] font-mono text-[10px] font-bold uppercase tracking-widest">Quest · 04 of 12</div>
                  <div className="text-white font-bold text-base mt-0.5">Slay the limit boss</div>
                </div>
                <div className="flex gap-1">
                  {[1,1,1,0].map((on, i) => (
                    <div key={i} className={`w-3.5 h-3.5 rounded border-2 border-black ${on ? "bg-[#22D3EE]" : "bg-white/10"}`} style={{ boxShadow: on ? "inset 0 -2px 0 rgba(0,0,0,0.3)" : "none" }} />
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 text-center font-serif text-2xl text-white italic border border-white/8 mb-4">
                lim<sub className="text-xs not-italic">x→2</sub> (3x +{" "}
                <span className={`inline-block w-12 h-8 border-2 border-dashed rounded-lg mx-1 align-middle font-bold not-italic text-lg leading-7 transition-all ${
                  heroCorrect ? "bg-primary border-primary text-white" : heroSelected === "4" ? "bg-[#FFD400]/20 border-[#FFD400] text-[#FFD400]" : "border-[#FFD400] text-[#FFD400]"
                }`} style={{ animation: heroSelected ? "none" : "blink 1.3s ease-in-out infinite" }}>
                  {heroSelected ?? "?"}
                </span>) = 10
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {["2","4","6"].map(v => (
                  <button key={v} onClick={() => { setHeroSelected(v); setHeroCorrect(false); }}
                    className={`py-3 rounded-xl font-mono font-bold text-xl border-2 border-black transition-all shadow-[0_3px_0_0_black] active:shadow-none active:translate-y-0.5 ${heroSelected === v ? "bg-[#FFD400] text-black" : "bg-[#22D3EE] text-black"}`}>
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#FFD400] font-mono text-xs font-bold uppercase tracking-widest">✦ +50 XP</span>
                <button onClick={handleHeroCheck}
                  className="bg-[#FFD400] text-black border-2 border-black rounded-full px-4 py-1.5 font-mono font-bold text-xs uppercase tracking-widest shadow-[0_3px_0_0_black] hover:-translate-y-px transition-transform active:translate-y-0.5 active:shadow-none">
                  Check →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="bg-[#FFD400] border-y-2 border-foreground py-4 overflow-hidden">
        <div className="flex gap-14 whitespace-nowrap" style={{ animation: "scroll 28s linear infinite" }}>
          {["250+ students helped","3 hrs to exam-ready","~80% content identical across universities","7 subjects · all of first-year engineering",
            "250+ students helped","3 hrs to exam-ready","~80% content identical across universities","7 subjects · all of first-year engineering"].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-3 font-bold text-2xl tracking-tight text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-foreground flex-shrink-0" />{t}
            </span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="px-5 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-6 h-0.5 bg-primary" />How the game works
          </div>
          <h2 className="text-4xl font-bold tracking-tight">The <span className="text-primary">quest loop.</span><br />Four moves. Every topic.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {steps.map((s, i) => (
            <div key={s.n} className={`flex gap-4 p-5 rounded-2xl border-2 border-foreground shadow-[0_5px_0_0_hsl(var(--foreground))] bg-card ${i % 2 === 1 ? "md:mt-6" : ""}`}>
              <div className={`w-14 h-14 rounded-full border-2 border-foreground flex-shrink-0 flex items-center justify-center font-mono font-bold text-xl shadow-[0_4px_0_0_hsl(var(--foreground))] ${
                i === 1 ? "bg-[#22D3EE] text-foreground" : i === 3 ? "bg-primary text-white" : "bg-[#FFD400] text-foreground"
              }`}>{s.n}</div>
              <div>
                <h3 className="font-bold text-lg mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="px-5 py-16 max-w-6xl mx-auto bg-card rounded-3xl border-2 border-border mb-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-6 h-0.5 bg-primary" />The quest line
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Every subject.<br /><span className="text-primary">Every midterm.</span></h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {subjects.map((s) => (
            <div key={s.num} className="bg-background border-2 border-foreground rounded-2xl p-4 shadow-[0_5px_0_0_hsl(var(--foreground))] hover:-translate-y-1 hover:shadow-[0_8px_0_0_hsl(var(--foreground))] transition-all cursor-pointer" onClick={onSignIn}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest">Island {s.num}</span>
                <span className={`font-mono text-[9px] font-bold uppercase ${s.diff === "hard" ? "text-red-500" : "text-primary"}`}>● {s.diff === "hard" ? "Boss Tier" : "Mid Tier"}</span>
              </div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <h4 className="font-bold text-sm">{s.name}</h4>
              <p className="text-muted-foreground text-xs mt-0.5">{s.desc}</p>
              <div className="mt-2 font-mono text-[10px] text-[#22D3EE] font-bold uppercase tracking-wide">⚡ {s.xp} XP to clear</div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-foreground py-16 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-[#FFD400] font-mono text-xs font-bold uppercase tracking-widest mb-3">
              <span className="w-6 h-0.5 bg-[#FFD400]" />From the players
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white">Real students.<br /><span className="text-[#FFD400]">Real W's.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.name} className="bg-white/5 border border-white/12 rounded-2xl p-5">
                <div className="text-[#FFD400] tracking-wider text-sm mb-2">★★★★★</div>
                <p className="font-bold text-white text-sm mb-2">{r.title}</p>
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{r.body}"</p>
                <div className="flex items-center gap-2.5 pt-3 border-t border-white/10">
                  <div className="w-8 h-8 rounded-full bg-primary border-2 border-[#FFD400] flex items-center justify-center font-mono font-bold text-xs text-[#FFD400]">{r.name.slice(0,2)}</div>
                  <div>
                    <div className="text-white text-xs font-semibold">{r.name}</div>
                    <div className="text-white/40 font-mono text-[10px] uppercase tracking-wide">{r.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 max-w-6xl mx-auto text-center">
        <div className="bg-primary rounded-3xl p-14 border-2 border-foreground shadow-[0_10px_0_0_hsl(var(--foreground))] relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full bg-[#FFD400]/15 pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full bg-[#22D3EE]/15 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white tracking-tight mb-3">Your first quest is <span className="text-[#FFD400]">free.</span></h2>
            <p className="text-white/80 text-lg mb-8 max-w-md mx-auto">Pick a subject. Get the system. Be exam-ready in three hours, not three weeks.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => loginWithGoogle()}
                className="flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-white text-foreground font-bold text-base border-2 border-white/30 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Start with Google
              </button>
              <button onClick={onSignIn}
                className="px-7 py-4 rounded-2xl bg-white/20 text-white font-bold text-base border-2 border-white/30 hover:bg-white/30 transition-colors">
                Sign in with Email
              </button>
            </div>
            <p className="text-white/50 font-mono text-xs mt-5 uppercase tracking-widest">⚡ 250+ students already inside</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-8 px-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5 text-white font-bold">
            <div className="w-6 h-6 rounded-lg bg-primary border-2 border-[#FFD400] flex items-center justify-center font-mono font-bold text-[9px] text-[#FFD400]">OQ</div>
            onquest
          </div>
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">© 2026 · Build the tools. Beat the exam.</p>
        </div>
      </footer>

      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes bob { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-8px) rotate(3deg); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:.3; } }
      `}</style>
    </div>
  );
}
