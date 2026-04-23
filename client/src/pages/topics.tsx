import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Lock, ChevronRight, ArrowLeft, Zap, Trophy, Swords, Star, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";
import type { Course, Tool } from "@shared/schema";

type ToolProgress = {
  tool: Tool;
  contentPercent: number;
  taskPercent: number;
  totalPercent: number;
  tasksCompleted: number;
  totalTasks: number;
};

type CourseData = { course: Course; tools: ToolProgress[] };

// ─── Zone themes ──────────────────────────────────────────────────────────────

const ZONE_THEMES = [
  { from: "#1D4ED8", to: "#0891B2", mid: "#2563EB", label: "Zone 01", bg: "linear-gradient(160deg,#1D4ED8 0%,#0891B2 100%)" },
  { from: "#B45309", to: "#D97706", mid: "#CA8A04", label: "Zone 02", bg: "linear-gradient(160deg,#92400E 0%,#D97706 100%)" },
  { from: "#6D28D9", to: "#7C3AED", mid: "#8B5CF6", label: "Zone 03", bg: "linear-gradient(160deg,#4C1D95 0%,#7C3AED 100%)" },
  { from: "#065F46", to: "#059669", mid: "#10B981", label: "Zone 04", bg: "linear-gradient(160deg,#064E3B 0%,#059669 100%)" },
  { from: "#9A3412", to: "#EA580C", mid: "#F97316", label: "Zone 05", bg: "linear-gradient(160deg,#7C2D12 0%,#EA580C 100%)" },
  { from: "#991B1B", to: "#DC2626", mid: "#EF4444", label: "Zone 06", bg: "linear-gradient(160deg,#7F1D1D 0%,#DC2626 100%)" },
];

// ─── Sound engine ─────────────────────────────────────────────────────────────

function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const tone = useCallback((freq: number, type: OscillatorType, vol: number, dur: number, delay = 0) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    } catch {}
  }, []);

  const playEnter = useCallback(() => {
    tone(440, "triangle", 0.12, 0.12);
    tone(550, "triangle", 0.10, 0.12, 0.08);
    tone(660, "triangle", 0.08, 0.14, 0.16);
  }, [tone]);

  const playClick = useCallback(() => {
    tone(700, "sine", 0.15, 0.1);
    tone(900, "sine", 0.08, 0.08, 0.05);
  }, [tone]);

  const playLocked = useCallback(() => {
    tone(200, "sawtooth", 0.12, 0.08);
    tone(140, "sawtooth", 0.08, 0.12, 0.07);
  }, [tone]);

  return { playEnter, playClick, playLocked };
}

// ─── Quest stage node ─────────────────────────────────────────────────────────

function QuestNode({ tp, index, theme }: {
  tp: ToolProgress;
  index: number;
  theme: typeof ZONE_THEMES[0];
}) {
  const { tool, totalPercent } = tp;
  const isLocked = tool.status === "locked";
  const isDone = totalPercent >= 100;
  const isNext = !isLocked && !isDone && totalPercent === 0;
  const { playClick, playLocked } = useGameSounds();

  const sz = 56, r = 22, circ = 2 * Math.PI * r;
  const dash = (totalPercent / 100) * circ;

  return (
    <Link href={isLocked ? "#" : `/learn/${tool.courseId ?? ""}/${tool.id}`}>
      <div
        onClick={() => isLocked ? playLocked() : playClick()}
        className={cn(
          "flex items-center gap-3 rounded-2xl border-2 overflow-hidden transition-all duration-150 select-none",
          isLocked
            ? "border-border bg-card/60 opacity-40 cursor-not-allowed"
            : "border-foreground bg-card shadow-hard cursor-pointer active:shadow-none active:translate-y-0.5"
        )}
      >
        {!isLocked && (
          <div
            className="w-1 self-stretch flex-shrink-0"
            style={{ background: isDone ? "#FFD400" : `linear-gradient(to bottom,${theme.from},${theme.to})` }}
          />
        )}

        {/* Ring */}
        <div className={cn("relative flex-shrink-0 my-3", isLocked && "ml-3")} style={{ width: sz, height: sz }}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} className="absolute inset-0">
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
            {!isLocked && totalPercent > 0 && (
              <circle cx={sz/2} cy={sz/2} r={r} fill="none"
                stroke={isDone ? "#FFD400" : theme.from}
                strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                transform={`rotate(-90 ${sz/2} ${sz/2})`}
                className="transition-all duration-700"
              />
            )}
          </svg>
          <div className={cn("absolute inset-[5px] rounded-full flex items-center justify-center",
            isDone ? "bg-[#FFD400]" : "bg-card")}>
            {isDone
              ? <span className="text-base">⭐</span>
              : isLocked ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              : <span className="text-lg leading-none">{tool.icon || "📘"}</span>
            }
          </div>
        </div>

        <div className="flex-1 min-w-0 py-3 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
              Stage {String(index + 1).padStart(2, "0")}
            </span>
            {isDone && (
              <span className="text-[8px] font-mono font-bold text-[#FFD400] bg-[#FFD400]/10 px-1.5 py-0.5 rounded-full">DONE</span>
            )}
            {isNext && (
              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full" style={{ color: theme.from, background: theme.from + "18" }}>UP NEXT</span>
            )}
          </div>
          <h3 className="font-black text-sm leading-tight truncate">{tool.name}</h3>
          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{tool.description}</p>
          {!isLocked && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width:`${totalPercent}%`, background: isDone ? "#FFD400" : `linear-gradient(to right,${theme.from},${theme.to})` }}
                />
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Zap className="w-2.5 h-2.5 text-[#FFD400]" />
                <span className="text-[9px] font-black font-mono text-[#FFD400]">{tool.xpReward ?? 100}</span>
              </div>
            </div>
          )}
        </div>

        {!isLocked && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mr-3" />}
      </div>
    </Link>
  );
}

