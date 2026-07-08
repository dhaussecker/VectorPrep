import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { X, ChevronLeft, ChevronRight, Zap, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
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

// ─── Success overlay ──────────────────────────────────────────────────────────

function SuccessOverlay({ xp, isLast, onDone }: { xp: number; isLast: boolean; onDone: () => void }) {
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
      color: ["#F59E0B", "#4ade80", "#22D3EE", "#f97316", "#a855f7", "#ec4899"][i % 6],
      size: 5 + Math.random() * 9,
      delay: i * 0.018,
    };
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.82)" }}>
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
            width: p.size, height: p.size, background: p.color,
            left: "50%", top: "50%",
            marginLeft: -p.size / 2, marginTop: -p.size / 2,
            animation: `pfout 1s ease-out ${p.delay}s both`,
            "--pdx": `${p.dx}px`, "--pdy": `${p.dy}px`,
          } as any}
        />
      ))}
      <div className="succ-pop rounded-3xl px-10 py-8 text-center relative z-10 pointer-events-none min-w-[220px]" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 64px rgba(0,0,0,0.9)" }}>
        <div className="text-5xl mb-3">{isLast ? "🏆" : "⭐"}</div>
        <h2 className="text-2xl font-black text-primary mb-0.5">{isLast ? "Section Complete!" : "Stage Clear!"}</h2>
        <div className="succ-xp text-xl font-black font-mono text-primary">+{xp} XP</div>
        {isLast && <p className="text-xs text-muted-foreground font-mono mt-3">Formula added to your sheet 📋</p>}
      </div>
    </div>
  );
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
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
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {courses?.map((course) =>
            course.locked ? (
              <div key={course.id} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-card opacity-50 cursor-not-allowed">
                <span className="text-3xl grayscale">{course.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{course.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                </div>
                <Badge variant="secondary" className="gap-1"><Lock className="w-3 h-3" />Soon</Badge>
              </div>
            ) : (
              <Link key={course.id} href={`/learn/${course.id}`}>
                <div className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer active:translate-y-0.5 transition-all" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)" }}>
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
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
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
                <div className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer active:translate-y-0.5 transition-all" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)" }}>
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

// ─── Main session ─────────────────────────────────────────────────────────────

function LearnSession({ courseId, toolId }: { courseId: string; toolId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [marked, setMarked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data, isLoading } = useQuery<LearnData>({
    queryKey: ["/api/learn", toolId],
  });

  const markContentMutation = useMutation({
    mutationFn: async ({ contentId, formula, label }: { contentId: string; formula?: string | null; label?: string }) => {
      await apiRequest("POST", `/api/learn/${toolId}/complete`, { contentId });
      if (formula) {
        await apiRequest("POST", "/api/cheatsheet", { toolId, formula, label: label ?? "Formula" }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn", toolId] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cheatsheet"] });
    },
  });

  const currentContent = data?.content[currentIndex];
  const total = data?.content.length ?? 0;

  useEffect(() => {
    setMarked(false);
    setShowSuccess(false);
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#0a0a0a" }}>
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || total === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 gap-4 px-6 text-center" style={{ background: "#0a0a0a" }}>
        <div className="text-4xl">🗺️</div>
        <p style={{ color: "rgba(255,255,255,0.4)" }}>No stages in this quest yet.</p>
        <Link href={`/classes/${courseId}`}>
          <button className="px-5 py-2.5 rounded-full font-bold text-sm" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}>
            ← Back
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
      markContentMutation.mutate({
        contentId: currentContent.id,
        formula: currentContent.formula,
        label: currentContent.title,
      });
    } else {
      goNext();
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    if (!isLast) setTimeout(() => setCurrentIndex((i) => i + 1), 150);
  };

  const ytId = currentContent?.tutorVideoUrl ? getYouTubeId(currentContent.tutorVideoUrl) : null;

  return (
    <div className="fixed inset-0 flex flex-col z-50" style={{ background: "#0a0a0a", color: "white" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0">
        <Link href={`/classes/${courseId}`}>
          <button className="w-9 h-9 flex items-center justify-center rounded-full transition-colors flex-shrink-0" style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)" }}>
            <X className="w-4 h-4" />
          </button>
        </Link>

        <div className="flex-1 flex items-center gap-1.5 overflow-hidden justify-center">
          {content.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCurrentIndex(i)}
              className="rounded-full flex-shrink-0 transition-all duration-300"
              style={{
                width: i === currentIndex ? 28 : 10,
                height: 10,
                background: i === currentIndex
                  ? "#4ade80"
                  : c.completed
                  ? "#4ade80"
                  : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}>
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-black font-mono text-primary">{tool.xpReward}</span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 mx-4 rounded-full overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPercent}%`, background: "#4ade80" }} />
      </div>

      {/* ── Section label ── */}
      <div className="flex items-center justify-center gap-2 pt-3 pb-1 flex-shrink-0">
        <span className="text-base">{tool.icon}</span>
        <span className="text-xs font-bold font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{tool.name}</span>
        <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{currentIndex + 1}/{total}</span>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-xl mx-auto px-4 py-4 flex flex-col gap-5 pb-4">
          <style>{`
            @keyframes slide-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
            .anim-in{animation:slide-up .3s cubic-bezier(.2,.9,.2,1) both}
            .anim-in-2{animation:slide-up .3s cubic-bezier(.2,.9,.2,1) .07s both}
            .anim-in-3{animation:slide-up .3s cubic-bezier(.2,.9,.2,1) .14s both}
          `}</style>

          {/* Title */}
          {currentContent && (
            <h2 key={`title-${currentIndex}`} className="anim-in text-2xl font-black text-center leading-tight tracking-tight mt-1">
              {currentContent.title}
            </h2>
          )}

          {/* Video */}
          {currentContent?.tutorVideoUrl && (
            <div key={`video-${currentIndex}`} className="anim-in-2 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {ytId ? (
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    key={`yt-${currentIndex}`}
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ border: "none" }}
                  />
                </div>
              ) : (
                <video
                  key={`vid-${currentIndex}`}
                  src={currentContent.tutorVideoUrl}
                  controls
                  playsInline
                  className="w-full rounded-2xl"
                  style={{ background: "#000" }}
                />
              )}
            </div>
          )}

          {/* Formula */}
          {currentContent?.formula && (
            <div key={`formula-${currentIndex}`} className="anim-in-3 rounded-2xl px-6 py-6 text-center" style={{ background: "rgba(74,222,128,0.05)", border: "1.5px solid rgba(74,222,128,0.2)" }}>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] mb-3" style={{ color: "rgba(74,222,128,0.6)" }}>Formula</p>
              <div className="[&_.katex]:text-[1.9rem] [&_.katex-display]:my-0 [&_p]:text-xl [&_p]:font-mono [&_p]:m-0">
                <RichContent content={currentContent.formula} />
              </div>
            </div>
          )}

          {/* Cleared indicator */}
          {isCurrentDone && !showSuccess && (
            <div className="flex items-center justify-center gap-2 text-sm font-bold font-mono" style={{ color: "#4ade80" }}>
              <span>✓</span> Added to formula sheet
            </div>
          )}
        </div>
      </div>

      {/* ── Side nav ── */}
      <button
        onClick={goPrev}
        disabled={currentIndex === 0}
        className="fixed left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-all disabled:opacity-0 z-10"
        style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={goNext}
        disabled={currentIndex === total - 1}
        className="fixed right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-all disabled:opacity-0 z-10"
        style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* ── Bottom button ── */}
      <div className="px-5 pb-24 pt-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleCheck}
          disabled={markContentMutation.isPending}
          className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.97]"
          style={isCurrentDone
            ? isLast
              ? { background: "#4ade80", color: "#000", border: "none", boxShadow: "0 4px 0 0 rgba(74,222,128,0.3)" }
              : { background: "#1e1e1e", color: "white", border: "1px solid rgba(255,255,255,0.15)" }
            : { background: "#4ade80", color: "#000", border: "none", boxShadow: "0 4px 0 0 rgba(74,222,128,0.3)" }
          }
        >
          {isCurrentDone
            ? isLast ? "🏆 Quest Complete!" : "Next →"
            : "Got It"}
        </button>
      </div>

      {showSuccess && <SuccessOverlay xp={stepXp} isLast={isLast} onDone={handleSuccessDone} />}
    </div>
  );
}
