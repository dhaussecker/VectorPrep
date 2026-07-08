import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Lock, ChevronRight, ArrowLeft, Zap, Trophy, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, Tool } from "@shared/schema";

type ToolProgress = {
  tool: Tool;
  contentPercent: number;
  taskPercent: number;
  totalPercent: number;
  tasksCompleted: number;
  totalTasks: number;
};
type CourseData = { course: Course; tools: ToolProgress[] };

// ─── Skill path node ──────────────────────────────────────────────────────────

function SkillNode({ tp, index, isLast }: { tp: ToolProgress; index: number; isLast: boolean }) {
  const { tool, totalPercent } = tp;
  const isLocked = tool.status === "locked";
  const isDone = totalPercent >= 100;
  const isNext = !isLocked && !isDone;

  const dotColor = isDone ? "#4ade80" : isNext ? "#4ade80" : "rgba(255,255,255,0.1)";

  return (
    <div style={{ display: "flex", gap: 16, position: "relative" }}>
      {/* Left: number + connector line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 32 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isDone ? "#4ade80" : isNext ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)",
          border: isDone ? "none" : isNext ? "1.5px solid rgba(74,222,128,0.4)" : "1.5px solid rgba(255,255,255,0.08)",
          fontSize: 12, fontWeight: 900, fontFamily: "monospace",
          color: isDone ? "black" : isNext ? "#4ade80" : "rgba(255,255,255,0.2)",
        }}>
          {isDone ? <Check style={{ width: 14, height: 14 }} /> : isLocked ? <Lock style={{ width: 12, height: 12 }} /> : index + 1}
        </div>
        {!isLast && (
          <div style={{
            width: 1.5, flex: 1, marginTop: 6,
            background: isDone ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.06)",
          }} />
        )}
      </div>

      {/* Right: card */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 10 }}>
        <Link href={isLocked ? "#" : `/learn/${tool.courseId ?? ""}/${tool.id}`}>
          <div style={{
            background: isNext ? "#111" : "#0e0e0e",
            border: isNext ? "1px solid rgba(74,222,128,0.18)" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: "14px 16px",
            cursor: isLocked ? "not-allowed" : "pointer",
            opacity: isLocked ? 0.4 : 1,
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 4,
            transition: "border-color 0.15s",
          }}
            className={isLocked ? "" : "hover:border-green-500/30"}
          >
            {/* Icon */}
            <div style={{ fontSize: 22, flexShrink: 0, width: 36, textAlign: "center" }}>
              {isDone ? "⭐" : isLocked ? "🔒" : (tool.icon || "📘")}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <p style={{
                  fontWeight: 900, fontSize: 14, color: isLocked ? "rgba(255,255,255,0.3)" : "white",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {tool.name}
                </p>
                {isDone && (
                  <span style={{ fontSize: 9, fontFamily: "monospace", fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 6px", borderRadius: 100, letterSpacing: "0.08em", flexShrink: 0 }}>
                    DONE
                  </span>
                )}
                {isNext && !isDone && (
                  <span style={{ fontSize: 9, fontFamily: "monospace", fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 6px", borderRadius: 100, letterSpacing: "0.08em", flexShrink: 0 }}>
                    NEXT
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {tool.description}
              </p>
              {!isLocked && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${totalPercent}%`, background: "#4ade80", borderRadius: 1, transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                    <Zap style={{ width: 10, height: 10, color: "#facc15" }} />
                    <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "monospace", color: "#facc15" }}>{tool.xpReward ?? 100}</span>
                  </div>
                </div>
              )}
            </div>

            {!isLocked && <ChevronRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />}
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── Course skill path page ───────────────────────────────────────────────────

function CoursePage({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery<CourseData>({ queryKey: [`/api/courses/${courseId}/tools`] });

  if (isLoading) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", padding: "24px" }}>
      <div className="space-y-3 max-w-lg mx-auto pt-8">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" style={{ background: "#151515" }} />
        ))}
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}>
      Quest not found.
    </div>
  );

  const { course, tools } = data;
  const mastered = tools.filter(t => t.totalPercent >= 100).length;
  const avg = tools.length > 0 ? tools.reduce((s, t) => s + t.totalPercent, 0) / tools.length : 0;

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white" }} className="pb-32 md:pb-10">

      {/* Header */}
      <div style={{ padding: "32px 24px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/classes">
          <button style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 20, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            className="hover:text-white transition-colors">
            <ArrowLeft style={{ width: 14, height: 14 }} /> Quests
          </button>
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
          <span style={{ fontSize: 40, flexShrink: 0 }}>{course.icon}</span>
          <div>
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
              Skill Path
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 4 }}>{course.name}</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{course.description}</p>
          </div>
        </div>

        {/* Progress summary */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${avg}%`, background: "#4ade80", borderRadius: 2, transition: "width 0.8s ease" }} />
          </div>
          <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 900, color: avg > 0 ? "#4ade80" : "rgba(255,255,255,0.25)", flexShrink: 0 }}>
            {mastered}/{tools.length} done
          </span>
          {mastered === tools.length && tools.length > 0 && (
            <Trophy style={{ width: 14, height: 14, color: "#facc15", flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* Skill path */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "24px 20px" }}>
        {tools.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.2)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
            <p style={{ fontSize: 14 }}>Topics coming soon.</p>
          </div>
        ) : tools.map((tp, i) => (
          <SkillNode key={tp.tool.id} tp={tp} index={i} isLast={i === tools.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ─── All courses (landing / redirect) ────────────────────────────────────────

function AllCoursesPage() {
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  const available = (courses ?? []).filter(c => !c.locked);

  if (isLoading) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", padding: "32px 24px" }}>
      <div className="space-y-3 max-w-lg mx-auto pt-8">
        {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" style={{ background: "#151515" }} />)}
      </div>
    </div>
  );

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white" }} className="pb-32 md:pb-10">

      <div style={{ padding: "40px 24px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          Your learning path
        </p>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>Quests.</h1>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px" }}>
        {available.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.2)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
            <p style={{ fontWeight: 900, fontSize: 18, marginBottom: 8, color: "rgba(255,255,255,0.5)" }}>No quests yet</p>
            <p style={{ fontSize: 13 }}>Check back soon.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {available.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const ACCENTS = ["#4ade80", "#818cf8", "#f472b6", "#fb923c"];
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <Link href={`/classes/${course.id}`}>
      <div style={{
        background: "#111", borderRadius: 16, padding: "20px 20px",
        border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 16,
      }}
        className="hover:border-white/15 transition-all">
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `${accent}14`, border: `1.5px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
        }}>
          {course.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 16, marginBottom: 3 }}>{course.name}</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {course.description}
          </p>
        </div>
        <ChevronRight style={{ width: 16, height: 16, color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
      </div>
    </Link>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const params = useParams();
  const courseId = (params as any).courseId;
  return courseId ? <CoursePage courseId={courseId} /> : <AllCoursesPage />;
}
