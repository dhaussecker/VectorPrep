import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Lock, ChevronRight, ArrowLeft, Zap, Trophy, Swords, Star, Search, Plus, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState, useEffect } from "react";
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

// Per-course accent colours
const ACCENTS = [
  "#52B788", "#72BFED", "#C77DFF", "#56CFE1", "#A8D670", "#D4A8F0", "#F4A261", "#E76F51",
];

// Fixed map positions (logical coords in a 560×720 world)
const MAP_POSITIONS = [
  { x: 100, y: 80  },
  { x: 380, y: 120 },
  { x: 220, y: 270 },
  { x: 440, y: 300 },
  { x: 80,  y: 460 },
  { x: 360, y: 490 },
  { x: 220, y: 630 },
  { x: 460, y: 650 },
];

// Which nodes are connected by paths
const CONNECTIONS = [
  [0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[4,5],[4,6],[5,7],
];

const WORLD_W = 560;
const WORLD_H = 720;
const NODE_R = 38;

// ─── Sound engine ─────────────────────────────────────────────────────────────

function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => { if (!ctxRef.current) ctxRef.current = new AudioContext(); return ctxRef.current; };
  const tone = useCallback((freq: number, type: OscillatorType, vol: number, dur: number, delay = 0) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur);
    } catch {}
  }, []);
  const playEnter  = useCallback(() => { tone(440,"triangle",.12,.12); tone(660,"triangle",.08,.14,.16); }, [tone]);
  const playLocked = useCallback(() => { tone(200,"sawtooth",.12,.08); }, [tone]);
  return { playEnter, playLocked };
}

// ─── Interactive map canvas ───────────────────────────────────────────────────

