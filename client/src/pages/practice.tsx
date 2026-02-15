import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ChevronLeft, RefreshCw, ArrowRight, Check, X, ClipboardCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RichContent } from "@/components/rich-content";
import type { Topic, Course } from "@shared/schema";

type GeneratedQuestion = {
  attemptId: string;
  templateId: string;
  questionText: string;
};

type CourseTopicsData = {
  course: Course;
  topics: { topic: Topic; learnPercent: number; practicePercent: number }[];
};

export default function PracticePage() {
  const params = useParams<{ courseId: string; topicId: string }>();
  const { courseId, topicId } = params;

  if (courseId && topicId) {
    return <PracticeSession courseId={courseId} topicId={topicId} />;
  }

  if (courseId) {
    return <PracticeTopicSelector courseId={courseId} />;
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
            {courses?.map((course) => (
              <Link key={course.id} href={`/practice/${course.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-practice-course-${course.id}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="text-3xl flex-shrink-0">{course.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{course.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PracticeTopicSelector({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseTopicsData>({
    queryKey: ["/api/courses", courseId, "topics"],
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
            <p className="text-muted-foreground text-sm">Select a topic to practice</p>
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
            {data?.topics.map((tp) => (
              <Link key={tp.topic.id} href={`/practice/${courseId}/${tp.topic.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-practice-topic-${tp.topic.id}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="text-3xl flex-shrink-0">{tp.topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{tp.topic.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{tp.topic.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={tp.practicePercent} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium">{Math.round(tp.practicePercent)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PracticeSession({ courseId, topicId }: { courseId: string; topicId: string }) {
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [gradeResult, setGradeResult] = useState<{ correct: boolean; correctAnswer: string; solutionSteps: string } | null>(null);

  const { data: topicData } = useQuery<{ topic: Topic; practicePercent: number }>({
    queryKey: ["/api/practice", topicId, "info"],
  });

  const generateMutation = useMutation({
    mutationFn: async (templateId?: string) => {
      const res = await apiRequest("POST", `/api/practice/${topicId}/generate`, { templateId });
      return res.json() as Promise<GeneratedQuestion>;
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ attemptId, answer }: { attemptId: string; answer: string }) => {
      const res = await apiRequest("POST", `/api/practice/${topicId}/grade`, {
        attemptId,
        answer,
      });
      return res.json() as Promise<{ correct: boolean; correctAnswer: string; solutionSteps: string }>;
    },
    onSuccess: (result) => {
      setGradeResult(result);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/practice", topicId, "info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "topics"] });
    },
  });

  const handleGenerate = (templateId?: string) => {
    setUserAnswer("");
    setSubmitted(false);
    setGradeResult(null);
    generateMutation.mutate(templateId);
  };

  const handleSubmit = () => {
    if (!generateMutation.data || !userAnswer.trim()) return;
    gradeMutation.mutate({
      attemptId: generateMutation.data.attemptId,
      answer: userAnswer.trim(),
    });
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
              <span className="text-xl">{topicData?.topic.icon}</span>
              <h1 className="text-xl font-bold truncate" data-testid="text-practice-topic-name">
                {topicData?.topic.name ?? "Practice"}
              </h1>
            </div>
            {topicData && (
              <div className="flex items-center gap-3 mt-1">
                <Progress value={topicData.practicePercent} className="h-1.5 flex-1 max-w-xs" />
                <span className="text-xs text-muted-foreground">{Math.round(topicData.practicePercent)}% mastered</span>
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
                    Generate a question to test your understanding of {topicData?.topic.name ?? "this topic"}.
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

              <Card>
                <CardContent className="p-5 space-y-3">
                  <label className="text-sm font-medium">Your Answer</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Enter your answer..."
                      disabled={submitted}
                      onKeyDown={(e) => e.key === "Enter" && !submitted && handleSubmit()}
                      data-testid="input-answer"
                    />
                    {!submitted && (
                      <Button
                        onClick={handleSubmit}
                        disabled={!userAnswer.trim() || gradeMutation.isPending}
                        data-testid="button-submit-answer"
                      >
                        {gradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {gradeResult && (
                <Card className={gradeResult.correct ? "border-green-500/30" : "border-destructive/30"} data-testid="card-result">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      {gradeResult.correct ? (
                        <>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
                            <Check className="w-4 h-4 text-green-500" />
                          </div>
                          <span className="font-semibold text-green-500" data-testid="text-result-status">Correct!</span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10">
                            <X className="w-4 h-4 text-destructive" />
                          </div>
                          <span className="font-semibold text-destructive" data-testid="text-result-status">Incorrect</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Correct answer: </span>
                        <span className="font-medium" data-testid="text-correct-answer">{gradeResult.correctAnswer}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Solution Steps:</p>
                      <div className="bg-muted/50 rounded-md p-3" data-testid="text-solution-steps">
                        <RichContent content={gradeResult.solutionSteps} className="text-sm text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      <Button onClick={() => handleGenerate()} data-testid="button-try-another">
                        <ArrowRight className="w-4 h-4" />
                        Try Another
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleGenerate(question.templateId)}
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
