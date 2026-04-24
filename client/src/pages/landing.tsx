import { useAuth } from "@/hooks/use-auth";
import { OQLogo } from "@/components/oq-logo";

const subjects = [
  { num: "01", diff: "hard", icon: "📈", name: "Calculus", desc: "Derivatives · Integrals · Limits", xp: 600, preview: "d/dx [x³] = 3x²" },
  { num: "02", diff: "hard", icon: "🔢", name: "Linear Algebra", desc: "Matrices · Vectors · Eigenvalues", xp: 580, preview: "Ax = λx → find λ" },
  { num: "03", diff: "med", icon: "⚙️", name: "Mechanics", desc: "Forces · Motion · Equilibrium", xp: 500, preview: "ΣF = 0 → equilibrium" },
  { num: "04", diff: "hard", icon: "⚡", name: "Circuits", desc: "Ohm's Law · KVL · KCL", xp: 560, preview: "V = IR → solve for I" },
  { num: "05", diff: "med", icon: "🌊", name: "Physics", desc: "Waves · Thermodynamics · Optics", xp: 520, preview: "λf = v → find f" },
  { num: "06", diff: "med", icon: "💻", name: "Programming", desc: "Algorithms · Data Structures · Logic", xp: 480, preview: "O(n²) vs O(log n)" },
];

const steps = [
  { n: "01", title: "Pick a topic", desc: "Choose your subject. Each one is broken into short, focused lessons." },
  { n: "02", title: "Watch & answer", desc: "Scroll through bite-sized lessons. Answer questions as you go." },
  { n: "03", title: "Earn XP", desc: "Every correct answer levels you up. Track your progress in real time." },
  { n: "04", title: "Ace the exam", desc: "Finish the module and you're ready. No cramming, no guessing." },
];

const reviews = [
  { title: "Connected the dots my prof couldn't", body: "Calculus finally clicked. Every concept built on the last — it's the system my prof never gave me.", name: "Zack", sub: "MATH 134" },
  { title: "A true system", body: "Not just a study tool — a complete system. Simplified what took my prof weeks to explain.", name: "Ervin", sub: "MATH & SCIENCE" },
  { title: "Great for first year engineering", body: "Walked through difficult concepts step by step. Practice questions sealed the deal.", name: "Alan", sub: "FIRST YEAR ENG" },
  { title: "Felt confident applying the material", body: "I didn't just understand it — I felt confident applying it on the actual exam.", name: "Em", sub: "CALCULUS" },
  { title: "Swiss Army Knife of study tools", body: "Excellent for math and pretty much anything else. Will absolutely use it again.", name: "Graham", sub: "MATH" },
  { title: "The perfect prep tool", body: "Knew exactly what I needed in every subject. Highly recommend to any engineering student.", name: "Alec", sub: "MULTI-SUBJECT" },
];

