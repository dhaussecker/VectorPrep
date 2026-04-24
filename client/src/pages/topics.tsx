import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Lock, ChevronRight, ArrowLeft, Zap, Trophy, Swords, Star } from "lucide-react";
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

// ─── Terrain themes ───────────────────────────────────────────────────────────

const TERRAIN = [
  { label: "Zone I",   from: "#1B4332", to: "#2D6A4F", accent: "#74C69D", glow: "#40916C" },
  { label: "Zone II",  from: "#1B3A5C", to: "#1E6091", accent: "#72BFED", glow: "#4895EF" },
  { label: "Zone III", from: "#4A1942", to: "#7B2D8B", accent: "#C77DFF", glow: "#9B5DE5" },
  { label: "Zone IV",  from: "#6B3A1F", to: "#944A28", accent: "#E09060", glow: "#D4704C" },
  { label: "Zone V",   from: "#5C1A1A", to: "#7B2828", accent: "#E07070", glow: "#C0392B" },
  { label: "Zone VI",  from: "#2C3E1A", to: "#4A6A2A", accent: "#A8D670", glow: "#8CB44A" },
];

// ─── Sound engine ─────────────────────────────────────────────────────────────

function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => { if (!ctxRef.current) ctxRef.current = new AudioContext(); return ctxRef.current; };

  const tone = useCallback((freq: number, type: OscillatorType, vol: number, dur: number, delay = 0) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur);
    } catch {}
  }, []);

  const playEnter   = useCallback(() => { tone(440,"triangle",.12,.12); tone(550,"triangle",.10,.12,.08); tone(660,"triangle",.08,.14,.16); }, [tone]);
  const playClick   = useCallback(() => { tone(700,"sine",.15,.1); tone(900,"sine",.08,.08,.05); }, [tone]);
  const playLocked  = useCallback(() => { tone(200,"sawtooth",.12,.08); tone(140,"sawtooth",.08,.12,.07); }, [tone]);

  return { playEnter, playClick, playLocked };
}

// ─── Compass Rose ─────────────────────────────────────────────────────────────

function CompassRose() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" style={{ animation: "compass-idle 12s ease-in-out infinite" }}>
      <style>{`@keyframes compass-idle{0%,100%{transform:rotate(0deg)}50%{transform:rotate(3deg)}}`}</style>
      <circle cx="28" cy="28" r="26" fill="#C8A96E" stroke="#8B6914" strokeWidth="2" />
      <circle cx="28" cy="28" r="20" fill="none" stroke="#8B6914" strokeWidth="0.5" strokeDasharray="2 3" />
      {/* N arrow (red) */}
      <polygon points="28,6 25,28 28,24 31,28" fill="#8B1A1A" />
      {/* S arrow (cream) */}
      <polygon points="28,50 25,28 28,32 31,28" fill="#F5EBD0" stroke="#8B6914" strokeWidth="0.5" />
      {/* E W dots */}
      <circle cx="48" cy="28" r="2" fill="#8B6914" />
      <circle cx="8"  cy="28" r="2" fill="#8B6914" />
      {/* Labels */}
      <text x="28" y="4"  textAnchor="middle" fill="#3D1F00" fontSize="5" fontWeight="bold" fontFamily="serif">N</text>
      <text x="28" y="54" textAnchor="middle" fill="#3D1F00" fontSize="5" fontWeight="bold" fontFamily="serif">S</text>
      <text x="54" y="30" textAnchor="middle" fill="#3D1F00" fontSize="5" fontWeight="bold" fontFamily="serif">E</text>
      <text x="2"  y="30" textAnchor="middle" fill="#3D1F00" fontSize="5" fontWeight="bold" fontFamily="serif">W</text>
      {/* Center pin */}
      <circle cx="28" cy="28" r="3" fill="#8B6914" />
      <circle cx="28" cy="28" r="1.5" fill="#F5EBD0" />
    </svg>
  );
}

// ─── Winding path connector ───────────────────────────────────────────────────

