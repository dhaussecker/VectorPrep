import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, ClipboardCheck, TrendingUp, ArrowRight, Sparkles, ChevronDown, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";
import type { Topic, Course } from "@shared/schema";

type TopicProgress = {
  topic: Topic;
  learnPercent: number;
  practicePercent: number;
  totalPercent: number;
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: progressData, isLoading } = useQuery<{
    overall: number;
    topics: TopicProgress[];
  }>({
    queryKey: ["/api/progress/overview"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const firstName = user?.displayName?.split(" ")[0] ?? "Student";

  // Group topics by courseId
  const courseGroups = groupTopicsByCourse(progressData?.topics ?? [], courses ?? []);

  // Only count accessible (non-locked) topics for stats
  const accessibleGroups = courseGroups.filter((g) => !g.course?.locked);
  const accessibleTopics = accessibleGroups.flatMap((g) => g.topics);
  const accessibleTopicCount = accessibleTopics.length;
  const overallPercent = accessibleTopicCount > 0
    ? accessibleTopics.reduce((sum, tp) => sum + tp.totalPercent, 0) / accessibleTopicCount
    : 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="relative overflow-hidden rounded-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />
        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-greeting">
                Welcome back, {firstName}
              </h1>
              <p className="text-muted-foreground mt-1">
                Continue where you left off and keep building momentum.
              </p>
            </div>
            <Link href="/classes">
              <Button data-testid="button-start-learning">
                <Sparkles className="w-4 h-4" />
                Start Learning
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <ConfidenceCard percent={overallPercent} isLoading={isLoading} />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Overall Progress"
              value={`${Math.round(overallPercent)}%`}
              isLoading={isLoading}
            />
            <StatCard
              icon={<BookOpen className="w-4 h-4" />}
              label="Topics Available"
              value={String(accessibleTopicCount)}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-6">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold" data-testid="text-topics-heading">Your Classes</h2>
          <Link href="/classes">
            <Button variant="ghost" size="sm" data-testid="link-view-all-topics">
              View All
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courseGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No topics available yet. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {courseGroups.map((group) => (
              <CourseSection key={group.course?.id ?? "uncategorized"} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type CourseGroup = {
  course: Course | null;
  topics: TopicProgress[];
  averageProgress: number;
};

function groupTopicsByCourse(topics: TopicProgress[], courses: Course[]): CourseGroup[] {
  const courseMap = new Map<string, Course>();
  for (const c of courses) {
    courseMap.set(c.id, c);
  }

  const groups = new Map<string, TopicProgress[]>();
  for (const tp of topics) {
    const key = tp.topic.courseId ?? "uncategorized";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tp);
  }

  const result: CourseGroup[] = [];

  // Add course groups in course order (including locked courses with no topics)
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

  // Add uncategorized topics if any
  const uncategorized = groups.get("uncategorized");
  if (uncategorized && uncategorized.length > 0) {
    const avg = uncategorized.reduce((sum, tp) => sum + tp.totalPercent, 0) / uncategorized.length;
    result.push({ course: null, topics: uncategorized, averageProgress: avg });
  }

  return result;
}

function CourseSection({ group }: { group: CourseGroup }) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.topics.map((tp) => (
                <TopicCard key={tp.topic.id} topicProgress={tp} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function getConfidenceLevel(percent: number): { label: string; color: string; bg: string; border: string } {
  if (percent >= 85) return { label: "Exam Ready", color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" };
  if (percent >= 65) return { label: "Almost There", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" };
  if (percent >= 40) return { label: "Building Up", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
  if (percent >= 15) return { label: "Getting Started", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" };
  return { label: "Not Started", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
}

function ConfidenceCard({ percent, isLoading }: { percent: number; isLoading: boolean }) {
  const level = getConfidenceLevel(percent);
  return (
    <Card className={`${level.border} border`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-md ${level.bg} flex-shrink-0`}>
          <ShieldCheck className={`w-4 h-4 ${level.color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Test Confidence</p>
          {isLoading ? (
            <Skeleton className="h-5 w-24 mt-1" />
          ) : (
            <p className={`text-lg font-semibold ${level.color}`} data-testid="text-confidence-level">
              {level.label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value, isLoading }: { icon: React.ReactNode; label: string; value: string; isLoading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="h-5 w-16 mt-1" />
          ) : (
            <p className="text-lg font-semibold" data-testid={`text-stat-${label.toLowerCase().replace(/\s/g, "-")}`}>{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TopicCard({ topicProgress }: { topicProgress: TopicProgress }) {
  const { topic, learnPercent, practicePercent, totalPercent } = topicProgress;

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-topic-${topic.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl flex-shrink-0" role="img">{topic.icon}</span>
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{topic.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{topic.description}</p>
          </div>
        </div>
        <Badge variant={totalPercent >= 100 ? "default" : "secondary"} className="flex-shrink-0">
          {Math.round(totalPercent)}%
        </Badge>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Learn</span>
            <span className="font-medium">{Math.round(learnPercent)}%</span>
          </div>
          <Progress value={learnPercent} className="h-1.5" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Practice</span>
            <span className="font-medium">{Math.round(practicePercent)}%</span>
          </div>
          <Progress value={practicePercent} className="h-1.5" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Link href={`/learn/${topic.courseId ?? ""}/${topic.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full" data-testid={`button-learn-${topic.id}`}>
              <BookOpen className="w-3 h-3" />
              Learn
            </Button>
          </Link>
          <Link href={`/practice/${topic.courseId ?? ""}/${topic.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full" data-testid={`button-practice-${topic.id}`}>
              <ClipboardCheck className="w-3 h-3" />
              Practice
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