export default function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-foreground border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OQLogo size={36} />
            <span className="text-white font-black text-xl tracking-tight">onquest</span>
          </div>
          <button
            onClick={onSignIn}
            className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:-translate-y-px transition-transform"
          >
            Sign In →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-5 py-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div>
            {/* Logo + badge row */}
            <div className="flex items-center gap-5 mb-8">
              <OQLogo size={72} />
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-mono text-sm font-bold uppercase tracking-wider border-2 border-foreground shadow-[0_3px_0_0_hsl(var(--foreground))]">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-foreground animate-pulse" />
                System now live
              </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.0] mb-8">
              Learn<br />
              exams<br />
              <span className="text-primary">fast.</span>
            </h1>

            <p className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-8 leading-snug">
              Short-form lessons built<br className="hidden md:block" /> for your next exam.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-white text-[#0F0F0F] font-bold text-base border-2 border-foreground shadow-[0_4px_0_0_hsl(var(--foreground))] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_hsl(var(--foreground))] transition-all active:translate-y-1 active:shadow-none"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button
                onClick={onSignIn}
                className="px-7 py-4 rounded-2xl bg-card border-2 border-border text-foreground font-bold text-base hover:border-primary/50 transition-colors"
              >
                Sign in with Email
              </button>
            </div>

            {/* Big checkmark feature list */}
            <div className="flex flex-col gap-4">
              {[
                { label: "Scroll like social media", sub: "TikTok-style lessons" },
                { label: "Quick bite-sized lessons", sub: "Under 60 seconds each" },
                { label: "Game-based platform", sub: "Earn XP, level up" },
              ].map(({ label, sub }) => (
                <div key={label} className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary border-2 border-foreground shadow-[0_3px_0_0_hsl(var(--foreground))] flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-black text-foreground leading-tight">{label}</p>
                    <p className="text-base text-muted-foreground font-mono">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform mockup — mirrors the real learn screen */}
          <div className="relative mx-auto md:mx-0 w-[360px]" style={{ animation: "card-float 5s ease-in-out infinite" }}>
            {/* Green ambient glow */}
            <div className="absolute inset-0 rounded-[2.5rem] blur-3xl opacity-25 pointer-events-none -z-10"
              style={{ background: "radial-gradient(circle at 50% 60%, hsl(var(--primary)), transparent 70%)" }} />

            {/* Phone frame */}
            <div className="rounded-[2.5rem] overflow-hidden border-2 border-foreground/10"
              style={{ background: "hsl(var(--background))", boxShadow: "0 40px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)" }}>

              {/* Top nav — matches real learn page */}
              <div className="flex items-center gap-2 px-4 pt-5 pb-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">✕</div>
                <div className="flex-1 flex gap-1.5 justify-center items-center">
                  {[true, true, "active", false, false].map((s, i) => (
                    <div key={i} className={`rounded-full transition-all ${
                      s === "active" ? "w-7 h-3 bg-primary" :
                      s === true    ? "w-3 h-3 bg-primary" :
                                      "w-3 h-3 bg-border"
                    }`} />
                  ))}
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: "hsl(var(--primary)/.1)", border: "1px solid hsl(var(--primary)/.2)" }}>
                  <span className="text-primary text-xs font-black">⚡ 100</span>
                </div>
              </div>

              {/* Tutor video — actual platform video, circular like the real learn screen */}
              <div className="flex justify-center pt-4 pb-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/25 scale-125 pointer-events-none"
                    style={{ animation: "ring-pulse 2s ease-out infinite" }} />
                  <div className="w-28 h-28 rounded-full border-4 border-primary overflow-hidden flex-shrink-0">
                    <video
                      src="https://zicpjbylqizukwtibjes.supabase.co/storage/v1/object/public/tutor-videos/1776970090247-3lu3ssfxcoz.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="text-center px-5 pt-1 pb-2">
                <p className="font-black text-base leading-snug">"What is a Limit?"</p>
              </div>

              {/* Limit animation card */}
              <div className="mx-4 mb-3 rounded-2xl border-2 border-foreground overflow-hidden"
                style={{ background: "hsl(var(--card))", boxShadow: "0 4px 0 0 hsl(var(--foreground))" }}>
                <div className="px-4 pt-3 pb-0 flex items-center justify-between">
                  <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">Limit Definition</p>
                  <p className="font-serif italic text-sm">lim<sub style={{ fontSize: "0.65em" }}>x→a</sub> f(x) = L</p>
                </div>

                <svg viewBox="0 0 220 105" className="w-full">
                  <defs>
                    <filter id="dot-glow" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Axes */}
                  <line x1="20" y1="90" x2="208" y2="90" stroke="#888" strokeWidth="1" opacity="0.3"/>
                  <line x1="20" y1="10" x2="20" y2="90" stroke="#888" strokeWidth="1" opacity="0.3"/>

                  {/* Dashed limit reference lines */}
                  <line x1="20" y1="52" x2="105" y2="52" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 3" opacity="0.55"/>
                  <line x1="105" y1="52" x2="105" y2="90" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 3" opacity="0.55"/>

                  {/* Curve before hole (x=0→0.9 in data, stopping short of hole) */}
                  <line x1="24" y1="88" x2="97" y2="57.2" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Curve after hole (x=1.1→2.0) */}
                  <line x1="113" y1="47.2" x2="189" y2="14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>

                  {/* Open circle at hole (x=1, y=L) */}
                  <circle cx="105" cy="52" r="4.5" stroke="#22c55e" strokeWidth="2" fill="hsl(var(--card))"/>

                  {/* Axis labels */}
                  <text x="105" y="101" fontSize="9" fill="#888" textAnchor="middle">a</text>
                  <text x="11" y="56" fontSize="9" fill="#22c55e" textAnchor="middle">L</text>
                  <text x="203" y="98" fontSize="8" fill="#888">x</text>

                  {/* "= L ✓" badge fades in as dot approaches */}
                  <g opacity="0">
                    <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.62;0.75;0.92;1" dur="2.8s" repeatCount="indefinite"/>
                    <rect x="110" y="40" width="36" height="18" rx="4" fill="#22c55e"/>
                    <text x="128" y="53" fontSize="10" fill="white" fontWeight="bold" textAnchor="middle" fontFamily="monospace">= L ✓</text>
                  </g>

                  {/* Animated glowing dot sliding toward the limit */}
                  <circle r="6" fill="#22c55e" filter="url(#dot-glow)">
                    <animateMotion
                      dur="2.8s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keyTimes="0;1"
                      keySplines="0.85 0 1 0.5"
                      path="M 24 88 L 99 56"
                    />
                  </circle>
                </svg>
              </div>

              {/* Got It button */}
              <div className="px-5 pb-8">
                <div className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg text-center border-2 border-foreground"
                  style={{ boxShadow: "0 4px 0 0 hsl(var(--foreground))" }}>
                  Got It →
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-5 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight">How it <span className="text-primary">works.</span></h2>
          <p className="text-xl text-muted-foreground mt-4">From zero to exam-ready in four steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {steps.map((s, i) => (
            <div key={s.n} className={`flex gap-5 p-7 rounded-2xl border-2 border-foreground shadow-[0_5px_0_0_hsl(var(--foreground))] bg-card ${i % 2 === 1 ? "md:mt-6" : ""}`}>
              <div className="w-16 h-16 rounded-full border-2 border-foreground flex-shrink-0 flex items-center justify-center font-mono font-black text-2xl shadow-[0_4px_0_0_hsl(var(--foreground))] bg-primary text-white">{s.n}</div>
              <div>
                <h3 className="font-black text-2xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="px-5 py-20 max-w-6xl mx-auto bg-card rounded-3xl border-2 border-border mb-20">
        <div className="mb-10">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight">Every subject.<br /><span className="text-primary">Every midterm.</span></h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <div
              key={s.num}
              className="group relative bg-background border-2 border-foreground rounded-2xl overflow-hidden shadow-[0_5px_0_0_hsl(var(--foreground))] hover:-translate-y-2 hover:shadow-[0_10px_0_0_hsl(var(--primary)/.6)] hover:border-primary transition-all duration-200 cursor-pointer"
              onClick={onSignIn}
            >
              {/* Green glow sweep on hover */}
              <div className="absolute inset-x-0 bottom-0 h-28 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: "linear-gradient(to top, hsl(var(--primary)/.15), transparent)" }} />

              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-bold text-primary uppercase">Quest {s.num}</span>
                  <span className={`font-mono text-sm font-bold uppercase ${s.diff === "hard" ? "text-red-500" : "text-primary"}`}>
                    {s.diff === "hard" ? "Boss Tier" : "Mid Tier"}
                  </span>
                </div>

                <div className="text-3xl mb-3 inline-block transition-transform duration-200 group-hover:scale-125">{s.icon}</div>
                <h4 className="font-black text-lg">{s.name}</h4>
                <p className="text-muted-foreground text-base mt-1">{s.desc}</p>

                {/* XP — fades out on hover */}
                <div className="mt-3 font-mono text-sm text-[#22D3EE] font-bold transition-all duration-150 group-hover:opacity-0 group-hover:-translate-y-1">
                  ⚡ {s.xp} XP to clear
                </div>

                {/* Hover reveal: sample problem + Start button */}
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  <span className="font-mono text-sm text-primary font-bold">{s.preview}</span>
                  <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-bold">Start →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS — auto-scroll marquee */}
      <section className="bg-foreground py-20">
        <div className="max-w-6xl mx-auto px-5 mb-10">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-white">
            Real students.<br /><span className="text-primary">Real W's.</span>
          </h2>
        </div>

        {/* Overflow hidden clips the marquee; hover pauses it */}
        <div className="overflow-hidden">
          <div
            className="flex gap-5 reviews-track"
            style={{ width: "max-content", animation: "reviews-scroll 40s linear infinite" }}
          >
            {/* Doubled for seamless loop */}
            {[...reviews, ...reviews].map((r, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[360px] bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col"
              >
                <div className="text-amber-400 text-2xl mb-4">★★★★★</div>
                <p className="font-black text-white text-xl mb-3">{r.title}</p>
                <p className="text-white/70 text-lg leading-relaxed mb-6 flex-1">"{r.body}"</p>
                <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center font-black text-base text-white flex-shrink-0">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white text-base font-bold">{r.name}</div>
                    <div className="text-white/40 font-mono text-sm uppercase tracking-wide">{r.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-24 max-w-6xl mx-auto text-center">
        <div className="bg-primary rounded-3xl p-16 border-2 border-foreground shadow-[0_10px_0_0_hsl(var(--foreground))] relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-5">
              Beta platform.<br /><span className="text-white/90">Currently free.</span>
            </h2>
            <p className="text-white/80 text-2xl mb-10 max-w-lg mx-auto">
              Be exam-ready in an hour.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-3 px-8 py-5 rounded-2xl bg-white text-foreground font-black text-lg border-2 border-white/30 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-transform"
              >
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Start with Google
              </button>
              <button
                onClick={onSignIn}
                className="px-8 py-5 rounded-2xl bg-white/20 text-white font-black text-lg border-2 border-white/30 hover:bg-white/30 transition-colors"
              >
                Sign in with Email
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-10 px-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 text-white font-black text-xl">
            <OQLogo size={32} />
            onquest
          </div>
          <p className="text-white/40 text-base">© 2026 · Short lessons. Real results.</p>
        </div>
      </footer>

      <style>{`
        @keyframes card-float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes reviews-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .reviews-track:hover { animation-play-state: paused; }
        @keyframes ring-pulse { 0% { transform: scale(1.25); opacity: 0.5; } 100% { transform: scale(1.6); opacity: 0; } }
      `}</style>
    </div>
  );
}
