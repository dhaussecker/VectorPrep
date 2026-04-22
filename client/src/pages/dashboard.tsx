import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Zap, BookOpen, ArrowRight, Lock, Trophy, Target, Star, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
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

  // Group tools by course
  const courseGroups = activeCourses.map((course) => ({
    course,
    tools: tools.filter((t) => t.tool.courseId === course.id),
  })).filter((g) => g.tools.length > 0);

  const xpForNext = profile ? xpToNextLevel(profile.level) : 500;
  const xpProgress = profile ? (xpInCurrentLevel(profile.xp, profile.level) / xpForNext) * 100 : 0;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent pointer-events-none" />
        <div className="relative px-6 py-8 md:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">Good luck,</p>
              <h1 className="text-3xl font-bold tracking-tight">{firstName}</h1>
            </div>
            <div className="flex items-center gap-2">
              {profile && profile.streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-sm font-semibold text-primary">{profile.streak} day streak</span>
                </div>
              )}
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-5 p-4 rounded-xl bg-card border">
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Level {profile?.level ?? 1}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{profile?.xp ?? 0} / {xpForNext} XP</span>
                </div>
                <Progress value={Math.min(xpProgress, 100)} className="h-2" />
              </>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatCard icon={<Trophy className="w-4 h-4" />} label="Mastered" value={String(masteredCount)} color="text-primary bg-primary/10" isLoading={isLoading} />
            <StatCard icon={<Target className="w-4 h-4" />} label="Remaining" value={String(remainingCount)} color="text-muted-foreground bg-muted/50" isLoading={isLoading} />
            <StatCard icon={<Star className="w-4 h-4" />} label="Total XP" value={String(profile?.xp ?? 0)} color="text-amber-500 bg-amber-500/10" isLoading={isLoading} />
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-6">
        {/* Continue Learning CTA */}
        {nextTool && (
          <Link href={`/learn/${nextTool.tool.courseId ?? ""}/${nextTool.tool.id}`}>
            <div className="flex items-center justify-between p-5 rounded-xl bg-primary text-primary-foreground cursor-pointer hover:opacity-95 transition-opacity">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80 font-medium mb-1">Continue Learning</p>
                <p className="text-xl font-bold">{nextTool.tool.name}</p>
              </div>
              <ArrowRight className="w-7 h-7 opacity-90 flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* Badges */}
        {profile && profile.badges.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Badges</h2>
            <div className="flex gap-2 flex-wrap">
              {profile.badges.slice(-5).map((b) => (
                <Badge key={b.id} variant="secondary" className="gap-1 py-1 px-2">
                  <Zap className="w-3 h-3 text-primary" />
                  {b.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Course Groups */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Toolkit</h2>
            <Link href="/classes">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : courseGroups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tools available yet.</p>
              </CardContent>
            </Card>
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

function StatCard({ icon, label, value, color, isLoading }: { icon: React.ReactNode; label: string; value: string; color: string; isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border gap-1">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} flex-shrink-0`}>{icon}</div>
      {isLoading ? <Skeleton className="h-5 w-10 mt-1" /> : <p className="text-lg font-bold leading-none">{value}</p>}
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function CourseCard({ course, tools }: { course: Course; tools: ToolProgress[] }) {
  const avgProgress = tools.length > 0
    ? tools.reduce((sum, t) => sum + t.totalPercent, 0) / tools.length
    : 0;
  const mastered = tools.filter((t) => t.totalPercent >= 100).length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{course.icon}</span>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{course.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{mastered}/{tools.length} mastered</p>
            </div>
          </div>
          <Badge variant={avgProgress >= 100 ? "default" : "secondary"}>{Math.round(avgProgress)}%</Badge>
        </div>
        <Progress value={avgProgress} className="h-1.5 mt-3" />
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-2 gap-2">
          {tools.slice(0, 4).map(({ tool, totalPercent }) => (
            <Link key={tool.id} href={`/learn/${tool.courseId ?? ""}/${tool.id}`}>
              <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors hover:border-primary/30 ${tool.status === "locked" ? "opacity-50" : ""}`}>
                {tool.status === "locked" ? <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" /> : <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${totalPercent >= 100 ? "bg-primary" : totalPercent > 0 ? "bg-blue-500" : "bg-muted"}`} />}
                <span className="truncate font-medium">{tool.name}</span>
              </div>
            </Link>
          ))}
        </div>
        {tools.length > 4 && (
          <Link href={`/classes/${course.id}`}>
            <p className="text-xs text-muted-foreground text-center mt-2 hover:text-primary">+{tools.length - 4} more tools</p>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
