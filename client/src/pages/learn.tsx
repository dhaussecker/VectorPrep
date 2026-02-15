import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Lightbulb, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RichContent } from "@/components/rich-content";
import type { Topic, LearnCard, Course } from "@shared/schema";

type LearnData = {
  topic: Topic;
  cards: (LearnCard & { completed: boolean })[];
};

type CourseTopicsData = {
  course: Course;
  topics: { topic: Topic; learnPercent: number; practicePercent: number }[];
};

export default function LearnPage() {
  const params = useParams<{ courseId: string; topicId: string }>();
  const { courseId, topicId } = params;

  if (courseId && topicId) {
    return <LearnSession courseId={courseId} topicId={topicId} />;
  }

  if (courseId) {
    return <LearnTopicSelector courseId={courseId} />;
  }

  return <LearnCourseSelector />;
}

function LearnCourseSelector() {
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1" data-testid="text-learn-title">Learn Mode</h1>
        <p className="text-muted-foreground text-sm mb-6">Select a course to start studying</p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses?.map((course) => (
              <Link key={course.id} href={`/learn/${course.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-learn-course-${course.id}`}>
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

function LearnTopicSelector({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseTopicsData>({
    queryKey: ["/api/courses", courseId, "topics"],
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/learn">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-learn-title">
              {data?.course.name ?? "Learn Mode"}
            </h1>
            <p className="text-muted-foreground text-sm">Select a topic to start studying</p>
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
              <Link key={tp.topic.id} href={`/learn/${courseId}/${tp.topic.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-learn-topic-${tp.topic.id}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="text-3xl flex-shrink-0">{tp.topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{tp.topic.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{tp.topic.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={tp.learnPercent} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium">{Math.round(tp.learnPercent)}%</span>
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

function LearnSession({ courseId, topicId }: { courseId: string; topicId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  const [quickCheckAnswer, setQuickCheckAnswer] = useState("");
  const [quickCheckResult, setQuickCheckResult] = useState<"correct" | "incorrect" | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<LearnData>({
    queryKey: ["/api/learn", topicId],
  });

  const addToCheatSheetMutation = useMutation({
    mutationFn: async ({ formula, label }: { formula: string; label: string }) => {
      await apiRequest("POST", "/api/cheatsheet", { topicId, formula, label });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cheatsheet"] });
      toast({ title: "Added to cheat sheet" });
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await apiRequest("POST", `/api/learn/${topicId}/complete`, { cardId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn", topicId] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "topics"] });
    },
  });

  const currentCard = data?.cards[currentIndex];

  const handleAddFormula = useCallback((formula: string) => {
    if (currentCard) {
      addToCheatSheetMutation.mutate({ formula: `$$${formula}$$`, label: currentCard.title });
    }
  }, [currentCard, addToCheatSheetMutation]);

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
        <p className="text-muted-foreground">Topic not found.</p>
        <Link href={`/learn/${courseId}`}>
          <Button variant="outline" className="mt-4"><ChevronLeft className="w-4 h-4" />Back to topics</Button>
        </Link>
      </div>
    );
  }

  const { topic, cards } = data;
  const completedCount = cards.filter((c) => c.completed).length;
  const progressPercent = cards.length > 0 ? (completedCount / cards.length) * 100 : 0;

  const handleMarkComplete = () => {
    if (currentCard && !currentCard.completed) {
      markCompleteMutation.mutate(currentCard.id);
    }
  };

  const handleQuickCheckSubmit = () => {
    if (!currentCard?.quickCheckAnswer) return;
    const isCorrect = quickCheckAnswer.trim().toLowerCase() === currentCard.quickCheckAnswer.trim().toLowerCase();
    setQuickCheckResult(isCorrect ? "correct" : "incorrect");
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowQuickCheck(false);
      setQuickCheckAnswer("");
      setQuickCheckResult(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowQuickCheck(false);
      setQuickCheckAnswer("");
      setQuickCheckResult(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href={`/learn/${courseId}`}>
            <Button variant="ghost" size="icon" data-testid="button-back-learn">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{topic.icon}</span>
              <h1 className="text-xl font-bold truncate" data-testid="text-topic-name">{topic.name}</h1>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Progress value={progressPercent} className="h-1.5 flex-1 max-w-xs" />
              <span className="text-xs text-muted-foreground">
                {completedCount}/{cards.length} cards
              </span>
            </div>
          </div>
        </div>

        {cards.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No learn cards available for this topic yet.</p>
            </CardContent>
          </Card>
        ) : currentCard ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline">
                Card {currentIndex + 1} of {cards.length}
              </Badge>
              {currentCard.completed && (
                <Badge variant="default">
                  <Check className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>

            <Card data-testid={`card-learn-${currentCard.id}`}>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-lg">{currentCard.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <RichContent content={currentCard.content} className="text-sm" onAddFormula={handleAddFormula} />

                {currentCard.quickCheck && (
                  <div className="mt-5">
                    {!showQuickCheck ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQuickCheck(true)}
                        data-testid="button-quick-check"
                      >
                        <Lightbulb className="w-3 h-3" />
                        Quick Check
                      </Button>
                    ) : (
                      <Card className="bg-muted/50 border-muted">
                        <CardContent className="p-4 space-y-3">
                          <p className="text-sm font-medium">{currentCard.quickCheck}</p>
                          <div className="flex items-center gap-2">
                            <Input
                              value={quickCheckAnswer}
                              onChange={(e) => setQuickCheckAnswer(e.target.value)}
                              placeholder="Your answer..."
                              className="flex-1"
                              onKeyDown={(e) => e.key === "Enter" && handleQuickCheckSubmit()}
                              data-testid="input-quick-check"
                            />
                            <Button size="sm" onClick={handleQuickCheckSubmit} data-testid="button-submit-quick-check">
                              Check
                            </Button>
                          </div>
                          {quickCheckResult && (
                            <div className={`text-sm font-medium ${quickCheckResult === "correct" ? "text-green-500" : "text-destructive"}`} data-testid="text-quick-check-result">
                              {quickCheckResult === "correct"
                                ? "Correct!"
                                : `Incorrect. The answer is: ${currentCard.quickCheckAnswer}`}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                data-testid="button-prev-card"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {!currentCard.completed && (
                  <Button
                    variant="secondary"
                    onClick={handleMarkComplete}
                    disabled={markCompleteMutation.isPending}
                    data-testid="button-mark-complete"
                  >
                    <Check className="w-4 h-4" />
                    Mark Complete
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={currentIndex === cards.length - 1}
                  data-testid="button-next-card"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
