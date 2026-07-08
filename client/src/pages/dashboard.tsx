import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Zap, Trophy, Flame, Swords } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Course, Tool } from "@shared/schema";
import { SyllabusOnboarding } from "@/components/syllabus-onboarding";

type ToolProgress = {
  tool: Tool;
  contentPercent: number; taskPercent: number; totalPercent: number;
  tasksCompleted: number; totalTasks: number;
};
type DashboardData = {
  profile: { xp: number; level: number; streak: number; lastActiveDate: string | null; badges: { id: string; name: string; icon: string }[]; };
  courses: Course[];
  progress: { overall: number; tools: ToolProgress[] };
};

function xpForLevel(lvl: number) { return lvl * 500; }
function xpInLevel(xp: number, lvl: number) { return xp - (lvl - 1) * 500; }

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const sweep = ((endDeg - startDeg) + 360) % 360;
  const la = sweep > 180 ? 1 : 0;
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${la} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

const GAUGE = { cx: 80, cy: 78, r: 56, start: 210, end: 150, sweep: 300 };
const BAR_COLORS = ["#4ade80", "#60a5fa", "#c084fc", "#fb923c", "#f472b6", "#34d399"];

function StatCard({ icon, label, value, sub, accent, isLoading }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent: string; isLoading: boolean;
}) {
  return (
    <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: accent + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: accent, flexShrink: 0 }}>
        {icon}
      </div>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
      {isLoading
        ? <Skeleton className="h-10 w-24 mb-2" />
        : <p style={{ fontSize: 38, fontWeight: 900, color: "white", lineHeight: 1, marginBottom: 5 }}>{value}</p>
      }
      {sub && <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11 }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"], staleTime: 30_000 });
  const streakMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/user/streak"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }),
  });
  useEffect(() => { streakMutation.mutate(); }, []);

  const [onboardingDone, setOnboardingDone] = useState(
    () => sessionStorage.getItem("syllabusOnboardingDone") === "1"
  );

  if (!isLoading && !onboardingDone) {
    return (
      <SyllabusOnboarding
        onDone={() => {
          sessionStorage.setItem("syllabusOnboardingDone", "1");
          setOnboardingDone(true);
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        }}
      />
    );
  }

  const firstName = user?.displayName?.split(" ")[0] ?? "Adventurer";
  const profile = data?.profile;
  const tools = data?.progress?.tools ?? [];
  const courses = data?.courses ?? [];

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const inLevel = xpInLevel(xp, level);
  const needed = xpForLevel(level);
  const xpPct = Math.min((inLevel / needed) * 100, 100);

  const mastered = tools.filter(t => t.totalPercent >= 100).length;
  const activeCourses = courses.filter(c => !c.locked);

  const nextTool = tools.find(t => t.tool.status === "active" && t.totalPercent < 100 && t.totalPercent > 0)
    ?? tools.find(t => t.tool.status === "active" && t.totalPercent < 100);
  const nextCourse = courses.find(c => c.id === nextTool?.tool.courseId);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const chartData = activeCourses.slice(0, 6).map(course => {
    const ct = tools.filter(t => t.tool.courseId === course.id);
    const pct = ct.length > 0 ? Math.round(ct.reduce((s, t) => s + t.totalPercent, 0) / ct.length) : 0;
    return { name: course.name.length > 9 ? course.name.slice(0, 8) + "…" : course.name, pct };
  });

  const fillEndDeg = GAUGE.start + (xpPct / 100) * GAUGE.sweep;

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white" }} className="pb-32 md:pb-10">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Greeting */}
        <div className="mb-10">
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 4 }}>{greeting},</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>{firstName}.</h1>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <StatCard icon={<Zap className="w-4 h-4" />} label="XP Earned" value={xp.toLocaleString()} sub={`Level ${level}`} accent="#facc15" isLoading={isLoading} />
          <StatCard icon={<Trophy className="w-4 h-4" />} label="Stages Mastered" value={`${mastered}`} sub={`of ${tools.length} stages`} accent="#a855f7" isLoading={isLoading} />
          <StatCard icon={<Flame className="w-4 h-4" />} label="Day Streak" value={`${streak}`} sub="days in a row" accent="#f97316" isLoading={isLoading} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          {/* Subject progress bar chart */}
          <div className="md:col-span-2" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px" }}>
            <p style={{ color: "white", fontWeight: 900, fontSize: 15, marginBottom: 3 }}>Subject Progress</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 18 }}>completion % per course</p>
            {isLoading ? (
              <Skeleton className="w-full h-36" />
            ) : chartData.length === 0 ? (
              <div style={{ height: 144, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>Add a quest to see progress</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={144}>
                <BarChart data={chartData} barSize={22} margin={{ top: 0, right: 4, left: -18, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "white" }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    formatter={(val: number) => [`${val}%`, "Progress"]}
                  />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* XP Level gauge */}
          <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column" }}>
            <p style={{ color: "white", fontWeight: 900, fontSize: 15, marginBottom: 3 }}>Level Progress</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 8 }}>XP to next level</p>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <svg width={160} height={110} viewBox="0 0 160 110" style={{ overflow: "visible" }}>
                {/* Background arc */}
                <path
                  d={arcPath(GAUGE.cx, GAUGE.cy, GAUGE.r, GAUGE.start, GAUGE.end)}
                  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} strokeLinecap="round"
                />
                {/* Fill arc */}
                {xpPct > 0.5 && (
                  <path
                    d={arcPath(GAUGE.cx, GAUGE.cy, GAUGE.r, GAUGE.start, fillEndDeg)}
                    fill="none" stroke="#facc15" strokeWidth={10} strokeLinecap="round"
                    style={{ transition: "all 1s ease" }}
                  />
                )}
                <text x={GAUGE.cx} y={GAUGE.cy + 8} textAnchor="middle" fill="white" fontSize={24} fontWeight={900} fontFamily="system-ui">
                  {Math.round(xpPct)}%
                </text>
                <text x={GAUGE.cx} y={GAUGE.cy + 25} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={10} fontFamily="system-ui">
                  to level {level + 1}
                </text>
              </svg>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 2 }}>{inLevel.toLocaleString()} / {needed.toLocaleString()} XP</p>
            </div>
          </div>
        </div>

        {/* Continue CTA */}
        {!isLoading && nextTool && (
          <Link href={`/learn/${nextTool.tool.courseId ?? ""}/${nextTool.tool.id}`}>
            <div style={{ background: "#4ade80", borderRadius: 12, padding: "14px 18px", cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}
              className="hover:brightness-95 transition-all">
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {nextTool.tool.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "rgba(0,0,0,0.5)", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Continue</p>
                <p style={{ color: "black", fontWeight: 900, fontSize: 14 }} className="truncate">{nextTool.tool.name}</p>
                {nextCourse && <p style={{ color: "rgba(0,0,0,0.45)", fontSize: 11 }}>{nextCourse.name}</p>}
              </div>
              <ArrowRight style={{ color: "rgba(0,0,0,0.4)", flexShrink: 0 }} className="w-5 h-5" />
            </div>
          </Link>
        )}

        {/* Quest map link */}
        <Link href="/classes">
          <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            className="hover:border-white/20 transition-colors mb-4">
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Swords style={{ color: "#4ade80" }} className="w-4 h-4" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Quest Map</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Browse all courses and stages</p>
            </div>
            <ArrowRight style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} className="w-4 h-4" />
          </div>
        </Link>

        {/* Badges */}
        {profile && profile.badges.length > 0 && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Achievements</p>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 100, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                  <span>{b.icon}</span><span>{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
