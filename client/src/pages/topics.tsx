import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, ClipboardCheck, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Topic } from "@shared/schema";

type TopicProgress = {
  topic: Topic;
  learnPercent: number;
  practicePercent: number;
  totalPercent: number;
};

export default function TopicsPage() {
  const [search, setSearch] = useState("");

  const { data: progressData, isLoading } = useQuery<{
    overall: number;
    topics: TopicProgress[];
  }>({
    queryKey: ["/api/progress/overview"],
  });

  const topics = progressData?.topics ?? [];
  const filtered = topics.filter(
    (tp) =>
      tp.topic.name.toLowerCase().includes(search.toLowerCase()) ||
      tp.topic.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-topics-page-title">Topics</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Browse and select a topic to study
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-topics"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-2 w-full mb-2" />
                  <Skeleton className="h-2 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search ? "No topics match your search." : "No topics available yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tp) => (
              <Card key={tp.topic.id} className="hover-elevate transition-all" data-testid={`card-topic-${tp.topic.id}`}>
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0" role="img">{tp.topic.icon}</span>
                      <CardTitle className="text-base truncate">{tp.topic.name}</CardTitle>
                    </div>
                    <Badge variant={tp.totalPercent >= 100 ? "default" : "outline"} className="flex-shrink-0">
                      {Math.round(tp.totalPercent)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{tp.topic.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">Learn</span>
                      <span>{Math.round(tp.learnPercent)}%</span>
                    </div>
                    <Progress value={tp.learnPercent} className="h-1.5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">Practice</span>
                      <span>{Math.round(tp.practicePercent)}%</span>
                    </div>
                    <Progress value={tp.practicePercent} className="h-1.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/learn/${tp.topic.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-learn-${tp.topic.id}`}>
                        <BookOpen className="w-3 h-3" />
                        Learn
                      </Button>
                    </Link>
                    <Link href={`/practice/${tp.topic.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-practice-${tp.topic.id}`}>
                        <ClipboardCheck className="w-3 h-3" />
                        Practice
                      </Button>
                    </Link>
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