// ─── Course page ──────────────────────────────────────────────────────────────

function CoursePage({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseData>({
    queryKey: [`/api/courses/${courseId}/tools`],
  });

  if (isLoading) {
    return (
      <div className="px-5 py-6 space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
      </div>
    );
  }

  if (!data) return <div className="px-5 py-6 text-muted-foreground">Quest not found.</div>;

  const { course, tools } = data;
  const theme = ZONE_THEMES[0];
  const mastered = tools.filter((t) => t.totalPercent >= 100).length;
  const avg = tools.length > 0 ? tools.reduce((s, t) => s + t.totalPercent, 0) / tools.length : 0;
  const allDone = mastered === tools.length && tools.length > 0;
  const stars = avg >= 100 ? 3 : avg >= 66 ? 2 : avg >= 33 ? 1 : 0;

  return (
    <div className="flex-1 overflow-auto">
      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-5 pb-6 border-b border-border"
        style={{ background: `linear-gradient(160deg, ${theme.from}20, ${theme.to}10)` }}>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: theme.from }} />

        <Link href="/classes">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors relative z-10">
            <ArrowLeft className="w-4 h-4" /> Quest Map
          </button>
        </Link>

        <div className="flex items-start gap-4 mb-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl border-2 border-foreground shadow-hard flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${theme.from}33,${theme.to}22)` }}>
            {course.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Quest</p>
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <Star key={i} className={cn("w-3 h-3", i < stars ? "text-[#FFD400] fill-[#FFD400]" : "text-border")} />
                ))}
              </div>
            </div>
            <h1 className="text-xl font-black tracking-tight leading-tight">{course.name}</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono line-clamp-1">{course.description}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card border-2 border-foreground p-4 shadow-hard relative z-10">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex gap-5">
              <div>
                <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">Progress</p>
                <p className="text-2xl font-black font-mono">{Math.round(avg)}%</p>
              </div>
              <div>
                <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">Stages</p>
                <p className="text-2xl font-black font-mono">{mastered}/{tools.length}</p>
              </div>
            </div>
            {allDone
              ? <div className="flex items-center gap-1.5 text-[#FFD400]"><Trophy className="w-5 h-5" /><span className="text-sm font-black font-mono">COMPLETE</span></div>
              : <div className="w-11 h-11 rounded-full border-2 flex items-center justify-center"
                  style={{ background: `${theme.from}18`, borderColor: theme.from }}>
                  <Swords className="w-4 h-4" style={{ color: theme.from }} />
                </div>
            }
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width:`${avg}%`, background: avg>=100?"#FFD400":`linear-gradient(to right,${theme.from},${theme.to})` }} />
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="px-5 py-5">
        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">{tools.length} Stages</p>
        <div className="relative">
          {tools.length > 1 && (
            <div className="absolute left-[1.95rem] top-14 bottom-14 w-px -z-0"
              style={{ background: `linear-gradient(to bottom,${theme.from}50,transparent)` }} />
          )}
          <div className="space-y-2.5 relative z-10">
            {tools.map((tp, i) => <QuestNode key={tp.tool.id} tp={tp} index={i} theme={theme} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reel-style zone card (full-screen snap) ──────────────────────────────────

function ZoneReel({ course, index, masteredCount, toolCount, onPress }: {
  course: Course;
  index: number;
  masteredCount: number;
  toolCount: number;
  onPress: () => void;
}) {
  const theme = ZONE_THEMES[index % ZONE_THEMES.length];
  const isLocked = course.locked;
  const pct = toolCount > 0 ? (masteredCount / toolCount) * 100 : 0;
  const stars = pct >= 100 ? 3 : pct >= 66 ? 2 : pct >= 33 ? 1 : 0;

  return (
    /* Each reel = 100% of the scroll container height, snap to it */
    <div className="snap-start flex-shrink-0 w-full h-full relative select-none">
      <Link href={isLocked ? "#" : `/classes/${course.id}`}>
        <div onClick={onPress} className="w-full h-full flex flex-col cursor-pointer">

          {/* Full gradient background */}
          <div className="absolute inset-0" style={{ background: isLocked ? "hsl(var(--muted))" : theme.bg }} />

          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "200px" }} />

          {/* Zone label top-left */}
          <div className="relative z-10 flex items-start justify-between p-6 pt-8">
            <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.2em]">{theme.label}</span>
            {!isLocked && (
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <Star key={i} className={cn("w-5 h-5 drop-shadow", i < stars ? "text-[#FFD400] fill-[#FFD400]" : "text-white/20")} />
                ))}
              </div>
            )}
          </div>

          {/* Center icon */}
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-3xl border-2 border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl"
                style={{ fontSize: 64 }}>
                {isLocked ? "🔒" : course.icon}
              </div>
            </div>
          </div>

          {/* Bottom overlay info — pb-24 clears the fixed bottom nav */}
          <div className="relative z-10 p-6 pb-24"
            style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.4) 60%,transparent 100%)" }}>

            <h2 className="text-2xl font-black text-white leading-tight mb-1">{course.name}</h2>
            <p className="text-sm text-white/70 font-mono mb-4 line-clamp-2">{course.description}</p>

            {isLocked ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white/50 bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Coming Soon
                </span>
              </div>
            ) : (
              <>
                {toolCount > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-mono text-white/50">{masteredCount}/{toolCount} stages mastered</span>
                      <span className="text-[10px] font-mono font-bold text-white/80">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFD400] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#FFD400] fill-[#FFD400]" />
                    <span className="text-[11px] font-mono font-bold text-[#FFD400]">Quest Available</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white font-mono font-bold text-xs px-4 py-2 rounded-full">
                    Enter <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Scroll hint — sits above the bottom overlay content area */}
      {index === 0 && (
        <div className="absolute bottom-48 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-50 pointer-events-none">
          <ChevronDown className="w-5 h-5 text-white animate-bounce" />
        </div>
      )}
    </div>
  );
}

// ─── All quests – reel world map ──────────────────────────────────────────────

function AllCoursesPage() {
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: progressData } = useQuery<{ overall: number; tools: ToolProgress[] }>({
    queryKey: ["/api/progress/overview"],
  });
  const { playEnter, playLocked } = useGameSounds();

  const getCourseCounts = (courseId: number) => {
    const ct = progressData?.tools.filter((t) => t.tool.courseId === courseId) ?? [];
    return { toolCount: ct.length, masteredCount: ct.filter((t) => t.totalPercent >= 100).length };
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    /* Vertical snap-scroll container — fills the parent (main) */
    <div
      className="h-full overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {(courses ?? []).map((course, idx) => {
        const { toolCount, masteredCount } = getCourseCounts(course.id);
        return (
          <ZoneReel
            key={course.id}
            course={course}
            index={idx}
            toolCount={toolCount}
            masteredCount={masteredCount}
            onPress={() => course.locked ? playLocked() : playEnter()}
          />
        );
      })}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const params = useParams();
  const courseId = (params as any).courseId;
  return courseId ? <CoursePage courseId={courseId} /> : <AllCoursesPage />;
}
