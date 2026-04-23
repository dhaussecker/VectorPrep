import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { X, ChevronLeft, ChevronRight, Zap, Lightbulb, Play, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RichContent } from "@/components/rich-content";
import type { Tool, ToolContentItem, Course } from "@shared/schema";

type LearnData = {
  tool: Tool;
  content: (ToolContentItem & { completed: boolean; tutorVideoUrl?: string | null; captions?: Caption[] | null })[];
};

type CourseToolsData = {
  course: Course;
  tools: { tool: Tool; contentPercent: number; taskPercent: number; totalPercent: number }[];
};

// ─── Web Audio success chime ──────────────────────────────────────────────────

function playSuccessChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes: [number, number][] = [
      [523.25, 0],
      [659.25, 0.13],
      [783.99, 0.26],
      [1046.5, 0.38],
    ];
    notes.forEach(([freq, t]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.38);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.4);
    });
  } catch (_) {}
}

// ─── Success overlay with particles ──────────────────────────────────────────

function SuccessOverlay({
  xp,
  isLast,
  onDone,
}: {
  xp: number;
  isLast: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, isLast ? 2600 : 1900);
    return () => clearTimeout(t);
  }, []);

  const particles = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = 80 + Math.random() * 130;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: ["#FFD400", "#4ade80", "#22D3EE", "#f97316", "#a855f7", "#ec4899"][i % 6],
      size: 5 + Math.random() * 9,
      delay: i * 0.018,
    };
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/75 backdrop-blur-sm">
      <style>{`
        @keyframes pfout{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--pdx),var(--pdy)) scale(0);opacity:0}}
        @keyframes spop{0%{transform:scale(0.2) rotate(-8deg);opacity:0}65%{transform:scale(1.12) rotate(1deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes xprise{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-52px) scale(0.7);opacity:0}}
        .succ-pop{animation:spop 0.45s cubic-bezier(.2,.9,.2,1) both}
        .succ-xp{animation:xprise 1.5s ease-out 0.45s both}
      `}</style>

      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: "50%",
            top: "50%",
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            animation: `pfout 1s ease-out ${p.delay}s both`,
            "--pdx": `${p.dx}px`,
            "--pdy": `${p.dy}px`,
          } as any}
        />
      ))}

      <div className="succ-pop bg-card border-2 border-foreground rounded-3xl px-10 py-8 text-center shadow-hard relative z-10 pointer-events-none min-w-[220px]">
        <div className="text-5xl mb-3">{isLast ? "🏆" : "⭐"}</div>
        <h2 className="text-2xl font-black text-primary mb-0.5">
          {isLast ? "Quest Complete!" : "Stage Clear!"}
        </h2>
        <div className="succ-xp text-xl font-black font-mono text-[#FFD400]">+{xp} XP</div>
        <p className="text-xs text-muted-foreground font-mono mt-3">
          {isLast ? "You've mastered this quest! 🎉" : "Keep going →"}
        </p>
      </div>
    </div>
  );
}

type Caption = { t: number; text: string };

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const WORD_COLORS = ["#FFD400", "#22D3EE", "#4ade80", "#f97316", "#a855f7", "#ec4899"];

// ─── Circular tutor bubble + karaoke captions ─────────────────────────────────

