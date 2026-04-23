import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Zap, BookOpen, ArrowRight, Lock, Trophy, Target, Flame, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

type UserProfileData = {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  badges: { id: string; name: string; icon: string }[];
};

function xpToNextLevel(level: number) { return level * 500; }
function xpInCurrentLevel(xp: number, level: number) { return xp - (level - 1) * 500; }

export default function Dashboard() {
  const { user } = useAuth();

  const { data: profileData, isLoading: profileLoading } = useQuery<UserProfileData>({
    queryKey: ["/api/user/profile"],
  });

  const { data: progressData, isLoading: progressLoading } = useQuery<{ overall: number; tools: ToolProgress[] }>({
    queryKey: ["/api/progress/overview"],
  });

  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  const streakMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/user/streak"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] }),
  });

  useEffect(() => { streakMutation.mutate(); }, []);

  const firstName = user?.displayName?.split(" ")[0] ?? "Student";
  const profile = profileData;
  const isLoading = profileLoading || progressLoading;

  const tools = progressData?.tools ?? [];
  const activeCourses = courses?.filter((c) => !c.locked) ?? [];
  const masteredCount = tools.filter((t) => t.totalPercent >= 100).length;
  const remainingCount = tools.filter((t) => t.totalPercent < 100).length;
  const nextTool = tools.find((t) => t.tool.status === "active" && t.totalPercent < 100);

  const courseGroups = activeCourses.map((course) => ({
    course,
    tools: tools.filter((t) => t.tool.courseId === course.id),
  })).filter((g) => g.tools.length > 0);

  const xpForNext = profile ? xpToNextLevel(profile.level) : 500;
  const xpProgress = profile ? (xpInCurrentLevel(profile.xp, profile.level) / xpForNext) * 100 : 0;

  return (
    <div className="flex-1 overflow-auto">
      {/* Hero header */}
      <div className="px-6 py-6 border-b border-border">
        {/* Name + streak row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight mt-0.5">{firstName}</h1>
          </div>
          {profile && profile.streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold font-mono text-orange-500">{profile.streak}</span>
            </div>
          )}
        </div>

        {/* XP level card — yellow with hard shadow */}
        <div className="rounded-2xl bg-[#FFD400] border-2 border-foreground p-4 shadow-hard mb-4">
          {isLoading ? (
            <Skeleton className="h-16 w-full bg-[#0F0F0F]/10" />
          ) : (
            <>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#0F0F0F]/60">Level</p>
                  <p className="text-4xl font-black font-mono text-[#0F0F0F] leading-none">{profile?.level ?? 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#0F0F0F]/60">Total XP</p>
                  <p className="text-2xl font-bold font-mono text-[#0F0F0F]">{profile?.xp ?? 0}</p>
                </div>
              </div>
              <div className="h-2.5 bg-[#0F0F0F]/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0F0F0F] rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(xpProgress, 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-[#0F0F0F]/50 mt-1.5">
                {xpInCurrentLevel(profile?.xp ?? 0, profile?.level ?? 1)} / {xpForNext} XP to Level {(profile?.level ?? 1) + 1}
              </p>
            </>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={<Trophy className="w-4 h-4" />} label="Mastered" value={String(masteredCount)} iconColor="text-primary" isLoading={isLoading} />
          <StatCard icon={<Target className="w-4 h-4" />} label="To Go" value={String(remainingCount)} iconColor="text-muted-foreground" isLoading={isLoading} />
          <StatCard icon={<Zap className="w-4 h-4" />} label="Streak" value={profile?.streak ? `${profile.streak}d` : "—"} iconColor="text-orange-500" isLoading={isLoading} />
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Continue Learning CTA */}
        {nextTool && (
          <Link href={`/learn/${nextTool.tool.courseId ?? ""}/${nextTool.tool.id}`}>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary border-2 border-foreground shadow-hard cursor-pointer active:shadow-none active:translate-y-1 transition-all group">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary-foreground/70">⚔️ Continue Quest</p>
                <p className="text-lg font-bold text-primary-foreground mt-0.5">{nextTool.tool.name}</p>
                {nextTool.totalPercent > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={nextTool.totalPercent} className="h-1.5 w-24 bg-primary-foreground/20" indicatorClassName="bg-[#FFD400]" />
                    <span className="text-[10px] font-mono text-primary-foreground/60">{Math.round(nextTool.totalPercent)}%</span>
                  </div>
                )}
              </div>
              <ArrowRight className="w-6 h-6 text-primary-foreground flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}

        {/* Badges */}
        {profile && profile.badges.length > 0 && (
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-2">Recent Badges</p>
            <div className="flex gap-2 flex-wrap">
              {profile.badges.slice(-5).map((b) => (
                <div key={b.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                  <span>{b.icon}</span>
                  <span>{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolkit */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">Active Quests</p>
            <Link href="/classes">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          ) : courseGroups.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No tools available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseGroups.map(({ course, tools: courseTools }) => (
                <CourseCard key={course.id} course={course} tools={courseTools} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, iconColor, isLoading }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor: string;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border-2 border-foreground shadow-hard gap-1">
      <div className={iconColor}>{icon}</div>
      {isLoading
        ? <Skeleton className="h-5 w-10 mt-1" />
        : <p className="text-lg font-bold font-mono leading-none">{value}</p>
      }
      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">{label}</p>
    </div>
  );
}

function CourseCard({ course, tools }: { course: Course; tools: ToolProgress[] }) {
  const avgProgress = tools.length > 0
    ? tools.reduce((sum, t) => sum + t.totalPercent, 0) / tools.length
    : 0;
  const mastered = tools.filter((t) => t.totalPercent >= 100).length;
  const displayTools = tools.slice(0, 5);

  return (
    <div className="rounded-2xl border-2 border-foreground overflow-hidden shadow-hard">
      {/* Course header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <span className="text-xl flex-shrink-0">{course.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{course.name}</h3>
          <p className="text-[11px] text-muted-foreground font-mono">{mastered}/{tools.length} mastered</p>
        </div>
        <span className="text-xs font-bold font-mono text-primary flex-shrink-0">{Math.round(avgProgress)}%</span>
      </div>

      {/* Cyan progress bar */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-[#22D3EE] transition-all duration-500" style={{ width: `${avgProgress}%` }} />
      </div>

      {/* Tool nodes */}
      <div className="bg-card p-3 space-y-1">
        {displayTools.map(({ tool, totalPercent }) => {
          const isLocked = tool.status === "locked";
          const isDone = totalPercent >= 100;
          const isActive = !isLocked && !isDone && totalPercent > 0;

          return (
            <Link key={tool.id} href={isLocked ? "#" : `/learn/${tool.courseId ?? ""}/${tool.id}`}>
              <div className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                isLocked ? "opacity-40 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
              )}>
                {/* Node circle */}
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  isDone ? "bg-primary border-primary text-primary-foreground" :
                  isActive ? "bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE]" :
                  isLocked ? "bg-muted border-border text-muted-foreground" :
                  "bg-background border-border text-muted-foreground"
                )}>
                  {isDone
                    ? <Check className="w-3.5 h-3.5" />
                    : isLocked
                    ? <Lock className="w-3 h-3" />
                    : <span className="text-[9px] font-mono font-bold">
                        {isActive ? `${Math.round(totalPercent)}%` : "○"}
                      </span>
                  }
                </div>

                <span className={cn(
                  "text-xs font-medium flex-1 truncate",
                  isLocked && "text-muted-foreground"
                )}>
                  {tool.name}
                </span>

                {isDone && (
                  <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    DONE
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {tools.length > 5 && (
          <Link href={`/classes/${course.id}`}>
            <p className="text-xs text-muted-foreground text-center py-1.5 hover:text-primary transition-colors font-mono">
              +{tools.length - 5} more →
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