function QuestMap({ courses, progressData }: {
  courses: Course[];
  progressData?: { overall: number; tools: ToolProgress[] };
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ mx: 0, my: 0, px: 0, py: 0 });
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const { playEnter, playLocked } = useGameSounds();

  // Attach non-passive wheel listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => Math.max(0.35, Math.min(3, z * (e.deltaY < 0 ? 1.12 : 0.89))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    setDragging(true);
    setDragOrigin({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: dragOrigin.px + (e.clientX - dragOrigin.mx), y: dragOrigin.py + (e.clientY - dragOrigin.my) });
  };
  const onMouseUp = () => setDragging(false);

  // Touch pan
  const touch0 = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touch0.current = { x: t.clientX, y: t.clientY, px: pan.x, py: pan.y };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touch0.current) {
      const t = e.touches[0];
      setPan({ x: touch0.current.px + (t.clientX - touch0.current.x), y: touch0.current.py + (t.clientY - touch0.current.y) });
    }
  };

  const searchLower = search.toLowerCase();
  const matches = (c: Course) => !search || c.name.toLowerCase().includes(searchLower) || (c.description ?? "").toLowerCase().includes(searchLower);

  const getProgress = (courseId: number) => {
    const ct = progressData?.tools.filter(t => t.tool.courseId === courseId) ?? [];
    const pct = ct.length > 0 ? ct.reduce((s, t) => s + t.totalPercent, 0) / ct.length : 0;
    return { pct, mastered: ct.filter(t => t.totalPercent >= 100).length, total: ct.length };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 bg-background border-b border-border flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search quests..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-foreground bg-card text-sm font-mono focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Map viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{
          cursor: dragging ? "grabbing" : "grab",
          background: "hsl(var(--background))",
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground)/.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { touch0.current = null; }}
      >
        {/* Panned + zoomed world */}
        <div
          style={{
            position: "absolute",
            left: "50%", top: "50%",
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            transformOrigin: "center center",
            width: WORLD_W,
            height: WORLD_H,
          }}
        >
          {/* SVG: connections + progress rings */}
          <svg
            width={WORLD_W} height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Paths between connected nodes */}
            {CONNECTIONS.map(([a, b], i) => {
              const pa = MAP_POSITIONS[a]; const pb = MAP_POSITIONS[b];
              if (!pa || !pb) return null;
              const mx = (pa.x + pb.x) / 2 + (i % 2 === 0 ? 30 : -30);
              const my = (pa.y + pb.y) / 2;
              const hasA = a < courses.length; const hasB = b < courses.length;
              if (!hasA || !hasB) return null;
              const active = !courses[a].locked && !courses[b].locked;
              return (
                <path
                  key={i}
                  d={`M ${pa.x} ${pa.y} Q ${mx} ${my} ${pb.x} ${pb.y}`}
                  stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth={active ? 2.5 : 1.5}
                  strokeDasharray={active ? "none" : "6 4"}
                  fill="none"
                  opacity={active ? 0.5 : 0.3}
                />
              );
            })}
          </svg>

          {/* Course nodes */}
          {courses.map((course, i) => {
            const pos = MAP_POSITIONS[i];
            if (!pos) return null;
            const accent = ACCENTS[i % ACCENTS.length];
            const { pct, mastered, total } = getProgress(course.id);
            const isLocked = course.locked;
            const stars = pct >= 100 ? 3 : pct >= 66 ? 2 : pct >= 33 ? 1 : 0;
            const isMatch = matches(course);
            const circ = 2 * Math.PI * (NODE_R - 4);
            const dash = (pct / 100) * circ;

            return (
              <div
                key={course.id}
                style={{
                  position: "absolute",
                  left: pos.x - NODE_R,
                  top: pos.y - NODE_R,
                  width: NODE_R * 2,
                  opacity: search && !isMatch ? 0.15 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Pulse ring for unlocked */}
                {!isLocked && (
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      animation: "map-pulse 2.5s ease-out infinite",
                      border: `2px solid ${accent}`,
                      borderRadius: "50%",
                    }}
                  />
                )}

                {/* Search highlight glow */}
                {isMatch && search && (
                  <div className="absolute -inset-3 rounded-full pointer-events-none"
                    style={{ background: `${accent}30`, animation: "map-pulse 1s ease-out infinite" }} />
                )}

                <Link href={isLocked ? "#" : `/classes/${course.id}`}>
                  <div
                    onClick={() => isLocked ? playLocked() : playEnter()}
                    className="relative"
                    style={{ width: NODE_R * 2, height: NODE_R * 2 }}
                  >
                    {/* Progress ring */}
                    <svg width={NODE_R * 2} height={NODE_R * 2} className="absolute inset-0">
                      <circle cx={NODE_R} cy={NODE_R} r={NODE_R - 4} fill="none"
                        stroke="hsl(var(--border))" strokeWidth="3" />
                      {pct > 0 && (
                        <circle cx={NODE_R} cy={NODE_R} r={NODE_R - 4} fill="none"
                          stroke={accent} strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${dash} ${circ}`}
                          transform={`rotate(-90 ${NODE_R} ${NODE_R})`}
                        />
                      )}
                    </svg>

                    {/* Node circle */}
                    <div
                      className="absolute rounded-full border-2 flex items-center justify-center"
                      style={{
                        inset: 5,
                        background: isLocked ? "hsl(var(--muted))" : `linear-gradient(135deg, ${accent}22, ${accent}44)`,
                        borderColor: isLocked ? "hsl(var(--border))" : accent,
                        cursor: isLocked ? "not-allowed" : "pointer",
                      }}
                    >
                      {isLocked
                        ? <Lock className="w-5 h-5 text-muted-foreground" />
                        : <span style={{ fontSize: 26 }}>{course.icon}</span>
                      }
                    </div>

                    {/* Label below node */}
                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 text-center pointer-events-none"
                      style={{ width: 110 }}>
                      <p className="font-black text-xs leading-tight text-foreground truncate"
                        style={{ textShadow: "0 1px 3px hsl(var(--background))" }}>
                        {course.name}
                      </p>
                      {!isLocked && total > 0 && (
                        <div className="flex gap-0.5 justify-center mt-0.5">
                          {[0,1,2].map(s => (
                            <Star key={s} className={cn("w-2.5 h-2.5", s < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                          ))}
                        </div>
                      )}
                      {isLocked && (
                        <p className="text-[9px] font-mono text-muted-foreground">Coming soon</p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-5 right-4 flex flex-col gap-1.5 z-10">
          <button onClick={() => setZoom(z => Math.min(3, z * 1.3))}
            className="w-9 h-9 rounded-xl bg-card border-2 border-foreground shadow-hard flex items-center justify-center font-bold hover:bg-muted transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.35, z * 0.77))}
            className="w-9 h-9 rounded-xl bg-card border-2 border-foreground shadow-hard flex items-center justify-center font-bold hover:bg-muted transition-colors">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-[9px] font-mono text-muted-foreground hover:border-foreground transition-colors">
            fit
          </button>
        </div>

        {/* Overall progress bar — bottom */}
        {progressData && (
          <div className="absolute bottom-5 left-4 z-10 bg-card border-2 border-foreground rounded-xl px-3 py-2 shadow-hard">
            <p className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground mb-1">World explored</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressData.overall}%` }} />
              </div>
              <span className="text-[9px] font-black font-mono text-primary">{Math.round(progressData.overall)}%</span>
            </div>
          </div>
        )}

        <style>{`
          @keyframes map-pulse {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(1.5); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}

// ─── All quests page ──────────────────────────────────────────────────────────

function AllCoursesPage() {
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: progressData } = useQuery<{ overall: number; tools: ToolProgress[] }>({
    queryKey: ["/api/progress/overview"],
  });

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="bg-foreground px-5 pt-5 pb-4 flex-shrink-0">
        <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/40">Your journey</p>
        <h1 className="text-2xl font-black tracking-tight text-white">Quest Map</h1>
        <p className="text-[10px] text-white/40 font-mono mt-0.5">Drag to pan · Scroll or pinch to zoom · Tap to enter</p>
      </div>

      <QuestMap courses={courses ?? []} progressData={progressData} />
    </div>
  );
}

// ─── Quest stage node ─────────────────────────────────────────────────────────

function QuestNode({ tp, index }: { tp: ToolProgress; index: number }) {
  const { tool, totalPercent } = tp;
  const isLocked = tool.status === "locked";
  const isDone = totalPercent >= 100;
  const isNext = !isLocked && !isDone && totalPercent === 0;

  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => { if (!ctxRef.current) ctxRef.current = new AudioContext(); return ctxRef.current; };
  const playClick = () => { try { const ctx = getCtx(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = "sine"; o.frequency.setValueAtTime(700, ctx.currentTime); g.gain.setValueAtTime(.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime+.1); o.start(); o.stop(ctx.currentTime+.1); } catch {} };

  const sz = 56, r = 22, circ = 2 * Math.PI * r;
  const dash = (totalPercent / 100) * circ;

  return (
    <Link href={isLocked ? "#" : `/learn/${tool.courseId ?? ""}/${tool.id}`}>
      <div
        onClick={playClick}
        className={cn(
          "flex items-center gap-3 rounded-2xl border-2 overflow-hidden transition-all duration-150 select-none",
          isLocked
            ? "border-border bg-card/60 opacity-40 cursor-not-allowed"
            : "border-foreground bg-card shadow-hard cursor-pointer active:shadow-none active:translate-y-0.5"
        )}
      >
        {!isLocked && <div className="w-1 self-stretch flex-shrink-0 bg-primary" />}

        <div className={cn("relative flex-shrink-0 my-3", isLocked && "ml-3")} style={{ width:sz, height:sz }}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} className="absolute inset-0">
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
            {!isLocked && totalPercent > 0 && (
              <circle cx={sz/2} cy={sz/2} r={r} fill="none"
                stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`} transform={`rotate(-90 ${sz/2} ${sz/2})`}
                className="transition-all duration-700"
              />
            )}
          </svg>
          <div className="absolute inset-[5px] rounded-full flex items-center justify-center bg-card">
            {isDone ? <span className="text-base">⭐</span>
              : isLocked ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              : <span className="text-lg leading-none">{tool.icon || "📘"}</span>}
          </div>
        </div>

        <div className="flex-1 min-w-0 py-3 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
              Stage {String(index + 1).padStart(2,"0")}
            </span>
            {isDone && <span className="text-[8px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">DONE</span>}
            {isNext && <span className="text-[8px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">UP NEXT</span>}
          </div>
          <h3 className="font-black text-sm leading-tight truncate">{tool.name}</h3>
          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{tool.description}</p>
          {!isLocked && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width:`${totalPercent}%` }} />
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

