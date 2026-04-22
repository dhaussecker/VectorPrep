import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Lock, CheckCircle2, Circle, ChevronRight, ArrowLeft, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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

function statusBadge(status: string, totalPercent: number) {
  if (status === "locked") return { label: "Locked", variant: "secondary" as const };
  if (totalPercent >= 100) return { label: "Mastered", variant: "default" as const };
  if (totalPercent > 0) return { label: "In Progress", variant: "outline" as const };
  return { label: "Not Started", variant: "secondary" as const };
}

function ToolCard({ tp }: { tp: ToolProgress }) {
  const { tool, totalPercent, tasksCompleted, totalTasks } = tp;
  const isLocked = tool.status === "locked";
  const sl = statusBadge(tool.status, totalPercent);

  return (
    <Link href={isLocked ? "#" : `/learn/${tool.courseId ?? ""}/${tool.id}`}>
      <Card className={`transition-all ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:border-primary/30 cursor-pointer"}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${isLocked ? "bg-muted grayscale" : "bg-primary/10"}`}>
              {isLocked ? <Lock className="w-4 h-4 text-muted-foreground" /> : tool.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{tool.name}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isLocked && (
                    <span className="text-xs font-medium text-amber-500 flex items-center gap-0.5">
                      <Zap className="w-3 h-3" />{tool.xpReward}
                    </span>
                  )}
                  <Badge variant={sl.variant} className="text-[10px] py-0">{sl.label}</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate mb-2">{tool.description}</p>
              {!isLocked && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{tasksCompleted}/{totalTasks} tasks</span>
                    <span>{Math.round(totalPercent)}%</span>
                  </div>
                  <Progress value={totalPercent} className="h-1" />
                </div>
              )}
            </div>
            {!isLocked && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          </div>
        </CardContent>
      </Card>
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
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!data) return <div className="p-6 text-muted-foreground">Course not found.</div>;

  const { course, tools } = data;
  const mastered = tools.filter((t) => t.totalPercent >= 100).length;
  const avgProgress = tools.length > 0 ? tools.reduce((sum, t) => sum + t.totalPercent, 0) / tools.length : 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent pointer-events-none" />
        <div className="relative px-6 py-8 md:px-8">
          <Link href="/classes">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> All Courses
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{course.icon}</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{course.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-lg font-bold">{Math.round(avgProgress)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mastered</p>
              <p className="text-lg font-bold">{mastered}/{tools.length}</p>
            </div>
          </div>
          <Progress value={avgProgress} className="mt-3 h-2" />
        </div>
      </div>
      <div className="px-6 md:px-8 py-6 space-y-3">
        {tools.map((tp) => <ToolCard key={tp.tool.id} tp={tp} />)}
      </div>
    </div>
  );
}

function AllCoursesPage() {
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  if (isLoading) return (
    <div className="p-6 space-y-3">
      {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 py-8 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Your Toolkit</h1>
        <p className="text-muted-foreground text-sm">Select a course to view its tools</p>
      </div>
      <div className="px-6 md:px-8 pb-8 space-y-3">
        {(courses ?? []).map((course) => (
          <Link key={course.id} href={course.locked ? "#" : `/classes/${course.id}`}>
            <Card className={`transition-all ${course.locked ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:border-primary/30 cursor-pointer"}`}>
              <CardHeader className="p-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{course.name}</CardTitle>
                      {course.locked && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
                          <Lock className="w-2.5 h-2.5" /> Coming Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{course.description}</p>
                  </div>
                  {!course.locked && <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                </div>
              </CardHeader>
            </Card>
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
