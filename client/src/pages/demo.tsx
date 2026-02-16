import { useState } from "react";
import { Link } from "wouter";
import {
  BookOpen, ClipboardCheck, TrendingUp, ShieldCheck, ArrowRight,
  Check, ChevronLeft, ChevronRight, Sparkles, GraduationCap,
  BarChart3, FileText, Lock, X, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RichContent } from "@/components/rich-content";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

type DemoScreen = "dashboard" | "learn" | "practice" | "cheatsheet";

// ── Real Calc 2 content ─────────────────────────────────────────────

const DEMO_COURSES = [
  {
    name: "Calculus II Part 1",
    icon: "📐",
    description: "Vectors, integration fundamentals, techniques, and approximation methods",
    locked: false,
    topics: [
      {
        name: "Vectors",
        icon: "→",
        description: "Dot products, cross products, projections, and vector planes",
        learnPercent: 60,
        practicePercent: 35,
        skills: [
          "Build a Vector From 2 Points",
          "Find Angle Between Vectors (Dot Product)",
          "Triangle Area (Cross Product)",
          "Projections",
          "Vector Planes",
        ],
      },
      {
        name: "Integration Fundamentals",
        icon: "∫",
        description: "Riemann sums, FTC Part 1 & 2, graphical connections",
        learnPercent: 80,
        practicePercent: 55,
        skills: [
          "Riemann Sum Formula",
          "FTC Part 1 (Derivative of Integral)",
          "FTC Part 2 (Evaluation Theorem)",
          "Derivatives ↔ Integrals Graphically",
        ],
      },
      {
        name: "Integration Techniques",
        icon: "∮",
        description: "u-sub, integration by parts, trig sub, partial fractions",
        learnPercent: 45,
        practicePercent: 20,
        skills: [
          "u-Substitution",
          "Integration by Parts (LIATE)",
          "Trig Substitution",
          "Partial Fractions",
        ],
      },
      {
        name: "Approximations",
        icon: "≈",
        description: "Midpoint, Simpson's, and trapezoidal methods",
        learnPercent: 100,
        practicePercent: 70,
        skills: [
          "Midpoint Approximation",
          "Simpson's Rule",
          "Trapezoidal Rule",
        ],
      },
    ],
  },
  {
    name: "Calculus II Part 2",
    icon: "📏",
    description: "Polar coordinates, complex numbers, integral applications, arc length, and improper integrals",
    locked: true,
    topics: [
      { name: "Polar Coordinates", icon: "🎯", description: "Polar curves, area, and coordinate conversion", learnPercent: 0, practicePercent: 0, skills: [] },
      { name: "Complex Numbers", icon: "ℂ", description: "Euler's formula, De Moivre's theorem", learnPercent: 0, practicePercent: 0, skills: [] },
      { name: "Slicing & Shells", icon: "🔄", description: "Volume by disk, washer, and shell methods", learnPercent: 0, practicePercent: 0, skills: [] },
      { name: "Arc Length & Surface Area", icon: "📐", description: "Arc length and surface area of revolution", learnPercent: 0, practicePercent: 0, skills: [] },
      { name: "Improper Integrals", icon: "∞", description: "Convergence, divergence, and evaluation", learnPercent: 0, practicePercent: 0, skills: [] },
    ],
  },
  {
    name: "Statics Part 1",
    icon: "⚖️",
    description: "Forces & Particle Equilibrium",
    locked: true,
    topics: [
      { name: "Vector Operations", icon: "➡️", description: "Addition, subtraction, unit vectors", learnPercent: 0, practicePercent: 0, skills: [] },
      { name: "Force Components", icon: "↗️", description: "Resolving forces into components", learnPercent: 0, practicePercent: 0, skills: [] },
      { name: "Free Body Diagrams", icon: "📋", description: "Isolating bodies and identifying forces", learnPercent: 0, practicePercent: 0, skills: [] },
      { name: "2D & 3D Equilibrium", icon: "⚖️", description: "Particle equilibrium in 2D and 3D", learnPercent: 0, practicePercent: 0, skills: [] },
    ],
  },
];

