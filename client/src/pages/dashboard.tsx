import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, ClipboardCheck, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Topic } from "@shared/schema";

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

  const overallPercent = progressData?.overall ?? 0;
  const firstName = user?.displayName?.split(" ")[0] ?? "Student";

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
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Overall Progress"
              value={`${Math.round(overallPercent)}%`}
              isLoading={isLoading}
            />
            <StatCard
              icon={<BookOpen className="w-4 h-4" />}
              label="Topics Available"
              value={String(progressData?.topics.length ?? 0)}
              isLoading={isLoading}
            />
            <StatCard
              icon={<ClipboardCheck className="w-4 h-4" />}
              label="Completion Status"
              value={overallPercent >= 100 ? "Complete" : "In Progress"}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-6">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold" data-testid="text-topics-heading">Your Topics</h2>
          <Link href="/topics">
            <Button variant="ghost" size="sm" data-testid="link-view-all-topics">
              View All
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : progressData?.topics.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No topics available yet. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progressData?.topics.map((tp) => (
              <TopicCard key={tp.topic.id} topicProgress={tp} />
            ))}
          </div>
        )}
      </div>
    </div>
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
