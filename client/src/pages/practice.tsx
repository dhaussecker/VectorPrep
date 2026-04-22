import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ChevronLeft, RefreshCw, ArrowRight, ClipboardCheck, Loader2, Lock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RichContent } from "@/components/rich-content";
import type { Tool, Course } from "@shared/schema";

type GeneratedQuestion = {
  attemptId: string;
  templateId: string;
  questionText: string;
};

type CourseToolsData = {
  course: Course;
  tools: { tool: Tool; contentPercent: number; taskPercent: number; totalPercent: number }[];
};

export default function PracticePage() {
  const params = useParams<{ courseId: string; toolId: string }>();
  const { courseId, toolId } = params as any;

  if (courseId && toolId) {
    return <PracticeSession courseId={courseId} toolId={toolId} />;
  }

  if (courseId) {
    return <PracticeToolSelector courseId={courseId} />;
  }

  return <PracticeCourseSelector />;
}

function PracticeCourseSelector() {
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1" data-testid="text-practice-title">Practice Mode</h1>
        <p className="text-muted-foreground text-sm mb-6">Select a course to practice</p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses?.map((course) =>
              course.locked ? (
                <Card key={course.id} className="opacity-50 border-dashed" data-testid={`card-practice-course-${course.id}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="text-3xl flex-shrink-0 grayscale">{course.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{course.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0 gap-1">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </Badge>
                  </CardContent>
                </Card>
              ) : (
                <Link key={course.id} href={`/practice/${course.id}`}>
                  <Card className="hover:shadow-md cursor-pointer transition-all hover:border-primary/30" data-testid={`card-practice-course-${course.id}`}>
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

function PracticeToolSelector({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseToolsData>({
    queryKey: [`/api/courses/${courseId}/tools`],
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/practice">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-practice-title">
              {data?.course.name ?? "Practice Mode"}
            </h1>
            <p className="text-muted-foreground text-sm">Select a tool to practice</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.tools.map(({ tool, totalPercent }) =>
              tool.status === "locked" ? (
                <Card key={tool.id} className="opacity-50 cursor-not-allowed" data-testid={`card-practice-tool-${tool.id}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{tool.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Link key={tool.id} href={`/practice/${courseId}/${tool.id}`}>
                  <Card className="hover:shadow-md cursor-pointer transition-all hover:border-primary/30" data-testid={`card-practice-tool-${tool.id}`}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <span className="text-3xl flex-shrink-0">{tool.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{tool.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={totalPercent} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium">{Math.round(totalPercent)}%</span>
                        </div>
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

function PracticeSession({ courseId, toolId }: { courseId: string; toolId: string }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [gradeResult, setGradeResult] = useState<{ correct: boolean; correctAnswer: string; solutionSteps: string } | null>(null);

  const { data: toolData } = useQuery<{ tool: Tool; practicePercent: number }>({
    queryKey: ["/api/practice", toolId, "info"],
  });

  const generateMutation = useMutation({
    mutationFn: async (templateId?: string) => {
      const res = await apiRequest("POST", `/api/practice/${toolId}/generate`, { templateId });
      return res.json() as Promise<GeneratedQuestion>;
    },
  });

  const viewAnswerMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      const res = await apiRequest("POST", `/api/practice/${toolId}/grade`, {
        attemptId,
        viewOnly: true,
      });
      return res.json() as Promise<{ correct: boolean; correctAnswer: string; solutionSteps: string }>;
    },
    onSuccess: (result) => {
      setGradeResult(result);
      setShowAnswer(true);
    },
  });

  const markMasteredMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      const res = await apiRequest("POST", `/api/practice/${toolId}/grade`, {
        attemptId,
        markMastered: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/practice", toolId, "info"] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/tools`] });
    },
  });

  const handleGenerate = (templateId?: string) => {
    setShowAnswer(false);
    setGradeResult(null);
    generateMutation.mutate(templateId);
  };

  const handleDoneNext = (templateId?: string) => {
    if (generateMutation.data && showAnswer) {
      markMasteredMutation.mutate(generateMutation.data.attemptId, {
        onSuccess: () => handleGenerate(templateId),
      });
    } else {
      handleGenerate(templateId);
    }
  };

  const handleViewAnswer = () => {
    if (!generateMutation.data) return;
    viewAnswerMutation.mutate(generateMutation.data.attemptId);
  };

  const question = generateMutation.data;

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href={`/practice/${courseId}`}>
            <Button variant="ghost" size="icon" data-testid="button-back-practice">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{toolData?.tool.icon}</span>
              <h1 className="text-xl font-bold truncate" data-testid="text-practice-tool-name">
                {toolData?.tool.name ?? "Practice"}
              </h1>
            </div>
            {toolData && (
              <div className="flex items-center gap-3 mt-1">
                <Progress value={toolData.practicePercent} className="h-1.5 flex-1 max-w-xs" />
                <span className="text-xs text-muted-foreground">{Math.round(toolData.practicePercent)}% mastered</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {!question && !generateMutation.isPending ? (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h2 className="text-lg font-semibold mb-1">Ready to Practice?</h2>
                  <p className="text-sm text-muted-foreground">
                    Generate a question to test your understanding of {toolData?.tool.name ?? "this tool"}.
                  </p>
                </div>
                <Button onClick={() => handleGenerate()} data-testid="button-generate-question">
                  Generate Question
                </Button>
              </CardContent>
            </Card>
          ) : generateMutation.isPending ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">Generating question...</p>
              </CardContent>
            </Card>
          ) : question ? (
            <div className="space-y-4">
              <Card data-testid="card-question">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Question</CardTitle>
                    <Badge variant="outline">Practice</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <RichContent content={question.questionText} className="text-sm" />
                </CardContent>
              </Card>

              {!showAnswer && !gradeResult && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleViewAnswer}
                    disabled={viewAnswerMutation.isPending}
                    data-testid="button-view-answer"
                  >
                    {viewAnswerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    {viewAnswerMutation.isPending ? "Loading..." : "View Answer"}
                  </Button>
                </div>
              )}

              {gradeResult && (
                <Card className="border-muted" data-testid="card-result">
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Answer: </span>
                        <span className="font-medium" data-testid="text-correct-answer">{gradeResult.correctAnswer}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Solution:</p>
                      <div className="bg-muted/50 rounded-md p-3" data-testid="text-solution-steps">
                        <RichContent content={gradeResult.solutionSteps} className="text-sm text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      <Button
                        onClick={() => handleDoneNext()}
                        disabled={markMasteredMutation.isPending}
                        data-testid="button-next-question"
                      >
                        {markMasteredMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        Next Question
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDoneNext(question.templateId)}
                        disabled={markMasteredMutation.isPending}
                        data-testid="button-regenerate-similar"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Regenerate Similar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