const DEMO_LEARN_CARDS = [
  {
    title: "Skill 1: u-Substitution",
    content: `U-substitution reverses the chain rule. Set $u = g(x)$, then $du = g'(x) \\, dx$:

$$\\int f(g(x)) \\cdot g'(x) \\, dx = \\int f(u) \\, du$$

**Steps:**
1. Choose $u$ (usually the "inner" function)
2. Find $du = g'(x) \\, dx$
3. Substitute $u$ and $du$ into the integral
4. Integrate in terms of $u$
5. Back-substitute to $x$

**Example 1:** $\\int 2x \\cos(x^2) \\, dx$

Let $u = x^2$, $du = 2x \\, dx$:
$$\\int \\cos(u) \\, du = \\sin(u) + C = \\sin(x^2) + C$$

**Example 2:** $\\int \\frac{3x^2}{x^3 + 1} \\, dx$

Let $u = x^3 + 1$, $du = 3x^2 \\, dx$:
$$\\int \\frac{du}{u} = \\ln|u| + C = \\ln|x^3 + 1| + C$$

**For definite integrals:** Change the limits when you substitute!
$$\\int_a^b f(g(x))g'(x) \\, dx = \\int_{g(a)}^{g(b)} f(u) \\, du$$`,
    formula: "$$\\int f(g(x)) \\cdot g'(x) \\, dx = \\int f(u) \\, du$$",
  },
  {
    title: "Skill 2: Integration by Parts",
    content: `Integration by parts comes from the product rule in reverse:

$$\\int u \\, dv = uv - \\int v \\, du$$

**LIATE Rule** for choosing $u$ (in order of priority):
- **L**ogarithmic: $\\ln(x)$
- **I**nverse trig: $\\arctan(x)$
- **A**lgebraic: $x^2, x$
- **T**rig: $\\sin(x), \\cos(x)$
- **E**xponential: $e^x$

**Example:** $\\int x e^x \\, dx$

Let $u = x$, $dv = e^x \\, dx$, then $du = dx$, $v = e^x$:
$$xe^x - \\int e^x \\, dx = xe^x - e^x + C$$`,
    formula: "$$\\int u \\, dv = uv - \\int v \\, du$$",
  },
  {
    title: "Skill 3: Trig Substitution",
    content: `Choose the correct trig substitution based on the radical:

| If you see | Set | Identity used |
|---|---|---|
| $\\sqrt{a^2 - x^2}$ | $x = a\\sin\\theta$ | $1 - \\sin^2\\theta = \\cos^2\\theta$ |
| $\\sqrt{a^2 + x^2}$ | $x = a\\tan\\theta$ | $1 + \\tan^2\\theta = \\sec^2\\theta$ |
| $\\sqrt{x^2 - a^2}$ | $x = a\\sec\\theta$ | $\\sec^2\\theta - 1 = \\tan^2\\theta$ |

**Steps:** Substitute, convert $dx$, simplify the radical, integrate in $\\theta$, draw the triangle, convert back to $x$.`,
    formula: "$$\\sqrt{a^2 - x^2} \\to x = a\\sin\\theta \\qquad \\sqrt{a^2 + x^2} \\to x = a\\tan\\theta \\qquad \\sqrt{x^2 - a^2} \\to x = a\\sec\\theta$$",
  },
  {
    title: "Skill 4: Partial Fractions",
    content: `For rational functions $\\frac{P(x)}{Q(x)}$ where $\\deg(P) < \\deg(Q)$, decompose into simpler fractions:

**Distinct linear factors:**
$$\\frac{1}{(x-a)(x-b)} = \\frac{A}{x-a} + \\frac{B}{x-b}$$

**Example:** $\\int \\frac{1}{x^2 - 1} \\, dx = \\int \\frac{1}{(x-1)(x+1)} \\, dx$

$$\\frac{1}{(x-1)(x+1)} = \\frac{A}{x-1} + \\frac{B}{x+1}$$

Set $x = 1$: $A = \\frac{1}{2}$ — Set $x = -1$: $B = -\\frac{1}{2}$

$$= \\frac{1}{2}\\ln|x-1| - \\frac{1}{2}\\ln|x+1| + C$$`,
    formula: "$$\\frac{P(x)}{Q(x)} = \\frac{A}{x-a} + \\frac{B}{x-b} + \\cdots$$",
  },
];

