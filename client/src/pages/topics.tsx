import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Lock, Check, ChevronRight, ArrowLeft, Zap, Trophy, Swords, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

// ─── Quest node on the path ───────────────────────────────────────────────────

function QuestNode({ tp, index }: { tp: ToolProgress; index: number }) {
  const { tool, totalPercent, tasksCompleted, totalTasks } = tp;
  const isLocked = tool.status === "locked";
  const isDone = totalPercent >= 100;
  const isActive = !isLocked && !isDone && totalPercent > 0;
  const isNext = !isLocked && !isDone && totalPercent === 0;

  const nodeColor = isDone
    ? "bg-[#FFD400] border-foreground"
    : isActive
    ? "bg-primary border-foreground"
    : isNext
    ? "bg-card border-foreground"
    : "bg-muted border-border opacity-50";

  const circleSize = 64;
  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (totalPercent / 100) * circumference;

  return (
    <div className="relative">
      <style>{`
        @keyframes quest-pulse {
          0%,100% { box-shadow: 0 0 0 0 hsl(var(--primary)/.35); }
          50% { box-shadow: 0 0 0 10px hsl(var(--primary)/0); }
        }
        .quest-next { animation: quest-pulse 2s ease-in-out infinite; }
        @keyframes star-spin { to { transform: rotate(360deg); } }
        .star-spin { animation: star-spin 4s linear infinite; }
      `}</style>

      <Link href={isLocked ? "#" : `/learn/${tool.courseId ?? ""}/${tool.id}`}>
        <div className={cn(
          "flex items-center gap-4 rounded-3xl border-2 p-4 transition-all",
          isLocked
            ? "border-border bg-card opacity-50 cursor-not-allowed"
            : isDone
            ? "border-foreground bg-card shadow-hard cursor-pointer active:shadow-none active:translate-y-0.5"
            : isNext
            ? "border-foreground bg-card shadow-hard cursor-pointer active:shadow-none active:translate-y-0.5 quest-next"
            : "border-foreground bg-card shadow-hard cursor-pointer active:shadow-none active:translate-y-0.5"
        )}>

          {/* Progress ring + icon */}
          <div className="relative flex-shrink-0" style={{ width: circleSize, height: circleSize }}>
            <svg
              width={circleSize}
              height={circleSize}
              viewBox={`0 0 ${circleSize} ${circleSize}`}
              className="absolute inset-0"
            >
              {/* Track */}
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="3.5"
              />
              {/* Progress */}
              {!isLocked && totalPercent > 0 && (
                <circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  fill="none"
                  stroke={isDone ? "#FFD400" : "hsl(var(--primary))"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
                  className="transition-all duration-700"
                />
              )}
            </svg>

            {/* Center icon */}
            <div className={cn(
              "absolute inset-[6px] rounded-full flex items-center justify-center",
              isDone ? "bg-[#FFD400]" : isActive || isNext ? "bg-primary/10" : "bg-muted"
            )}>
              {isDone ? (
                <span className="text-xl star-spin">⭐</span>
              ) : isLocked ? (
                <Lock className="w-5 h-5 text-muted-foreground" />
              ) : (
                <span className="text-2xl leading-none">{tool.icon || "📘"}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-base truncate">{tool.name}</h3>
              {isDone && (
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  DONE
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{tool.description}</p>

            {isLocked ? (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Coming Soon
              </span>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress
                    value={totalPercent}
                    className="h-1.5"
                    indicatorClassName={isDone ? "bg-[#FFD400]" : "bg-primary"}
                  />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Zap className="w-3 h-3 text-[#FFD400]" />
                  <span className="text-[11px] font-black font-mono text-[#FFD400]">{tool.xpReward}</span>
                </div>
              </div>
            )}
          </div>

          {!isLocked && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </div>
      </Link>
    </div>
  );
}

// ─── Course quest page ────────────────────────────────────────────────────────

function CoursePage({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseData>({
    queryKey: [`/api/courses/${courseId}/tools`],
  });

  if (isLoading) {
    return (
      <div className="px-5 py-6 space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
      </div>
    );
  }

  if (!data) return <div className="px-5 py-6 text-muted-foreground">Quest not found.</div>;

  const { course, tools } = data;
  const mastered = tools.filter((t) => t.totalPercent >= 100).length;
  const avgProgress = tools.length > 0
    ? tools.reduce((sum, t) => sum + t.totalPercent, 0) / tools.length
    : 0;
  const allDone = mastered === tools.length && tools.length > 0;

  return (
    <div className="flex-1 overflow-auto">
      {/* Quest header */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/classes">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quest Map
          </button>
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-foreground bg-card shadow-hard flex items-center justify-center text-3xl flex-shrink-0">
            {course.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Quest</p>
            <h1 className="text-xl font-black tracking-tight leading-tight">{course.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{course.description}</p>
          </div>
        </div>

        {/* Quest progress card */}
        <div className="rounded-2xl bg-card border-2 border-foreground p-4 shadow-hard">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-5">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Progress</p>
                <p className="text-2xl font-black font-mono">{Math.round(avgProgress)}%</p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Mastered</p>
                <p className="text-2xl font-black font-mono">{mastered}/{tools.length}</p>
              </div>
            </div>
            {allDone ? (
              <div className="flex items-center gap-1.5 text-[#FFD400]">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-black font-mono">COMPLETE</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Swords className="w-5 h-5 text-primary" />
              </div>
            )}
          </div>
          <Progress value={avgProgress} className="h-2" indicatorClassName="bg-primary" />
        </div>
      </div>

      {/* Quest stages path */}
      <div className="px-5 py-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">
          {tools.length} Stages
        </p>

        <div className="relative">
          {/* Vertical path line */}
          {tools.length > 1 && (
            <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-gradient-to-b from-primary/40 via-border to-border -z-0" />
          )}

          <div className="space-y-4 relative z-10">
            {tools.map((tp, i) => (
              <QuestNode key={tp.tool.id} tp={tp} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── All quests / world map ───────────────────────────────────────────────────

function AllCoursesPage() {
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  if (isLoading) {
    return (
      <div className="px-5 py-6 space-y-4">
        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <style>{`
        @keyframes map-glow {
          0%,100% { box-shadow: 0 4px 0 0 hsl(var(--foreground)), 0 0 0 0 hsl(var(--primary)/.3); }
          50% { box-shadow: 0 4px 0 0 hsl(var(--foreground)), 0 0 20px 4px hsl(var(--primary)/.2); }
        }
        .map-active { animation: map-glow 3s ease-in-out infinite; }
      `}</style>

      <div className="px-5 py-6 border-b border-border">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
          Choose Your Path
        </p>
        <h1 className="text-3xl font-black tracking-tight">Quest Map 🗺️</h1>
      </div>

      <div className="px-5 py-5 space-y-4">
        {(courses ?? []).map((course) => {
          const isLocked = course.locked;
          return (
            <Link key={course.id} href={isLocked ? "#" : `/classes/${course.id}`}>
              <div className={cn(
                "rounded-3xl border-2 p-5 transition-all",
                isLocked
                  ? "border-border bg-card opacity-50 cursor-not-allowed"
                  : "border-foreground bg-card shadow-hard cursor-pointer active:shadow-none active:translate-y-0.5 map-active"
              )}>
                <div className="flex items-start gap-4">
                  {/* Big icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl flex-shrink-0",
                    isLocked ? "border-border bg-muted grayscale" : "border-foreground bg-[#FFD400]"
                  )}>
                    {course.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-black text-lg leading-tight">{course.name}</h2>
                      {isLocked && (
                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                          <Lock className="w-2.5 h-2.5" /> SOON
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{course.description}</p>
                  </div>

                  {!isLocked && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                </div>

                {!isLocked && (
                  <div className="mt-4 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-[#FFD400]" />
                    <span className="text-[11px] font-mono font-bold text-[#FFD400]">Quest Available</span>
                    <span className="text-[11px] font-mono text-muted-foreground ml-auto">Tap to enter →</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const params = useParams();
  const courseId = (params as any).courseId;
  return courseId ? <CoursePage courseId={courseId} /> : <AllCoursesPage />;
}
