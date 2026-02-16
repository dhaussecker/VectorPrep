import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, BookOpen, ClipboardCheck, TrendingUp, ChevronDown, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { Topic, Course } from "@shared/schema";

type TopicProgress = {
  topic: Topic;
  learnPercent: number;
  practicePercent: number;
  totalPercent: number;
  learnCompleted: number;
  learnTotal: number;
  practiceCorrect: number;
  practiceTotal: number;
};

type CourseGroup = {
  course: Course | null;
  topics: TopicProgress[];
  averageProgress: number;
};

export default function ProgressPage() {
  const { data: progressData, isLoading } = useQuery<{
    overall: number;
    topics: TopicProgress[];
  }>({
    queryKey: ["/api/progress/overview"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const courseGroups = groupTopicsByCourse(progressData?.topics ?? [], courses ?? []);
  const accessibleGroups = courseGroups.filter((g) => !g.course?.locked);
  const accessibleTopics = accessibleGroups.flatMap((g) => g.topics);
  const overall = accessibleTopics.length > 0
    ? accessibleTopics.reduce((sum, tp) => sum + tp.totalPercent, 0) / accessibleTopics.length
    : 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1" data-testid="text-progress-title">Progress</h1>
        <p className="text-muted-foreground text-sm mb-6">Track your study progress across all classes</p>

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

function groupTopicsByCourse(topics: TopicProgress[], courses: Course[]): CourseGroup[] {
  const groups = new Map<string, TopicProgress[]>();
  for (const tp of topics) {
    const key = tp.topic.courseId ?? "uncategorized";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tp);
  }

  const result: CourseGroup[] = [];

  for (const course of courses) {
    const groupTopics = groups.get(course.id);
    if (groupTopics && groupTopics.length > 0) {
      const avg = groupTopics.reduce((sum, tp) => sum + tp.totalPercent, 0) / groupTopics.length;
      result.push({ course, topics: groupTopics, averageProgress: avg });
      groups.delete(course.id);
    } else if (course.locked) {
      result.push({ course, topics: [], averageProgress: 0 });
    }
  }

  const uncategorized = groups.get("uncategorized");
  if (uncategorized && uncategorized.length > 0) {
    const avg = uncategorized.reduce((sum, tp) => sum + tp.totalPercent, 0) / uncategorized.length;
    result.push({ course: null, topics: uncategorized, averageProgress: avg });
  }

  return result;
}

function CourseProgressSection({ group }: { group: CourseGroup }) {
  const [open, setOpen] = useState(false);
  const courseName = group.course?.name ?? "Other Topics";
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
                      {group.topics.length} topic{group.topics.length !== 1 ? "s" : ""}
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
              {group.topics.map((tp) => (
                <div key={tp.topic.id} className="border rounded-lg p-4" data-testid={`card-progress-${tp.topic.id}`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0">{tp.topic.icon}</span>
                      <span className="text-sm font-medium truncate">{tp.topic.name}</span>
                    </div>
                    <Badge variant={tp.totalPercent >= 100 ? "default" : "outline"}>
                      {Math.round(tp.totalPercent)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">Learn</span>
                        <span className="ml-auto font-medium">{tp.learnCompleted ?? 0}/{tp.learnTotal ?? 0}</span>
                      </div>
                      <Progress value={tp.learnPercent} className="h-1.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <ClipboardCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">Practice</span>
                        <span className="ml-auto font-medium">{tp.practiceCorrect ?? 0}/{tp.practiceTotal ?? 0}</span>
                      </div>
                      <Progress value={tp.practicePercent} className="h-1.5" />
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
