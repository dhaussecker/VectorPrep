import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Zap, BookOpen, ArrowRight, Lock, Trophy, Target, Flame, Check, Map, Swords, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
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

type DashboardData = {
  profile: {
    xp: number;
    level: number;
    streak: number;
    lastActiveDate: string | null;
    badges: { id: string; name: string; icon: string }[];
  };
  courses: Course[];
  progress: { overall: number; tools: ToolProgress[] };
};

function xpToNextLevel(level: number) { return level * 500; }
function xpInLevel(xp: number, level: number) { return xp - (level - 1) * 500; }

export default function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    staleTime: 30_000,
  });

  const streakMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/user/streak"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }),
  });
  useEffect(() => { streakMutation.mutate(); }, []);

  const firstName = user?.displayName?.split(" ")[0] ?? "Adventurer";
  const profile = data?.profile;
  const tools = data?.progress?.tools ?? [];
  const courses = data?.courses ?? [];
  const overall = data?.progress?.overall ?? 0;

  const masteredCount = tools.filter(t => t.totalPercent >= 100).length;
  const remainingCount = tools.filter(t => t.totalPercent < 100).length;
  const nextTool = tools.find(t => t.tool.status === "active" && t.totalPercent < 100);

  const activeCourses = courses.filter(c => !c.locked);
  const courseGroups = activeCourses.map(course => ({
    course,
    tools: tools.filter(t => t.tool.courseId === course.id),
  })).filter(g => g.tools.length > 0);

  const xpForNext = profile ? xpToNextLevel(profile.level) : 500;
  const xpPct = profile ? (xpInLevel(profile.xp, profile.level) / xpForNext) * 100 : 0;

  return (
    <div className="flex-1 overflow-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-5 relative overflow-hidden bg-foreground">
        {/* Ambient green glow */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)/.25), transparent 70%)" }} />

        {/* Name + streak */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/40">Welcome back</p>
            <h1 className="text-3xl font-black tracking-tight text-white">{firstName}</h1>
          </div>
          {profile && profile.streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold font-mono text-primary">{profile.streak}d</span>
            </div>
          )}
        </div>

        {/* XP card */}
        <div className="rounded-2xl border-2 border-primary/30 p-4 relative z-10 bg-white/5">
          {isLoading ? (
            <Skeleton className="h-16 w-full bg-white/10" />
          ) : (
            <>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white/40">Level</p>
                  <p className="text-4xl font-black font-mono text-white leading-none">{profile?.level ?? 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white/40">Total XP</p>
                  <p className="text-2xl font-bold font-mono text-primary">{profile?.xp ?? 0}</p>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-white/10">
                <div className="h-full rounded-full transition-all duration-700 bg-primary"
                  style={{ width:`${Math.min(xpPct, 100)}%` }} />
              </div>
              <p className="text-[9px] font-mono text-white/30 mt-1.5">
                {xpInLevel(profile?.xp ?? 0, profile?.level ?? 1)} / {xpForNext} XP to Level {(profile?.level ?? 1) + 1}
              </p>
            </>
          )}
        </div>

        {/* Overall progress */}
        {!isLoading && (
          <div className="mt-3 flex items-center gap-2 relative z-10">
            <span className="text-[9px] font-mono text-white/40">Progress</span>
            <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
              <div className="h-full rounded-full transition-all duration-700 bg-primary"
                style={{ width:`${overall}%` }} />
            </div>
            <span className="text-[9px] font-mono font-bold text-white/60">{Math.round(overall)}%</span>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="px-5 pt-4 grid grid-cols-3 gap-2">
        <StatCard icon={<Trophy className="w-4 h-4" />} label="Mastered" value={String(masteredCount)} color="text-primary" isLoading={isLoading} />
        <StatCard icon={<Target className="w-4 h-4" />} label="To Go" value={String(remainingCount)} color="text-muted-foreground" isLoading={isLoading} />
        <StatCard icon={<Flame className="w-4 h-4" />} label="Streak" value={profile?.streak ? `${profile.streak}d` : "—"} color="text-red-600" isLoading={isLoading} />
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* ── Continue Quest CTA ── */}
        {nextTool && (
          <Link href={`/learn/${nextTool.tool.courseId ?? ""}/${nextTool.tool.id}`}>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary border-2 border-foreground shadow-hard cursor-pointer active:shadow-none active:translate-y-1 transition-all group">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary-foreground/70">⚔️ Continue Quest</p>
                <p className="text-lg font-bold text-primary-foreground mt-0.5">{nextTool.tool.name}</p>
                {nextTool.totalPercent > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,.2)" }}>
                      <div className="h-full bg-white/80 rounded-full transition-all duration-500" style={{ width:`${nextTool.totalPercent}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-primary-foreground/60">{Math.round(nextTool.totalPercent)}%</span>
                  </div>
                )}
              </div>
              <ArrowRight className="w-6 h-6 text-primary-foreground flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}

        {/* ── Badges ── */}
        {profile && profile.badges.length > 0 && (
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-2">Achievements</p>
            <div className="flex gap-2 flex-wrap">
              {profile.badges.slice(-5).map(b => (
                <div key={b.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                  <span>{b.icon}</span><span>{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Quests ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">Active Quests</p>
            <Link href="/classes">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2 gap-1">
                <Map className="w-3 h-3" /> View Map
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          ) : courseGroups.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No tools available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseGroups.map(({ course, tools: ct }) => (
                <CourseCard key={course.id} course={course} tools={ct} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, isLoading }: {
  icon: React.ReactNode; label: string; value: string; color: string; isLoading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border-2 border-foreground shadow-hard gap-1">
      <div className={color}>{icon}</div>
      {isLoading
        ? <Skeleton className="h-5 w-10 mt-1" />
        : <p className="text-lg font-bold font-mono leading-none">{value}</p>
      }
      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">{label}</p>
    </div>
  );
}

function CourseCard({ course, tools }: { course: Course; tools: ToolProgress[] }) {
  const avg = tools.length > 0 ? tools.reduce((s, t) => s + t.totalPercent, 0) / tools.length : 0;
  const mastered = tools.filter(t => t.totalPercent >= 100).length;
  const stars = avg >= 100 ? 3 : avg >= 66 ? 2 : avg >= 33 ? 1 : 0;

  return (
    <Link href={`/classes/${course.id}`}>
      <div className="rounded-2xl border-2 border-foreground overflow-hidden shadow-hard cursor-pointer active:shadow-none active:translate-y-0.5 transition-all">
        <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <span className="text-xl flex-shrink-0">{course.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{course.name}</h3>
            <p className="text-[11px] text-muted-foreground font-mono">{mastered}/{tools.length} mastered</p>
          </div>
          <div className="flex gap-0.5 flex-shrink-0">
            {[0,1,2].map(i => (
              <Star key={i} className={cn("w-3 h-3", i < stars ? "text-amber-500 fill-amber-500" : "text-border")} />
            ))}
          </div>
        </div>

        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-500" style={{ width:`${avg}%` }} />
        </div>

        <div className="bg-card p-3 space-y-1">
          {tools.slice(0, 4).map(({ tool, totalPercent }) => {
            const isLocked = tool.status === "locked";
            const isDone = totalPercent >= 100;
            const isActive = !isLocked && !isDone && totalPercent > 0;
            return (
              <div key={tool.id} className={cn("flex items-center gap-3 p-2 rounded-lg",
                isLocked ? "opacity-40" : "")}>
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[9px] font-mono font-bold",
                  isDone ? "bg-primary border-primary text-primary-foreground" :
                  isActive ? "bg-primary/10 border-primary text-primary" :
                  isLocked ? "bg-muted border-border text-muted-foreground" :
                  "bg-background border-border text-muted-foreground")}>
                  {isDone ? <Check className="w-3 h-3" /> : isLocked ? <Lock className="w-2.5 h-2.5" /> : "○"}
                </div>
                <span className={cn("text-xs font-medium flex-1 truncate", isLocked && "text-muted-foreground")}>
                  {tool.name}
                </span>
                {isActive && (
                  <span className="text-[9px] font-mono text-primary flex-shrink-0">{Math.round(totalPercent)}%</span>
                )}
              </div>
            );
          })}
          {tools.length > 4 && (
            <p className="text-xs text-muted-foreground text-center py-1 font-mono">+{tools.length - 4} more stages</p>
          )}
        </div>
      </div>
    </Link>
  );
}
