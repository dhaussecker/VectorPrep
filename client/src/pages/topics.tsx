import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { BookOpen, ClipboardCheck, Search, ArrowLeft, FolderOpen, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Topic, Course } from "@shared/schema";

type TopicProgress = {
  topic: Topic;
  learnPercent: number;
  practicePercent: number;
  totalPercent: number;
};

export default function ClassesPage() {
  const params = useParams<{ courseId?: string }>();
  const courseId = params?.courseId;

  if (courseId) {
    return <ClassTopicsView courseId={courseId} />;
  }

  return <ClassesListView />;
}

function ClassesListView() {
  const [search, setSearch] = useState("");

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const filtered = courses?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Select a class to view its topics
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-2 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search ? "No classes match your search." : "No classes available yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((course) =>
              course.locked ? (
                <Card key={course.id} className="opacity-50 border-dashed h-full">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl grayscale" role="img">{course.icon}</span>
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    <Badge variant="secondary" className="mt-3 gap-1">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </Badge>
                  </CardContent>
                </Card>
              ) : (
                <Link key={course.id} href={`/classes/${course.id}`}>
                  <Card className="hover-elevate transition-all cursor-pointer h-full">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl" role="img">{course.icon}</span>
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClassTopicsView({ courseId }: { courseId: string }) {
  const [search, setSearch] = useState("");

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: progressData, isLoading } = useQuery<{
    overall: number;
    topics: TopicProgress[];
  }>({
    queryKey: ["/api/progress/overview"],
  });

  const course = courses?.find((c) => c.id === courseId);
  const topics = progressData?.topics ?? [];
  const courseTopics = topics.filter((tp) => tp.topic.courseId === courseId);
  const filtered = courseTopics.filter(
    (tp) =>
      tp.topic.name.toLowerCase().includes(search.toLowerCase()) ||
      tp.topic.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="mb-6">
          <Link href="/classes">
            <Button variant="ghost" size="sm" className="mb-3 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Classes
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {course && <span className="text-3xl">{course.icon}</span>}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {course?.name ?? "Class"}
                </h1>
                {course && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {course.description}
                  </p>
                )}
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search topics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
                {search ? "No topics match your search." : "No topics in this class yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tp) => (
              <Card key={tp.topic.id} className="hover-elevate transition-all">
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
                    <Link href={`/learn/${courseId}/${tp.topic.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <BookOpen className="w-3 h-3" />
                        Learn
                      </Button>
                    </Link>
                    <Link href={`/practice/${courseId}/${tp.topic.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
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