function TutorBubble({
  videoUrl,
  captions,
  videoRef,
}: {
  videoUrl?: string | null;
  captions?: Caption[] | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const [videoTime, setVideoTime] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [timerWordIdx, setTimerWordIdx] = useState(0);

  const sortedCaptions = captions && captions.length > 0
    ? [...captions].sort((a, b) => a.t - b.t)
    : null;

  // Active caption text — only from captions data, never from title
  const activeCaptionIdx = sortedCaptions
    ? sortedCaptions.findLastIndex(c => c.t <= videoTime)
    : -1;
  const activeCaptionText = sortedCaptions && activeCaptionIdx >= 0
    ? sortedCaptions[activeCaptionIdx].text
    : sortedCaptions?.[0]?.text ?? null;

  const nextCaptionT = sortedCaptions && activeCaptionIdx >= 0
    ? sortedCaptions[activeCaptionIdx + 1]?.t
    : undefined;

  const words = activeCaptionText ? activeCaptionText.split(/\s+/).filter(Boolean) : [];

  const wordIntervalMs = nextCaptionT !== undefined && sortedCaptions && activeCaptionIdx >= 0
    ? Math.max(200, ((nextCaptionT - sortedCaptions[activeCaptionIdx].t) * 1000) / Math.max(words.length, 1))
    : 500;

  useEffect(() => {
    if (!activeCaptionText) return;
    setTimerWordIdx(0);
    const iv = setInterval(() => setTimerWordIdx(i => (i + 1) % Math.max(words.length, 1)), wordIntervalMs);
    return () => clearInterval(iv);
  }, [activeCaptionText, wordIntervalMs]);

  const activeWordIdx = videoPlaying && sortedCaptions && activeCaptionIdx >= 0
    ? Math.min(
        Math.floor((videoTime - sortedCaptions[activeCaptionIdx].t) / (wordIntervalMs / 1000)),
        words.length - 1
      )
    : timerWordIdx;

  const togglePlay = () => {
    if (!videoRef.current) return;
    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
  };

  const ytId = videoUrl ? getYouTubeId(videoUrl) : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{`
        @keyframes tutor-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .tutor-bob { animation: tutor-bob 1.8s ease-in-out infinite; }
        @keyframes word-pop { 0%{transform:scale(0.75) rotate(-4deg);opacity:0.3} 60%{transform:scale(1.2) rotate(1deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        .word-active { animation: word-pop 0.22s cubic-bezier(.2,.9,.2,1) both; }
        @keyframes ring-pulse { 0%,100%{box-shadow:0 0 0 0 #FFD40066} 50%{box-shadow:0 0 0 8px #FFD40000} }
        .ring-pulse { animation: ring-pulse 1.6s ease-in-out infinite; }
      `}</style>

      {/* Circle avatar */}
      {ytId ? (
        <div className="w-full rounded-3xl overflow-hidden border-2 border-foreground shadow-hard bg-black" style={{ paddingBottom: "56.25%", position: "relative" }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : videoUrl ? (
        <div
          className={`relative cursor-pointer flex-shrink-0 ${videoPlaying ? "ring-pulse" : ""}`}
          style={{ width: 148, height: 148 }}
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            className="w-full h-full object-cover rounded-full border-4 border-[#FFD400] shadow-hard"
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
            onTimeUpdate={(e) => setVideoTime(e.currentTarget.currentTime)}
          />
          {!videoPlaying && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
              <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center shadow-hard">
                <Play className="w-6 h-6 text-foreground ml-0.5" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex items-center justify-center rounded-full border-4 border-[#FFD400] bg-primary/10 flex-shrink-0"
          style={{ width: 148, height: 148 }}
        >
          <div className="tutor-bob"><span className="text-6xl">🧑‍🏫</span></div>
        </div>
      )}

      {/* Karaoke words — ONLY shown when captions exist */}
      {words.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center px-2">
          {words.map((word, i) => {
            const isActive = i === activeWordIdx;
            const color = WORD_COLORS[i % WORD_COLORS.length];
            return (
              <span
                key={`${activeCaptionText}-${i}`}
                className={`font-black text-2xl leading-tight select-none inline-block transition-none ${isActive ? "word-active" : ""}`}
                style={{
                  color: isActive ? color : "hsl(var(--foreground)/0.2)",
                  textShadow: isActive ? `0 0 28px ${color}99` : "none",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Route entry point ────────────────────────────────────────────────────────

export default function LearnPage() {
  const params = useParams<{ courseId: string; toolId: string }>();
  const { courseId, toolId } = params as any;

  if (courseId && toolId) return <LearnSession courseId={courseId} toolId={toolId} />;
  if (courseId) return <LearnToolSelector courseId={courseId} />;
  return <LearnCourseSelector />;
}

// ─── Course selector ──────────────────────────────────────────────────────────

function LearnCourseSelector() {
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  return (
    <div className="flex-1 overflow-auto px-5 py-6">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">Select a Quest</p>
      <h1 className="text-2xl font-black tracking-tight mb-6">Quest Map</h1>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {courses?.map((course) =>
            course.locked ? (
              <div
                key={course.id}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-card opacity-50 cursor-not-allowed"
              >
                <span className="text-3xl grayscale">{course.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{course.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                </div>
                <Badge variant="secondary" className="gap-1"><Lock className="w-3 h-3" />Soon</Badge>
              </div>
            ) : (
              <Link key={course.id} href={`/learn/${course.id}`}>
                <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-foreground bg-card shadow-hard cursor-pointer active:shadow-none active:translate-y-0.5 transition-all">
                  <span className="text-3xl">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{course.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tool selector ────────────────────────────────────────────────────────────

function LearnToolSelector({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseToolsData>({
    queryKey: [`/api/courses/${courseId}/tools`],
  });

  return (
    <div className="flex-1 overflow-auto px-5 py-6">
      <Link href="/classes">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Quest Map
        </button>
      </Link>
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">Choose Stage</p>
      <h1 className="text-2xl font-black tracking-tight mb-6">{data?.course.name ?? "Quest"}</h1>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.tools.map(({ tool, totalPercent }) =>
            tool.status === "locked" ? (
              <div key={tool.id} className="flex items-center gap-3 p-4 rounded-2xl border-2 border-border bg-card opacity-50 cursor-not-allowed">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </div>
            ) : (
              <Link key={tool.id} href={`/learn/${courseId}/${tool.id}`}>
                <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-foreground bg-card shadow-hard cursor-pointer active:shadow-none active:translate-y-0.5 transition-all">
                  <span className="text-2xl">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-sm truncate">{tool.name}</h3>
                      <span className="text-xs font-mono text-muted-foreground">{Math.round(totalPercent)}%</span>
                    </div>
                    <Progress value={totalPercent} className="h-1.5" />
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main quest session ───────────────────────────────────────────────────────

function LearnSession({ courseId, toolId }: { courseId: string; toolId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [marked, setMarked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
    setShowSuccess(false);
  }, [currentIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
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
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 gap-4 px-6 text-center">
        <div className="text-4xl">🗺️</div>
        <p className="text-muted-foreground">No stages in this quest yet.</p>
        <Link href={`/classes/${courseId}`}>
          <button className="px-5 py-2.5 rounded-full border-2 border-foreground bg-card shadow-hard font-bold text-sm">
            ← Back to Quest Map
          </button>
        </Link>
      </div>
    );
  }

  const { tool, content } = data;
  const completedCount = content.filter((c) => c.completed).length;
  const progressPercent = (completedCount / total) * 100;
  const isCurrentDone = currentContent?.completed || marked;
  const isLast = currentIndex === total - 1;
  const stepXp = Math.max(5, Math.round((tool.xpReward ?? 100) / total));

  const goNext = () => { if (currentIndex < total - 1) setCurrentIndex((i) => i + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex((i) => i - 1); };

  const handleCheck = () => {
    if (!currentContent) return;
    if (!isCurrentDone) {
      setMarked(true);
      setShowSuccess(true);
      playSuccessChime();
      markContentMutation.mutate(currentContent.id);
    } else {
      goNext();
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    if (!isLast) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 150);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50 overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0">
        <Link href={`/classes/${courseId}`}>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </Link>

        {/* Step dots */}
        <div className="flex-1 flex items-center gap-1.5 overflow-hidden justify-center">
          {content.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full flex-shrink-0 transition-all duration-300 ${
                i === currentIndex
                  ? "w-7 h-3 bg-primary"
                  : c.completed
                  ? "w-3 h-3 bg-[#FFD400]"
                  : "w-3 h-3 bg-border"
              }`}
            />
          ))}
        </div>

        {/* XP badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 bg-[#FFD400]/15 border border-[#FFD400]/30 rounded-full flex-shrink-0">
          <Zap className="w-3 h-3 text-[#FFD400]" />
          <span className="text-[11px] font-black font-mono text-[#FFD400]">{tool.xpReward}</span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1.5 bg-muted mx-4 rounded-full overflow-hidden flex-shrink-0">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── Quest label ── */}
      <div className="flex items-center justify-center gap-2 pt-2 pb-0 flex-shrink-0">
        <span className="text-base">{tool.icon}</span>
        <span className="text-sm font-bold font-mono text-foreground">{tool.name}</span>
        <span className="text-xs font-mono text-muted-foreground">{currentIndex + 1}/{total}</span>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-auto py-4 relative">

        {/* Side nav buttons */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="fixed left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-card border-2 border-foreground shadow-hard transition-all disabled:opacity-20 z-10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goNext}
          disabled={currentIndex === total - 1}
          className="fixed right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-card border-2 border-foreground shadow-hard transition-all disabled:opacity-20 z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="max-w-sm mx-auto px-5 flex flex-col gap-5 pb-2">

          {/* Stage title — BIG */}
          {currentContent && (
            <h2 className="text-2xl font-black text-center text-foreground leading-tight tracking-tight">
              {currentContent.title}
            </h2>
          )}

          {/* Formula — LARGE display */}
          {currentContent?.formula && (
            <div className="rounded-3xl bg-primary/8 border-2 border-primary/25 px-6 py-6 text-center">
              <div className="[&_.katex]:text-[1.8rem] [&_.katex-display]:my-1 [&_p]:text-xl [&_p]:font-mono [&_p]:m-0">
                <RichContent content={currentContent.formula} />
              </div>
            </div>
          )}

          {/* Tutor bubble — circular video or avatar + karaoke */}
          {currentContent && (
            <TutorBubble
              videoUrl={currentContent.tutorVideoUrl}
              captions={currentContent.captions as Caption[] | null}
              videoRef={videoRef}
            />
          )}

          {/* Explanation */}
          {currentContent && (
            <div className="[&_p]:text-lg [&_p]:leading-relaxed [&_p]:text-foreground [&_li]:text-lg [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_ul]:space-y-2 [&_ol]:space-y-2">
              <RichContent content={currentContent.content} />
            </div>
          )}

          {/* Hint box */}
          {showHint && currentContent?.quickCheck && (
            <div className="rounded-2xl bg-[#22D3EE]/10 border-2 border-[#22D3EE]/40 px-5 py-4">
              <p className="text-base font-bold text-foreground">{currentContent.quickCheck}</p>
              {currentContent.quickCheckAnswer && (
                <p className="text-base font-black text-primary mt-2">{currentContent.quickCheckAnswer}</p>
              )}
            </div>
          )}

          {/* Cleared indicator */}
          {isCurrentDone && !showSuccess && (
            <div className="flex items-center justify-center gap-2 text-primary text-sm font-bold font-mono">
              <span>✓</span> Stage cleared
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom action buttons ── */}
      <div className="px-5 pb-8 pt-3 flex-shrink-0 border-t border-border bg-background space-y-3">
        {currentContent?.quickCheck && !isCurrentDone && (
          <button
            onClick={() => setShowHint((h) => !h)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-destructive/40 bg-destructive/8 text-destructive font-bold text-sm transition-all hover:bg-destructive/15 active:scale-[0.98]"
          >
            <Lightbulb className="w-4 h-4" />
            {showHint ? "Hide Hint" : "Hint"}
          </button>
        )}

        <button
          onClick={handleCheck}
          disabled={markContentMutation.isPending}
          className={`w-full py-4 rounded-2xl font-black text-base border-2 transition-all active:scale-[0.97] ${
            isCurrentDone
              ? isLast
                ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_0_0_hsl(var(--primary)/0.4)] active:shadow-none active:translate-y-1"
                : "bg-muted text-foreground border-foreground shadow-hard active:shadow-none active:translate-y-1"
              : "bg-[#FFD400] text-[#0F0F0F] border-foreground shadow-hard hover:brightness-105 active:shadow-none active:translate-y-1"
          }`}
        >
          {isCurrentDone
            ? isLast
              ? "🏆 Quest Complete!"
              : "Next Stage →"
            : "⚔️  Got It!"}
        </button>
      </div>

      {/* ── Success overlay ── */}
      {showSuccess && (
        <SuccessOverlay xp={stepXp} isLast={isLast} onDone={handleSuccessDone} />
      )}
    </div>
  );
}
