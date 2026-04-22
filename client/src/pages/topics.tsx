import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Lock, CheckCircle2, ChevronRight, ArrowLeft, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function ToolNode({ tp }: { tp: ToolProgress }) {
  const { tool, totalPercent, tasksCompleted, totalTasks } = tp;
  const isLocked = tool.status === "locked";
  const isDone = totalPercent >= 100;
  const isActive = !isLocked && !isDone && totalPercent > 0;

  return (
    <Link href={isLocked ? "#" : `/learn/${tool.courseId ?? ""}/${tool.id}`}>
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
        isLocked
          ? "opacity-50 cursor-not-allowed border-border bg-card"
          : isDone
          ? "border-primary/40 bg-primary/5 hover:border-primary/60 cursor-pointer"
          : isActive
          ? "border-[#22D3EE]/50 bg-[#22D3EE]/5 hover:border-[#22D3EE]/80 cursor-pointer shadow-[0_3px_0_0_#22D3EE30]"
          : "border-border bg-card hover:border-primary/30 hover:shadow-hard cursor-pointer"
      )}>
        {/* Node indicator */}
        <div className={cn(
          "w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-mono",
          isDone
            ? "bg-primary border-primary text-primary-foreground"
            : isActive
            ? "bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE]"
            : isLocked
            ? "bg-muted border-border text-muted-foreground"
            : "bg-background border-border text-muted-foreground"
        )}>
          {isDone ? (
            <Check className="w-5 h-5" />
          ) : isLocked ? (
            <Lock className="w-4 h-4" />
          ) : isActive ? (
            <span className="text-sm font-bold">{Math.round(totalPercent)}%</span>
          ) : (
            <span className="text-lg">{tool.icon}</span>
          )}
        </div>

        {/* Tool info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-sm truncate">{tool.name}</h3>
            {!isLocked && (
              <span className="text-xs font-mono font-bold text-[#FFD400] bg-[#FFD400]/10 border border-[#FFD400]/20 px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-0.5">
                <Zap className="w-3 h-3" />{tool.xpReward}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mb-2">{tool.description}</p>
          {!isLocked && (
            <div className="flex items-center gap-2">
              <Progress
                value={totalPercent}
                className="h-1.5 flex-1"
                indicatorClassName={isDone ? "bg-primary" : isActive ? "bg-[#22D3EE]" : "bg-muted-foreground"}
              />
              <span className="text-[11px] text-muted-foreground font-mono flex-shrink-0">{tasksCompleted}/{totalTasks}</span>
            </div>
          )}
        </div>

        {!isLocked && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </div>
    </Link>
  );
}

function CoursePage({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseData>({
    queryKey: [`/api/courses/${courseId}/tools`],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    );
  }

  if (!data) return <div className="p-6 text-muted-foreground">Course not found.</div>;

  const { course, tools } = data;
  const mastered = tools.filter((t) => t.totalPercent >= 100).length;
  const avgProgress = tools.length > 0 ? tools.reduce((sum, t) => sum + t.totalPercent, 0) / tools.length : 0;

  return (
    <div className="flex-1 overflow-auto">
      {/* Course header */}
      <div className="px-6 py-6 border-b border-border">
        <Link href="/classes">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> All Courses
          </Button>
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{course.icon}</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5 font-mono">{course.description}</p>
          </div>
        </div>

        {/* Progress card */}
        <div className="rounded-2xl bg-card border-2 border-[#0F0F0F] dark:border-white/10 p-4 shadow-hard">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Progress</p>
                <p className="text-xl font-bold font-mono">{Math.round(avgProgress)}%</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Mastered</p>
                <p className="text-xl font-bold font-mono">{mastered}/{tools.length}</p>
              </div>
            </div>
            {mastered === tools.length && tools.length > 0 && (
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                ✓ COMPLETE
              </span>
            )}
          </div>
          <Progress value={avgProgress} className="h-2" indicatorClassName="bg-[#22D3EE]" />
        </div>
      </div>

      {/* Tool nodes list */}
      <div className="px-6 py-6 space-y-3">
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-4">
          {tools.length} Tools
        </p>
        {tools.map((tp) => <ToolNode key={tp.tool.id} tp={tp} />)}
      </div>
    </div>
  );
}

function AllCoursesPage() {
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  if (isLoading) return (
    <div className="p-6 space-y-3">
      {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
    </div>
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 py-6 border-b border-border">
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Select a course</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">Your Toolkit</h1>
      </div>
      <div className="px-6 py-6 space-y-3">
        {(courses ?? []).map((course) => (
          <Link key={course.id} href={course.locked ? "#" : `/classes/${course.id}`}>
            <div className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
              course.locked
                ? "opacity-50 cursor-not-allowed border-border bg-card"
                : "border-[#0F0F0F] dark:border-white/10 bg-card hover:bg-muted cursor-pointer shadow-hard active:shadow-none active:translate-y-0.5"
            )}>
              <span className={cn("text-3xl flex-shrink-0", course.locked && "grayscale")}>{course.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{course.name}</h3>
                  {course.locked && (
                    <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                      <Lock className="w-2.5 h-2.5" /> SOON
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-mono">{course.description}</p>
              </div>
              {!course.locked && <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const params = useParams();
  const courseId = (params as any).courseId;
  return courseId ? <CoursePage courseId={courseId} /> : <AllCoursesPage />;
}
