import { useQuery } from "@tanstack/react-query";
import { BarChart3, BookOpen, ClipboardCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Topic } from "@shared/schema";

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

export default function ProgressPage() {
  const { data: progressData, isLoading } = useQuery<{
    overall: number;
    topics: TopicProgress[];
  }>({
    queryKey: ["/api/progress/overview"],
  });

  const topics = progressData?.topics ?? [];
  const overall = progressData?.overall ?? 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1" data-testid="text-progress-title">Progress</h1>
        <p className="text-muted-foreground text-sm mb-6">Track your study progress across all topics</p>

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
        ) : topics.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No progress data yet. Start learning to track your progress.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {topics.map((tp) => (
              <Card key={tp.topic.id} data-testid={`card-progress-${tp.topic.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 p-5 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl flex-shrink-0">{tp.topic.icon}</span>
                    <CardTitle className="text-base truncate">{tp.topic.name}</CardTitle>
                  </div>
                  <Badge variant={tp.totalPercent >= 100 ? "default" : "outline"}>
                    {Math.round(tp.totalPercent)}%
                  </Badge>
                </CardHeader>
                <CardContent className="p-5 pt-0">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