const DEMO_PRACTICE = {
  question: "Evaluate $\\int_0^1 x e^{x^2} \\, dx$ using substitution.",
  hint: "Let $u = x^2$",
  correctAnswer: "0.86",
  solution: `**Let** $u = x^2$, so $du = 2x \\, dx$, which means $x \\, dx = \\frac{du}{2}$

**Change the limits:**
- When $x = 0$: $u = 0$
- When $x = 1$: $u = 1$

**Substitute:**

$$\\int_0^1 x e^{x^2} \\, dx = \\frac{1}{2}\\int_0^1 e^u \\, du$$

**Evaluate:**

$$= \\frac{1}{2}\\left[e^u\\right]_0^1 = \\frac{1}{2}(e^1 - e^0) = \\frac{e - 1}{2} \\approx \\boxed{0.86}$$`,
};

const DEMO_CHEATSHEET_SECTIONS = [
  {
    topic: "Integration Techniques",
    icon: "∮",
    formulas: [
      { title: "u-Substitution", formula: "$$\\int f(g(x)) \\cdot g'(x) \\, dx = \\int f(u) \\, du$$" },
      { title: "Integration by Parts", formula: "$$\\int u \\, dv = uv - \\int v \\, du$$" },
      { title: "Trig Sub Table", formula: "$$\\sqrt{a^2 - x^2} \\to x = a\\sin\\theta \\quad | \\quad \\sqrt{a^2 + x^2} \\to x = a\\tan\\theta \\quad | \\quad \\sqrt{x^2 - a^2} \\to x = a\\sec\\theta$$" },
      { title: "Partial Fractions", formula: "$$\\frac{P(x)}{(x-a)(x-b)} = \\frac{A}{x-a} + \\frac{B}{x-b}$$" },
    ],
  },
  {
    topic: "Approximations",
    icon: "≈",
    formulas: [
      { title: "Midpoint Rule", formula: "$$M_n = \\Delta x \\sum_{i=1}^{n} f(\\bar{x}_i)$$" },
      { title: "Trapezoidal Rule", formula: "$$T_n = \\frac{\\Delta x}{2}[f(x_0) + 2f(x_1) + \\cdots + 2f(x_{n-1}) + f(x_n)]$$" },
      { title: "Simpson's Rule", formula: "$$S_n = \\frac{\\Delta x}{3}[f(x_0) + 4f(x_1) + 2f(x_2) + \\cdots + 4f(x_{n-1}) + f(x_n)]$$" },
    ],
  },
  {
    topic: "Vectors",
    icon: "→",
    formulas: [
      { title: "Dot Product", formula: "$$\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta$$" },
      { title: "Cross Product (Area)", formula: "$$\\text{Area} = \\frac{1}{2}|\\vec{PQ} \\times \\vec{PR}|$$" },
      { title: "Projection", formula: "$$\\text{proj}_{\\vec{v}}\\vec{u} = \\frac{\\vec{u} \\cdot \\vec{v}}{||\\vec{v}||^2}\\vec{v}$$" },
      { title: "Plane Equation", formula: "$$a(x - x_0) + b(y - y_0) + c(z - z_0) = 0$$" },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────

export default function DemoPage() {
  const [screen, setScreen] = useState<DemoScreen>("dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top CTA banner */}
      <div className="bg-primary text-primary-foreground px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-3 flex-shrink-0">
        <span>You're viewing a limited demo</span>
        <Link href="/">
          <Button size="sm" variant="secondary" className="h-7 text-xs font-semibold">
            Sign Up for Full Access
          </Button>
        </Link>
      </div>

      {/* Demo nav */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          <Link href="/" className="flex items-center gap-2 mr-4 flex-shrink-0 py-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Vector Prep</span>
          </Link>
          <DemoTab active={screen === "dashboard"} onClick={() => setScreen("dashboard")} icon={<TrendingUp className="w-3.5 h-3.5" />} label="Dashboard" />
          <DemoTab active={screen === "learn"} onClick={() => setScreen("learn")} icon={<BookOpen className="w-3.5 h-3.5" />} label="Learn" />
          <DemoTab active={screen === "practice"} onClick={() => setScreen("practice")} icon={<ClipboardCheck className="w-3.5 h-3.5" />} label="Practice" />
          <DemoTab active={screen === "cheatsheet"} onClick={() => setScreen("cheatsheet")} icon={<FileText className="w-3.5 h-3.5" />} label="Cheat Sheet" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {screen === "dashboard" && <DemoDashboard onNavigate={setScreen} />}
          {screen === "learn" && <DemoLearn />}
          {screen === "practice" && <DemoPractice />}
          {screen === "cheatsheet" && <DemoCheatSheet />}
        </div>
      </div>
    </div>
  );
}

function DemoTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors flex-shrink-0 ${
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────

function DemoDashboard({ onNavigate }: { onNavigate: (s: DemoScreen) => void }) {
  const allTopics = DEMO_COURSES.flatMap((c) => c.locked ? [] : c.topics);
  const overall = allTopics.length > 0
    ? allTopics.reduce((s, t) => s + (t.learnPercent + t.practicePercent) / 2, 0) / allTopics.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />
        <div className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back, Demo Student</h1>
              <p className="text-muted-foreground mt-1 text-sm">Continue where you left off and keep building momentum.</p>
            </div>
            <Button onClick={() => onNavigate("learn")}>
              <Sparkles className="w-4 h-4" />
              Start Learning
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <Card className="border-yellow-500/30">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-yellow-500/10 flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Test Confidence</p>
                  <p className="text-base font-semibold text-yellow-600">Building Up</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary flex-shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Overall Progress</p>
                  <p className="text-base font-semibold">{Math.round(overall)}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Topics Available</p>
                  <p className="text-base font-semibold">{allTopics.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Classes</h2>
        <div className="space-y-4">
          {DEMO_COURSES.map((course, ci) => (
            <DemoCourseCard key={ci} course={course} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoCourseCard({ course, onNavigate }: { course: typeof DEMO_COURSES[0]; onNavigate: (s: DemoScreen) => void }) {
  const [open, setOpen] = useState(!course.locked);
  const avg = course.topics.length > 0
    ? course.topics.reduce((s, t) => s + (t.learnPercent + t.practicePercent) / 2, 0) / course.topics.length
    : 0;

  if (course.locked) {
    return (
      <Card className="opacity-50 border-dashed">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl grayscale">{course.icon}</span>
              <div>
                <CardTitle className="text-base">{course.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex-shrink-0 gap-1">
              <Lock className="w-3 h-3" />
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{course.icon}</span>
                  <div>
                    <CardTitle className="text-base">{course.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{course.topics.length} topics</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={avg >= 100 ? "default" : "secondary"}>{Math.round(avg)}%</Badge>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
                </div>
              </div>
              <Progress value={avg} className="h-1.5 mt-3" />
            </CardHeader>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {course.topics.map((t, ti) => {
                const total = (t.learnPercent + t.practicePercent) / 2;
                return (
                  <Card key={ti} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg">{t.icon}</span>
                        <div className="min-w-0">
                          <CardTitle className="text-sm truncate">{t.name}</CardTitle>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
                        </div>
                      </div>
                      <Badge variant={total >= 90 ? "default" : "secondary"} className="text-[11px] flex-shrink-0">
                        {Math.round(total)}%
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      {/* Skills list */}
                      {t.skills.length > 0 && (
                        <div className="space-y-0.5 mb-2">
                          {t.skills.map((skill, si) => (
                            <div key={si} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${si < Math.ceil(t.skills.length * t.learnPercent / 100) ? "bg-primary" : "bg-muted"}`} />
                              {skill}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Learn</span>
                          <span className="font-medium">{t.learnPercent}%</span>
                        </div>
                        <Progress value={t.learnPercent} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Practice</span>
                          <span className="font-medium">{t.practicePercent}%</span>
                        </div>
                        <Progress value={t.practicePercent} className="h-1" />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => onNavigate("learn")}>
                          <BookOpen className="w-3 h-3" />
                          Learn
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => onNavigate("practice")}>
                          <ClipboardCheck className="w-3 h-3" />
                          Practice
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ── Learn ───────────────────────────────────────────────────────────

function DemoLearn() {
  const card = DEMO_LEARN_CARDS[0];

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">∮</span>
        <div>
          <h1 className="text-xl font-bold">Integration Techniques</h1>
          <p className="text-xs text-muted-foreground">Card 1 of {DEMO_LEARN_CARDS.length}</p>
        </div>
      </div>

      <Progress value={(1 / DEMO_LEARN_CARDS.length) * 100} className="h-1.5" />

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{card.title}</CardTitle>
            <Badge variant="outline" className="text-xs">Skill 1</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RichContent content={card.content} className="text-sm leading-relaxed" />

          {/* Key formula box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5 uppercase tracking-wide">Key Formula</p>
            <RichContent content={card.formula} className="text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Locked remaining cards */}
      {DEMO_LEARN_CARDS.slice(1).map((lockedCard, i) => (
        <div key={i} className="relative">
          <Card className="opacity-20 blur-[3px] pointer-events-none select-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{lockedCard.title}</CardTitle>
                <Badge variant="outline" className="text-xs">Skill {i + 2}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-40" />
            </CardContent>
          </Card>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground mb-1.5" />
            <p className="text-sm font-medium">{lockedCard.title}</p>
          </div>
        </div>
      ))}

      {/* Final CTA */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 text-center">
          <p className="font-semibold">16 skills across 4 topics</p>
          <p className="text-sm text-muted-foreground mt-1">Sign up to unlock all learn cards with worked examples</p>
          <Link href="/">
            <Button className="mt-3">
              <Sparkles className="w-3.5 h-3.5" />
              Get Full Access
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Practice ────────────────────────────────────────────────────────

function DemoPractice() {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const userNum = parseFloat(answer.trim());
  const correctNum = parseFloat(DEMO_PRACTICE.correctAnswer);
  const isCorrect = !isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) < 0.02;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">∮</span>
        <div>
          <h1 className="text-xl font-bold">Practice: Integration Techniques</h1>
          <p className="text-xs text-muted-foreground">u-Substitution — Try solving this problem</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <Badge variant="outline" className="mb-3 text-xs">u-Substitution</Badge>
            <RichContent content={DEMO_PRACTICE.question} className="text-base" />
            <p className="text-xs text-muted-foreground mt-2 italic">Hint: {DEMO_PRACTICE.hint}</p>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">Your Answer (round to 2 decimals)</label>
              <Input
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); setSubmitted(false); }}
                placeholder="e.g. 0.86"
                className="font-mono"
                disabled={submitted && isCorrect}
              />
            </div>
            <Button
              onClick={() => setSubmitted(true)}
              disabled={!answer.trim() || (submitted && isCorrect)}
            >
              {submitted ? (isCorrect ? "Correct!" : "Try Again") : "Submit"}
            </Button>
          </div>

          {submitted && (
            <div className={`rounded-lg border p-4 ${
              isCorrect
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40"
                : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
            }`}>
              {isCorrect ? (
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-600">Correct!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-3">
                  <X className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-600">Not quite — the answer is {DEMO_PRACTICE.correctAnswer}</span>
                </div>
              )}
              <RichContent content={DEMO_PRACTICE.solution} className="text-sm" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lock overlay */}
      <div className="relative">
        <Card className="opacity-30 blur-[2px] pointer-events-none">
          <CardContent className="p-6"><div className="h-24" /></CardContent>
        </Card>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Unlimited randomized questions — sign up for full access</p>
          <Link href="/">
            <Button size="sm" className="mt-2">
              <Sparkles className="w-3.5 h-3.5" />
              Get Full Access
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Cheat Sheet ─────────────────────────────────────────────────────

function DemoCheatSheet() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Cheat Sheet</h1>
        <p className="text-xs text-muted-foreground">Auto-generated formula reference from your learn cards — take it to your exam</p>
      </div>

      {DEMO_CHEATSHEET_SECTIONS.map((section, si) => (
        <Card key={si}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{section.icon}</span>
              <CardTitle className="text-base">{section.topic}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.formulas.map((entry, i) => (
              <div key={i} className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">{entry.title}</p>
                <RichContent content={entry.formula} className="text-sm" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Lock overlay */}
      <div className="relative">
        <Card className="opacity-30 blur-[2px] pointer-events-none">
          <CardContent className="p-6"><div className="h-32" /></CardContent>
        </Card>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Full cheat sheet with custom formulas — sign up for full access</p>
          <Link href="/">
            <Button size="sm" className="mt-2">
              <Sparkles className="w-3.5 h-3.5" />
              Get Full Access
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
