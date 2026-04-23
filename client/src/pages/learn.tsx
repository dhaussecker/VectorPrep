import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { X, ChevronLeft, Lock, ChevronRight, Zap, Lightbulb, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
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
      <div className="px-5 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Learn Mode</h1>
        <p className="text-muted-foreground text-sm mb-6">Select a course to start studying</p>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
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
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
      <div className="px-5 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/classes">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data?.course.name ?? "Learn Mode"}</h1>
            <p className="text-muted-foreground text-sm">Select a topic to study</p>
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.tools.map(({ tool, totalPercent }) =>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LearnSession({ courseId, toolId }: { courseId: string; toolId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [marked, setMarked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data, isLoading } = useQuery<LearnData>({
    queryKey: ["/api/learn", toolId],
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

  const currentContent = data?.content[currentIndex];
  const total = data?.content.length ?? 0;

  useEffect(() => {
    setShowHint(false);
    setMarked(false);
  }, [currentIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, currentContent?.tutorVideoUrl]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || total === 0) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <p className="text-muted-foreground mb-4">No content available for this topic yet.</p>
        <Link href={`/classes/${courseId}`}>
          <button className="px-5 py-2 rounded-full bg-muted text-sm font-medium">← Back</button>
        </Link>
      </div>
    );
  }

  const { tool, content } = data;
  const completedCount = content.filter((c) => c.completed).length;
  const progressPercent = (completedCount / total) * 100;
  const isCurrentDone = currentContent?.completed || marked;

  const goNext = () => { if (currentIndex < total - 1) setCurrentIndex(i => i + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(i => i - 1); };

  const handleCheck = () => {
    if (!currentContent) return;
    if (!isCurrentDone) {
      setMarked(true);
      markContentMutation.mutate(currentContent.id);
    }
    if (currentIndex < total - 1) setTimeout(goNext, 350);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50 overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0 border-b border-border">
        <Link href={`/classes/${courseId}`}>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </Link>

        {/* Step dots */}
        <div className="flex-1 flex items-center gap-1.5 justify-center overflow-hidden">
          {content.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCurrentIndex(i)}
              className={`transition-all rounded-full flex-shrink-0 ${
                i === currentIndex
                  ? "w-6 h-2.5 bg-primary"
                  : c.completed
                  ? "w-2.5 h-2.5 bg-[#FFD400] border border-border"
                  : "w-2.5 h-2.5 bg-border"
              }`}
            />
          ))}
        </div>

        <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">
          {currentIndex + 1}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted flex-shrink-0 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Tool name */}
      <div className="flex items-center justify-center gap-2 pt-3 pb-1 flex-shrink-0">
        <span className="text-sm">{tool.icon}</span>
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{tool.name}</span>
        <span className="flex items-center gap-0.5 text-xs font-mono font-bold text-[#FFD400]">
          <Zap className="w-3 h-3" />{tool.xpReward}
        </span>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center relative px-4 min-h-0">

        {/* Left nav */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors disabled:opacity-20 z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right nav */}
        <button
          onClick={goNext}
          disabled={currentIndex === total - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors disabled:opacity-20 z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-full max-w-sm flex flex-col items-center gap-5">
          {/* Title */}
          {currentContent && (
            <h2 className="text-lg font-bold text-center text-foreground leading-tight">
              {currentContent.title}
            </h2>
          )}

          {/* Formula — highlighted box */}
          {currentContent?.formula && (
            <div className="w-full bg-primary/8 border-2 border-primary/30 rounded-2xl px-6 py-5 text-center shadow-[0_3px_0_0_hsl(var(--primary)/0.15)]">
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Key Formula</p>
              <RichContent content={currentContent.formula} className="text-lg leading-relaxed" />
            </div>
          )}

          {/* Circular tutor video bubble */}
          {currentContent?.tutorVideoUrl && (
            <div className="relative flex-shrink-0">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.25)]">
                <video
                  ref={videoRef}
                  src={currentContent.tutorVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            </div>
          )}

          {/* Content text */}
          {currentContent && (
            <div className="w-full text-muted-foreground text-sm leading-relaxed text-center max-h-36 overflow-auto">
              <RichContent content={currentContent.content} className="text-sm" />
            </div>
          )}

          {/* Hint reveal */}
          {showHint && currentContent?.quickCheck && (
            <div className="w-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 rounded-2xl px-5 py-4 text-center">
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#22D3EE] mb-2">Quick Check</p>
              <p className="text-sm text-foreground">{currentContent.quickCheck}</p>
              {currentContent.quickCheckAnswer && (
                <p className="text-sm font-bold text-primary mt-2">{currentContent.quickCheckAnswer}</p>
              )}
            </div>
          )}

          {/* Done badge */}
          {isCurrentDone && (
            <div className="flex items-center gap-1.5 text-primary text-xs font-mono font-bold">
              <Check className="w-3.5 h-3.5" /> Got it
            </div>
          )}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-4 flex-shrink-0 border-t border-border">
        {currentContent?.quickCheck && (
          <button
            onClick={() => setShowHint(h => !h)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-destructive/10 border border-destructive/30 text-destructive font-bold text-sm transition-all hover:bg-destructive/15"
          >
            <Lightbulb className="w-4 h-4" />
            {showHint ? "Hide Hint" : "Hint"}
          </button>
        )}

        <button
          onClick={handleCheck}
          disabled={markContentMutation.isPending}
          className={`w-full max-w-xs py-4 rounded-2xl font-bold text-base transition-all border-2 shadow-[0_4px_0_0_hsl(var(--primary)/0.3)] active:shadow-none active:translate-y-1 ${
            isCurrentDone
              ? "bg-[#FFD400]/20 text-[#B8A000] border-[#FFD400]/30 dark:text-[#FFD400]"
              : "bg-[#FFD400] text-[#0F0F0F] border-[#FFD400] hover:bg-[#F5C200]"
          }`}
        >
          {isCurrentDone
            ? currentIndex < total - 1 ? "Next →" : "Complete ✓"
            : "Check Answer"}
        </button>
      </div>
    </div>
  );
}
