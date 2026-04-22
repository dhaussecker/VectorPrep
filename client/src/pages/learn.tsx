import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Lightbulb, BookOpen, Lock, CheckCircle2, Circle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RichContent } from "@/components/rich-content";
import type { Tool, ToolContentItem, Course } from "@shared/schema";

type LearnData = {
  tool: Tool;
  content: (ToolContentItem & { completed: boolean })[];
};

type CourseToolsData = {
  course: Course;
  tools: { tool: Tool; contentPercent: number; taskPercent: number; totalPercent: number }[];
};

type TaskWithStatus = { id: string; label: string; xp: number; completed: boolean };

export default function LearnPage() {
  const params = useParams<{ courseId: string; toolId: string }>();
  const { courseId, toolId } = params as any;

  if (courseId && toolId) return <LearnSession courseId={courseId} toolId={toolId} />;
  if (courseId) return <LearnToolSelector courseId={courseId} />;
  return <LearnCourseSelector />;
}

function LearnCourseSelector() {
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Learn Mode</h1>
        <p className="text-muted-foreground text-sm mb-6">Select a course to start studying</p>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses?.map((course) =>
              course.locked ? (
                <Card key={course.id} className="opacity-50 border-dashed">
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="text-3xl flex-shrink-0 grayscale">{course.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{course.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1"><Lock className="w-3 h-3" />Coming Soon</Badge>
                  </CardContent>
                </Card>
              ) : (
                <Link key={course.id} href={`/learn/${course.id}`}>
                  <Card className="hover:shadow-md cursor-pointer transition-all hover:border-primary/30">
                    <CardContent className="p-5 flex items-center gap-4">
                      <span className="text-3xl flex-shrink-0">{course.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{course.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                      </div>
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

function LearnToolSelector({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseToolsData>({
    queryKey: [`/api/courses/${courseId}/tools`],
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/learn">
            <Button variant="ghost" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data?.course.name ?? "Learn Mode"}</h1>
            <p className="text-muted-foreground text-sm">Select a tool to study</p>
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.tools.map(({ tool, totalPercent }) => (
              tool.status === "locked" ? (
                <Card key={tool.id} className="opacity-50 cursor-not-allowed">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{tool.name}</h3>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Link key={tool.id} href={`/learn/${courseId}/${tool.id}`}>
                  <Card className="hover:shadow-md cursor-pointer transition-all hover:border-primary/30">
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0">{tool.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{tool.name}</h3>
                        <p className="text-xs text-muted-foreground mb-1.5">{tool.description}</p>
                        <Progress value={totalPercent} className="h-1" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground ml-2">{Math.round(totalPercent)}%</span>
                    </CardContent>
                  </Card>
                </Link>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LearnSession({ courseId, toolId }: { courseId: string; toolId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  const [quickCheckResult, setQuickCheckResult] = useState(false);

  const { data, isLoading } = useQuery<LearnData>({
    queryKey: ["/api/learn", toolId],
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery<TaskWithStatus[]>({
    queryKey: [`/api/tools/${toolId}/tasks`],
  });

  const markContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      await apiRequest("POST", `/api/learn/${toolId}/complete`, { contentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn", toolId] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest("POST", `/api/tools/${toolId}/tasks/${taskId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tools/${toolId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });

  const currentContent = data?.content[currentIndex];

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto px-6 md:px-8 py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card><CardContent className="p-8"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 overflow-auto px-6 md:px-8 py-6">
        <p className="text-muted-foreground">Tool not found.</p>
        <Link href={`/learn/${courseId}`}>
          <Button variant="outline" className="mt-4"><ChevronLeft className="w-4 h-4" />Back</Button>
        </Link>
      </div>
    );
  }

  const { tool, content } = data;
  const completedCount = content.filter((c) => c.completed).length;
  const progressPercent = content.length > 0 ? (completedCount / content.length) * 100 : 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href={`/learn/${courseId}`}>
            <Button variant="ghost" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{tool.icon}</span>
              <h1 className="text-xl font-bold truncate">{tool.name}</h1>
              <Badge variant="outline" className="flex items-center gap-1 text-amber-500">
                <Zap className="w-3 h-3" />{tool.xpReward} XP
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Progress value={progressPercent} className="h-1.5 flex-1 max-w-xs" />
              <span className="text-xs text-muted-foreground">{completedCount}/{content.length} content</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content panel */}
          <div className="lg:col-span-2 space-y-4">
            {content.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No content available for this tool yet.</p>
                </CardContent>
              </Card>
            ) : currentContent ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">Content {currentIndex + 1} of {content.length}</Badge>
                  {currentContent.completed && (
                    <Badge variant="default"><Check className="w-3 h-3 mr-1" />Completed</Badge>
                  )}
                </div>

                <Card>
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-lg">{currentContent.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <ContentWithFormula content={currentContent.content} formula={currentContent.formula} />
                    {currentContent.quickCheck && (
                      <div className="mt-5">
                        {!showQuickCheck ? (
                          <Button variant="outline" size="sm" onClick={() => setShowQuickCheck(true)}>
                            <Lightbulb className="w-3 h-3" />Quick Check
                          </Button>
                        ) : (
                          <Card className="bg-muted/50 border-muted">
                            <CardContent className="p-4 space-y-3">
                              <p className="text-sm font-medium">{currentContent.quickCheck}</p>
                              {!quickCheckResult ? (
                                <Button size="sm" variant="outline" onClick={() => setQuickCheckResult(true)}>See Answer</Button>
                              ) : (
                                <div className="text-sm font-medium text-green-500">{currentContent.quickCheckAnswer}</div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between gap-2">
                  <Button variant="outline" onClick={() => { setCurrentIndex(i => i - 1); setShowQuickCheck(false); setQuickCheckResult(false); }} disabled={currentIndex === 0}>
                    <ArrowLeft className="w-4 h-4" />Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {!currentContent.completed && (
                      <Button variant="secondary" onClick={() => markContentMutation.mutate(currentContent.id)} disabled={markContentMutation.isPending}>
                        <Check className="w-4 h-4" />Mark Read
                      </Button>
                    )}
                    <Button onClick={() => { setCurrentIndex(i => i + 1); setShowQuickCheck(false); setQuickCheckResult(false); }} disabled={currentIndex === content.length - 1}>
                      Next<ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Tasks panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Tasks</CardTitle>
                <p className="text-xs text-muted-foreground">Complete tasks to earn XP</p>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {tasksLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : !tasksData || tasksData.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tasks yet.</p>
                ) : (
                  <div className="space-y-2">
                    {tasksData.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => !task.completed && completeTaskMutation.mutate(task.id)}
                        disabled={task.completed || completeTaskMutation.isPending}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors text-xs ${task.completed ? "bg-primary/5 border-primary/20 opacity-70" : "hover:bg-muted/50 hover:border-primary/30 cursor-pointer"}`}
                      >
                        {task.completed
                          ? <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                        <span className={`flex-1 leading-snug ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.label}</span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-semibold flex-shrink-0">
                          <Zap className="w-3 h-3" />{task.xp}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Jump to practice */}
            <Link href={`/practice/${courseId}/${toolId}`}>
              <Button variant="outline" className="w-full">Practice Questions</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentWithFormula({ content, formula }: { content: string; formula: string | null }) {
  if (!formula || !formula.trim()) return <RichContent content={content} className="text-sm" />;

  const blueBox = "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 my-3";
  const normContent = content.replace(/\r\n/g, "\n");
  const normFormula = formula.trim().replace(/\r\n/g, "\n");
  const exactIdx = normContent.indexOf(normFormula);

  if (exactIdx !== -1) {
    return (
      <div>
        {normContent.slice(0, exactIdx).trim() && <RichContent content={normContent.slice(0, exactIdx)} className="text-sm" />}
        <div className={blueBox}><RichContent content={normFormula} className="text-sm" /></div>
        {normContent.slice(exactIdx + normFormula.length).trim() && <RichContent content={normContent.slice(exactIdx + normFormula.length)} className="text-sm" />}
      </div>
    );
  }

  return (
    <div>
      <div className={blueBox}><RichContent content={normFormula} className="text-sm" /></div>
      <RichContent content={normContent} className="text-sm" />
    </div>
  );
}
