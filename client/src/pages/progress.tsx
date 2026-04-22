import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, BookOpen, ClipboardCheck, TrendingUp, ChevronDown, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { Tool, Course } from "@shared/schema";

type ToolProgress = {
  tool: Tool;
  contentPercent: number;
  taskPercent: number;
  totalPercent: number;
  tasksCompleted: number;
  totalTasks: number;
};

type CourseGroup = {
  course: Course | null;
  tools: ToolProgress[];
  averageProgress: number;
};

export default function ProgressPage() {
  const { data: progressData, isLoading } = useQuery<{
    overall: number;
    tools: ToolProgress[];
  }>({
    queryKey: ["/api/progress/overview"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const courseGroups = groupToolsByCourse(progressData?.tools ?? [], courses ?? []);
  const accessibleGroups = courseGroups.filter((g) => !g.course?.locked);
  const accessibleTools = accessibleGroups.flatMap((g) => g.tools);
  const overall = accessibleTools.length > 0
    ? accessibleTools.reduce((sum, tp) => sum + tp.totalPercent, 0) / accessibleTools.length
    : 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1" data-testid="text-progress-title">Progress</h1>
        <p className="text-muted-foreground text-sm mb-6">Track your study progress across all courses</p>

        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10 flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Overall Completion</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold" data-testid="text-overall-progress">{Math.round(overall)}%</p>
                )}
                <Progress value={overall} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : courseGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No progress data yet. Start learning to track your progress.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {courseGroups.map((group) => (
              <CourseProgressSection key={group.course?.id ?? "uncategorized"} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupToolsByCourse(tools: ToolProgress[], courses: Course[]): CourseGroup[] {
  const groups = new Map<string, ToolProgress[]>();
  for (const tp of tools) {
    const key = tp.tool.courseId ?? "uncategorized";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tp);
  }

  const result: CourseGroup[] = [];

  for (const course of courses) {
    const groupTools = groups.get(course.id);
    if (groupTools && groupTools.length > 0) {
      const avg = groupTools.reduce((sum, tp) => sum + tp.totalPercent, 0) / groupTools.length;
      result.push({ course, tools: groupTools, averageProgress: avg });
      groups.delete(course.id);
    } else if (course.locked) {
      result.push({ course, tools: [], averageProgress: 0 });
    }
  }

  const uncategorized = groups.get("uncategorized");
  if (uncategorized && uncategorized.length > 0) {
    const avg = uncategorized.reduce((sum, tp) => sum + tp.totalPercent, 0) / uncategorized.length;
    result.push({ course: null, tools: uncategorized, averageProgress: avg });
  }

  return result;
}

function CourseProgressSection({ group }: { group: CourseGroup }) {
  const [open, setOpen] = useState(false);
  const courseName = group.course?.name ?? "Other Tools";
  const courseIcon = group.course?.icon ?? "📚";
  const isLocked = group.course?.locked ?? false;

  if (isLocked) {
    return (
      <Card className="opacity-50 border-dashed">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0 grayscale">{courseIcon}</span>
              <div className="min-w-0">
                <CardTitle className="text-base">{courseName}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.course?.description}
                </p>
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
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{courseIcon}</span>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{courseName}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {group.tools.length} tool{group.tools.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={group.averageProgress >= 100 ? "default" : "secondary"}>
                    {Math.round(group.averageProgress)}%
                  </Badge>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
                </div>
              </div>
              <div className="mt-3 px-1">
                <Progress value={group.averageProgress} className="h-1.5" />
              </div>
            </CardHeader>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="space-y-4">
              {group.tools.map((tp) => (
                <div key={tp.tool.id} className="border rounded-lg p-4" data-testid={`card-progress-${tp.tool.id}`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0">{tp.tool.icon}</span>
                      <span className="text-sm font-medium truncate">{tp.tool.name}</span>
                    </div>
                    <Badge variant={tp.totalPercent >= 100 ? "default" : "outline"}>
                      {Math.round(tp.totalPercent)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">Content</span>
                        <span className="ml-auto font-medium">{Math.round(tp.contentPercent)}%</span>
                      </div>
                      <Progress value={tp.contentPercent} className="h-1.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <ClipboardCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">Tasks</span>
                        <span className="ml-auto font-medium">{tp.tasksCompleted}/{tp.totalTasks}</span>
                      </div>
                      <Progress value={tp.taskPercent} className="h-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
