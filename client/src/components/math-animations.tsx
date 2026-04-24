import { useState } from "react";

// ─── Limit Approach ───────────────────────────────────────────────────────────

const LIMIT_STEPS = [
  { x: 0.50, fx: 1.50, label: "0.5",   fLabel: "1.5" },
  { x: 0.90, fx: 1.90, label: "0.9",   fLabel: "1.9" },
  { x: 0.99, fx: 1.99, label: "0.99",  fLabel: "1.99" },
  { x: 0.999, fx: 1.999, label: "0.999", fLabel: "1.999" },
];

// SVG coords: sx = 24 + x*81, sy = 88 - x*36  (hole at 105, 52)
function toSVG(x: number) {
  return { sx: 24 + x * 81, sy: 88 - x * 36 };
}

function LimitApproachAnimation() {
  const [step, setStep] = useState(0); // 0 = intro, 1-4 = steps, 5 = limit reached

  const atLimit = step === 5;
  const currentStep = step > 0 && step <= 4 ? LIMIT_STEPS[step - 1] : null;
  const dot = currentStep ? toSVG(currentStep.x) : null;
  const visibleRows = LIMIT_STEPS.slice(0, Math.max(0, step - 1));

  const advance = () => setStep(s => Math.min(s + 1, 5));
  const reset = () => setStep(0);

  return (
    <div className="rounded-2xl border-2 border-foreground overflow-hidden"
      style={{ background: "hsl(var(--card))", boxShadow: "0 4px 0 0 hsl(var(--foreground))" }}>

      {/* Header */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Limit Definition</p>
        <p className="font-serif italic text-sm">lim<sub style={{ fontSize: "0.65em" }}>x→1</sub> (x+1) = 2</p>
      </div>

      {/* Graph */}
      <svg viewBox="0 0 220 105" className="w-full">
        <defs>
          <filter id="anim-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Axes */}
        <line x1="20" y1="90" x2="208" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
        <line x1="20" y1="10" x2="20" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.25"/>

        {/* Dashed reference lines */}
        <line x1="20" y1="52" x2="105" y2="52" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/>
        <line x1="105" y1="52" x2="105" y2="90" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/>

        {/* Curve before hole */}
        <line x1="24" y1="88" x2="97" y2="57.2" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Curve after hole */}
        <line x1="113" y1="47.2" x2="189" y2="14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>

        {/* Hole */}
        <circle cx="105" cy="52" r="4.5" stroke="#22c55e" strokeWidth="2" fill="hsl(var(--card))"/>

        {/* Axis labels */}
        <text x="105" y="101" fontSize="9" fill="currentColor" opacity="0.5" textAnchor="middle">1</text>
        <text x="11" y="55" fontSize="9" fill="#22c55e" textAnchor="middle">2</text>

        {/* Moving dot */}
        {dot && !atLimit && (
          <circle cx={dot.sx} cy={dot.sy} r="6" fill="#22c55e" filter="url(#anim-glow)"
            style={{ transition: "cx 0.5s cubic-bezier(.2,.9,.2,1), cy 0.5s cubic-bezier(.2,.9,.2,1)" }}
          />
        )}

        {/* At limit: glow burst at hole */}
        {atLimit && (
          <>
            <circle cx="105" cy="52" r="10" fill="#22c55e" opacity="0.2"/>
            <circle cx="105" cy="52" r="6" fill="#22c55e" filter="url(#anim-glow)"/>
            <rect x="110" y="38" width="46" height="18" rx="4" fill="#22c55e"/>
            <text x="133" y="51" fontSize="10" fill="white" fontWeight="bold" textAnchor="middle" fontFamily="monospace">lim = 2 ✓</text>
          </>
        )}
      </svg>

      {/* Value table */}
      <div className="px-4 pb-3">
        {(step > 0 || atLimit) && (
          <div className="rounded-xl overflow-hidden border border-border mb-3">
            <div className="grid grid-cols-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1.5">
              <span>x →</span><span>f(x) →</span>
            </div>
            {visibleRows.map((s, i) => (
              <div key={i} className="grid grid-cols-2 px-3 py-1.5 text-sm font-mono border-t border-border">
                <span>{s.label}</span><span className="text-primary font-bold">{s.fLabel}</span>
              </div>
            ))}
            {atLimit && (
              <div className="grid grid-cols-2 px-3 py-1.5 text-sm font-mono border-t border-primary/40 bg-primary/8">
                <span className="font-black text-primary">→ 1</span>
                <span className="font-black text-primary">→ 2 ✓</span>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {step > 0 && (
            <button onClick={reset}
              className="px-3 py-2 rounded-xl border-2 border-border text-xs font-mono font-bold text-muted-foreground hover:border-foreground transition-colors">
              Reset
            </button>
          )}
          {!atLimit ? (
            <button onClick={advance}
              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground"
              style={{ boxShadow: "0 3px 0 0 hsl(var(--foreground))" }}>
              {step === 0 ? "Start →" : step < 4 ? "Next step →" : "Reach the limit →"}
            </button>
          ) : (
            <div className="flex-1 py-2 rounded-xl bg-primary/10 border-2 border-primary text-primary font-black text-sm text-center">
              lim(x→1) f(x) = 2 ✓
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Power Rule ───────────────────────────────────────────────────────────────

const POWER_STEPS = ["Identify n", "Bring n down", "Reduce power"];

function PowerRuleAnimation() {
  const [n, setN] = useState(3);
  const [step, setStep] = useState(0);

  const stepContent = [
    { label: `d/dx [x^${n}]`, sub: `n = ${n}` },
    { label: `${n} · x^${n}`, sub: `multiply by n` },
    { label: `${n}x^${n - 1}`, sub: `reduce power by 1`, done: true },
  ];

  return (
    <div className="rounded-2xl border-2 border-foreground overflow-hidden"
      style={{ background: "hsl(var(--card))", boxShadow: "0 4px 0 0 hsl(var(--foreground))" }}>

      <div className="px-4 pt-3 pb-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Power Rule</p>
      </div>

      {/* Formula display */}
      <div className="px-4 py-4 text-center">
        <p className="text-muted-foreground font-mono text-xs mb-1">{POWER_STEPS[step]}</p>
        <p className="font-serif italic text-4xl font-black text-foreground transition-all duration-300">
          {stepContent[step].label}
        </p>
        <p className="text-primary font-mono text-sm mt-1">{stepContent[step].sub}</p>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 mb-4">
        {POWER_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/50" : "w-3 bg-border"}`} />
        ))}
      </div>

      {/* n picker + controls */}
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">n =</span>
          {[2, 3, 4, 5].map(val => (
            <button key={val} onClick={() => { setN(val); setStep(0); }}
              className={`w-9 h-9 rounded-xl border-2 font-black font-mono text-sm transition-all ${n === val ? "bg-primary border-foreground text-primary-foreground shadow-[0_2px_0_0_hsl(var(--foreground))]" : "bg-card border-border hover:border-primary/50"}`}>
              {val}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep(0)}
              className="px-3 py-2 rounded-xl border-2 border-border text-xs font-mono font-bold text-muted-foreground hover:border-foreground transition-colors">
              Reset
            </button>
          )}
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground"
              style={{ boxShadow: "0 3px 0 0 hsl(var(--foreground))" }}>
              Next step →
            </button>
          ) : (
            <div className="flex-1 py-2 rounded-xl bg-primary/10 border-2 border-primary text-primary font-black text-sm text-center">
              d/dx [x^{n}] = {n}x^{n - 1} ✓
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const MATH_ANIMATIONS: Record<string, { name: string; description: string; Component: () => JSX.Element }> = {
  "limit-approach": {
    name: "Limit Approach",
    description: "Interactive graph: step through x approaching a from the left",
    Component: LimitApproachAnimation,
  },
  "power-rule": {
    name: "Power Rule",
    description: "Step through d/dx[xⁿ] = nxⁿ⁻¹ with selectable n",
    Component: PowerRuleAnimation,
  },
};

export function MathAnimation({ id }: { id: string }) {
  const entry = MATH_ANIMATIONS[id];
  if (!entry) return null;
  const { Component } = entry;
  return <Component />;
}