function PathConnector({ index }: { index: number }) {
  const offset = index % 2 === 0;
  return (
    <div className="flex justify-center relative h-14 pointer-events-none">
      <svg width="80" height="56" viewBox="0 0 80 56" className="overflow-visible">
        <defs>
          <marker id={`arrow-${index}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#8B691480" />
          </marker>
        </defs>
        <path
          d={offset ? "M40,0 Q60,28 40,56" : "M40,0 Q20,28 40,56"}
          stroke="#8B6914"
          strokeWidth="2"
          strokeDasharray="5 4"
          fill="none"
          opacity="0.45"
          markerEnd={`url(#arrow-${index})`}
        />
        {/* Tiny footprint icons along path */}
        <circle cx={offset ? 52 : 28} cy="28" r="2" fill="#8B691440" />
      </svg>
    </div>
  );
}

// ─── Zone marker card ─────────────────────────────────────────────────────────

function ZoneMarker({ course, index, masteredCount, toolCount, onPress }: {
  course: Course; index: number; masteredCount: number; toolCount: number; onPress: () => void;
}) {
  const t = TERRAIN[index % TERRAIN.length];
  const isLocked = course.locked;
  const pct = toolCount > 0 ? (masteredCount / toolCount) * 100 : 0;
  const stars = pct >= 100 ? 3 : pct >= 66 ? 2 : pct >= 33 ? 1 : 0;

  return (
    <div className="relative">
      <style>{`
        @keyframes beacon-pulse{0%{box-shadow:0 0 0 0 ${t.glow}66}70%{box-shadow:0 0 0 14px ${t.glow}00}100%{box-shadow:0 0 0 0 ${t.glow}00}}
        .beacon-${index}{animation:beacon-pulse 2.2s ease-in-out infinite}
        @keyframes fog-drift{0%,100%{opacity:.55;transform:translateX(0)}50%{opacity:.75;transform:translateX(6px)}}
        .fog-${index}{animation:fog-drift ${5+index}s ease-in-out infinite}
        @keyframes sparkle-float{0%,100%{transform:translateY(0) scale(1);opacity:.8}50%{transform:translateY(-6px) scale(1.2);opacity:1}}
        .spark-${index}{animation:sparkle-float ${2.4+index*0.3}s ease-in-out infinite}
      `}</style>

      {/* Beacon dot above card */}
      {!isLocked && (
        <div className="flex justify-center -mb-1 relative z-20">
          <div className={`w-4 h-4 rounded-full border-2 border-[#F5EBD0] beacon-${index}`}
            style={{ background: t.accent }} />
        </div>
      )}

      <Link href={isLocked ? "#" : `/classes/${course.id}`}>
        <div
          onClick={onPress}
          className={cn(
            "rounded-3xl overflow-hidden border-2 transition-all duration-150 relative",
            isLocked
              ? "border-[#9B8B6A] cursor-not-allowed"
              : "cursor-pointer active:scale-[0.98]"
          )}
          style={{ borderColor: isLocked ? "#9B8B6A" : t.accent + "99" }}
        >
          {/* Terrain top banner */}
          <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
            {/* Subtle radial light */}
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 40%, ${t.accent}30 0%, transparent 70%)` }} />

            {/* Zone label top-left */}
            <span className="absolute top-3 left-4 text-[9px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">{t.label}</span>

            {/* Stars top-right */}
            <div className="absolute top-2.5 right-3 flex gap-0.5">
              {[0,1,2].map(i => (
                <Star key={i} className={cn("w-3.5 h-3.5", i < stars ? "fill-amber-400 text-amber-400" : "text-white/20")} />
              ))}
            </div>

            {/* Big icon center */}
            {!isLocked ? (
              <div className={`absolute inset-0 flex items-center justify-center spark-${index}`} style={{ fontSize: 52 }}>
                {course.icon}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontSize: 40 }} className={`fog-${index}`}>🌫️</span>
              </div>
            )}
          </div>

          {/* Fog of war overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-4 rounded-3xl"
              style={{ background: "linear-gradient(to bottom, rgba(196,180,150,0.5) 0%, rgba(196,180,150,0.85) 60%)" }}>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{ background: "#9B8B6A40", border: "1px solid #9B8B6A60" }}>
                <Lock className="w-3 h-3" style={{ color: "#6B4226" }} />
                <span className="text-[10px] font-mono font-bold" style={{ color: "#6B4226" }}>Coming Soon</span>
              </div>
            </div>
          )}

          {/* Parchment info section */}
          <div className="p-4" style={{ background: "linear-gradient(160deg, #F5EBD0, #EDE0C0)" }}>
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h2 className="font-black text-base leading-tight" style={{ color: "#3D1F00" }}>{course.name}</h2>
              {!isLocked && toolCount > 0 && (
                <span className="text-[9px] font-mono font-bold flex-shrink-0 mt-0.5" style={{ color: t.from }}>
                  {masteredCount}/{toolCount}
                </span>
              )}
            </div>
            <p className="text-xs font-mono line-clamp-1 mb-3" style={{ color: "#8B6914" }}>{course.description}</p>

            {!isLocked && (
              <>
                {toolCount > 0 && (
                  <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: "#DDD0B0" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: `linear-gradient(to right, ${t.from}, ${t.accent})` }} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: t.accent }} />
                    <span className="text-[10px] font-mono font-bold" style={{ color: t.glow }}>Quest Available</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold" style={{ color: "#6B4226" }}>Enter →</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── All quests — adventure map ───────────────────────────────────────────────

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

  return (
    <div
      className="min-h-full pb-8 relative"
      style={{ background: "linear-gradient(170deg,#EDE0C4 0%,#DFD0A8 40%,#D4C090 100%)" }}
    >
      {/* Parchment grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize:"200px" }} />

      {/* Map header */}
      <div className="relative z-10 px-5 pt-7 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-px w-8" style={{ background:"#8B691460" }} />
              <span className="text-[9px] font-mono uppercase tracking-[0.25em]" style={{ color:"#8B6914" }}>Realm of Knowledge</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color:"#3D1F00", fontFamily:"Georgia,serif" }}>
              Quest Map
            </h1>
            {progressData && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background:"#C8A96E", maxWidth:120 }}>
                  <div className="h-full rounded-full transition-all" style={{ width:`${progressData.overall}%`, background:"linear-gradient(to right,#2D6A4F,#74C69D)" }} />
                </div>
                <span className="text-[9px] font-mono font-bold" style={{ color:"#6B4226" }}>
                  {Math.round(progressData.overall)}% explored
                </span>
              </div>
            )}
          </div>
          <CompassRose />
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1 h-px" style={{ background:"linear-gradient(to right, transparent, #8B691440)" }} />
          <span style={{ color:"#8B6914", fontSize:12 }}>✦</span>
          <div className="flex-1 h-px" style={{ background:"linear-gradient(to left, transparent, #8B691440)" }} />
        </div>
      </div>

      {/* Zone list */}
      <div className="px-4 pt-2 relative z-10">
        {isLoading
          ? [1,2,3].map(i => <div key={i} className="mb-4"><Skeleton className="h-52 w-full rounded-3xl" style={{ background:"#C8A96E50" }} /></div>)
          : (courses ?? []).map((course, idx) => {
              const { toolCount, masteredCount } = getCourseCounts(course.id);
              return (
                <div key={course.id}>
                  <ZoneMarker
                    course={course}
                    index={idx}
                    toolCount={toolCount}
                    masteredCount={masteredCount}
                    onPress={() => course.locked ? playLocked() : playEnter()}
                  />
                  {idx < (courses?.length ?? 0) - 1 && <PathConnector index={idx} />}
                </div>
              );
            })
        }

        {/* Map legend */}
        <div className="mt-8 flex items-center gap-6 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#74C69D]" />
            <span className="text-[9px] font-mono" style={{ color:"#6B4226" }}>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" style={{ color:"#9B8B6A" }} />
            <span className="text-[9px] font-mono" style={{ color:"#6B4226" }}>Locked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[9px] font-mono" style={{ color:"#6B4226" }}>Mastered</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quest stage node ─────────────────────────────────────────────────────────

function QuestNode({ tp, index, theme }: { tp: ToolProgress; index: number; theme: typeof TERRAIN[0] }) {
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
          <div className="w-1 self-stretch flex-shrink-0"
            style={{ background: isDone ? "#D97706" : `linear-gradient(to bottom,${theme.from},${theme.to})` }} />
        )}

        <div className={cn("relative flex-shrink-0 my-3", isLocked && "ml-3")} style={{ width:sz, height:sz }}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} className="absolute inset-0">
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
            {!isLocked && totalPercent > 0 && (
              <circle cx={sz/2} cy={sz/2} r={r} fill="none"
                stroke={isDone ? "#D97706" : theme.accent}
                strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                transform={`rotate(-90 ${sz/2} ${sz/2})`}
                className="transition-all duration-700"
              />
            )}
          </svg>
          <div className={cn("absolute inset-[5px] rounded-full flex items-center justify-center", isDone ? "bg-amber-700/20" : "bg-card")}>
            {isDone
              ? <span className="text-base">⭐</span>
              : isLocked
              ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              : <span className="text-lg leading-none">{tool.icon || "📘"}</span>
            }
          </div>
        </div>

        <div className="flex-1 min-w-0 py-3 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
              Stage {String(index + 1).padStart(2,"0")}
            </span>
            {isDone && <span className="text-[8px] font-mono font-bold text-amber-600 bg-amber-600/10 px-1.5 py-0.5 rounded-full">DONE</span>}
            {isNext && <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full" style={{ color:theme.accent, background:theme.from+"18" }}>UP NEXT</span>}
          </div>
          <h3 className="font-black text-sm leading-tight truncate">{tool.name}</h3>
          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{tool.description}</p>
          {!isLocked && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width:`${totalPercent}%`, background: isDone ? "#D97706" : `linear-gradient(to right,${theme.from},${theme.accent})` }} />
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Zap className="w-2.5 h-2.5 text-primary" />
                <span className="text-[9px] font-black font-mono text-primary">{tool.xpReward ?? 100}</span>
              </div>
            </div>
          )}
        </div>

        {!isLocked && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mr-3" />}
      </div>
    </Link>
  );
}

// ─── Course / dungeon page ────────────────────────────────────────────────────

function CoursePage({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseData>({ queryKey: [`/api/courses/${courseId}/tools`] });

  if (isLoading) return (
    <div className="px-5 py-6 space-y-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
    </div>
  );

  if (!data) return <div className="px-5 py-6 text-muted-foreground">Quest not found.</div>;

  const { course, tools } = data;
  const theme = TERRAIN[0];
  const mastered = tools.filter(t => t.totalPercent >= 100).length;
  const avg = tools.length > 0 ? tools.reduce((s, t) => s + t.totalPercent, 0) / tools.length : 0;
  const allDone = mastered === tools.length && tools.length > 0;
  const stars = avg >= 100 ? 3 : avg >= 66 ? 2 : avg >= 33 ? 1 : 0;

  return (
    <div className="flex-1 overflow-auto">
      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-5 pb-6 border-b border-border"
        style={{ background:`linear-gradient(160deg,${theme.from}20,${theme.to}10)` }}>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background:theme.from }} />

        <Link href="/classes">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors relative z-10">
            <ArrowLeft className="w-4 h-4" /> Quest Map
          </button>
        </Link>

        <div className="flex items-start gap-4 mb-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl border-2 border-foreground shadow-hard flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background:`linear-gradient(135deg,${theme.from}33,${theme.to}22)` }}>
            {course.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Quest</p>
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <Star key={i} className={cn("w-3 h-3", i < stars ? "text-amber-500 fill-amber-500" : "text-border")} />
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
              ? <div className="flex items-center gap-1.5 text-amber-600"><Trophy className="w-5 h-5" /><span className="text-sm font-black font-mono">COMPLETE</span></div>
              : <div className="w-11 h-11 rounded-full border-2 border-foreground flex items-center justify-center"
                  style={{ background:`${theme.from}18`, borderColor:theme.accent+"80" }}>
                  <Swords className="w-4 h-4" style={{ color:theme.accent }} />
                </div>
            }
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width:`${avg}%`, background: avg>=100?"#D97706":`linear-gradient(to right,${theme.from},${theme.accent})` }} />
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">{tools.length} Stages</p>
        <div className="relative">
          {tools.length > 1 && (
            <div className="absolute left-[1.95rem] top-14 bottom-14 w-px -z-0"
              style={{ background:`linear-gradient(to bottom,${theme.accent}50,transparent)` }} />
          )}
          <div className="space-y-2.5 relative z-10">
            {tools.map((tp, i) => <QuestNode key={tp.tool.id} tp={tp} index={i} theme={theme} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const params = useParams();
  const courseId = (params as any).courseId;
  return courseId ? <CoursePage courseId={courseId} /> : <AllCoursesPage />;
}