// ─── Course / sub-quests page ─────────────────────────────────────────────────

function CoursePage({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseData>({ queryKey: [`/api/courses/${courseId}/tools`] });

  if (isLoading) return (
    <div className="px-5 py-6 space-y-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
    </div>
  );
  if (!data) return <div className="px-5 py-6 text-muted-foreground">Quest not found.</div>;

  const { course, tools } = data;
  const mastered = tools.filter(t => t.totalPercent >= 100).length;
  const avg = tools.length > 0 ? tools.reduce((s, t) => s + t.totalPercent, 0) / tools.length : 0;
  const allDone = mastered === tools.length && tools.length > 0;
  const stars = avg >= 100 ? 3 : avg >= 66 ? 2 : avg >= 33 ? 1 : 0;

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="bg-foreground px-5 pt-5 pb-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)/.2), transparent 70%)" }} />

        <Link href="/classes">
          <button className="flex items-center gap-1.5 text-sm text-white/50 mb-4 hover:text-white transition-colors relative z-10">
            <ArrowLeft className="w-4 h-4" /> Quest Map
          </button>
        </Link>

        <div className="flex items-start gap-4 mb-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl border-2 border-white/20 bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">
            {course.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">Quest</p>
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <Star key={i} className={cn("w-3 h-3", i < stars ? "text-amber-400 fill-amber-400" : "text-white/20")} />
                ))}
              </div>
            </div>
            <h1 className="text-xl font-black tracking-tight leading-tight text-white">{course.name}</h1>
            <p className="text-[11px] text-white/40 mt-0.5 font-mono line-clamp-1">{course.description}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border-2 border-white/10 p-4 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-5">
              <div>
                <p className="text-[8px] font-mono uppercase tracking-widest text-white/40">Progress</p>
                <p className="text-2xl font-black font-mono text-white">{Math.round(avg)}%</p>
              </div>
              <div>
                <p className="text-[8px] font-mono uppercase tracking-widest text-white/40">Stages</p>
                <p className="text-2xl font-black font-mono text-white">{mastered}/{tools.length}</p>
              </div>
            </div>
            {allDone
              ? <div className="flex items-center gap-1.5 text-primary"><Trophy className="w-5 h-5" /><span className="text-sm font-black font-mono">COMPLETE</span></div>
              : <div className="w-11 h-11 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center">
                  <Swords className="w-4 h-4 text-primary" />
                </div>
            }
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width:`${avg}%` }} />
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">{tools.length} Stages</p>
        <div className="relative">
          {tools.length > 1 && (
            <div className="absolute left-[1.95rem] top-14 bottom-14 w-px -z-0 bg-primary/20" />
          )}
          <div className="space-y-2.5 relative z-10">
            {tools.map((tp, i) => <QuestNode key={tp.tool.id} tp={tp} index={i} />)}
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
