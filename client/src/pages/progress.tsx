import { useQuery } from "@tanstack/react-query";
import { Zap, Flame, Trophy, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

type ProfileData = {
  xp: number; level: number; streak: number;
  badges: { id: string; name: string; icon: string }[];
};

function xpToNext(level: number) { return level * 500; }
function xpInLevel(xp: number, level: number) { return xp - (level - 1) * 500; }

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

export default function ProgressPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/user/profile"],
    staleTime: 30_000,
  });

  const firstName = user?.displayName?.split(" ")[0] ?? "Adventurer";
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const inLevelXp = xpInLevel(xp, level);
  const needed = xpToNext(level);
  const xpPct = Math.min((inLevelXp / needed) * 100, 100);
  const fillEndDeg = GAUGE.start + (xpPct / 100) * GAUGE.sweep;

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white" }} className="pb-32 md:pb-10">

      {/* Header */}
      <div style={{ padding: "40px 24px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          Your Profile
        </p>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>{firstName}.</h1>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px" }}>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-36 w-full rounded-2xl" style={{ background: "#1a1a1a" }} />
            <Skeleton className="h-28 w-full rounded-2xl" style={{ background: "#1a1a1a" }} />
          </div>
        ) : (
          <>
            {/* Top stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { icon: <Zap className="w-4 h-4" />, accent: "#facc15", label: "Total XP",   value: xp.toLocaleString() },
                { icon: <Flame className="w-4 h-4" />, accent: "#f97316", label: "Day Streak", value: `${streak}` },
                { icon: <Trophy className="w-4 h-4" />, accent: "#a855f7", label: "Level",     value: `${level}` },
              ].map(card => (
                <div key={card.label} style={{ background: "#141414", borderRadius: 14, padding: "18px 16px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ color: card.accent, marginBottom: 10 }}>{card.icon}</div>
                  <p style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, marginBottom: 5 }}>{card.value}</p>
                  <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.07em" }}>{card.label}</p>
                </div>
              ))}
            </div>

            {/* XP level gauge */}
            <div style={{ background: "#141414", borderRadius: 14, padding: "20px 24px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 10, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flexShrink: 0 }}>
                <svg width={160} height={110} viewBox="0 0 160 110" style={{ overflow: "visible" }}>
                  <path d={arcPath(GAUGE.cx, GAUGE.cy, GAUGE.r, GAUGE.start, GAUGE.end)}
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} strokeLinecap="round" />
                  {xpPct > 0.5 && (
                    <path d={arcPath(GAUGE.cx, GAUGE.cy, GAUGE.r, GAUGE.start, fillEndDeg)}
                      fill="none" stroke="#facc15" strokeWidth={10} strokeLinecap="round" />
                  )}
                  <text x={GAUGE.cx} y={GAUGE.cy + 8} textAnchor="middle" fill="white" fontSize={24} fontWeight={900} fontFamily="system-ui">
                    {Math.round(xpPct)}%
                  </text>
                  <text x={GAUGE.cx} y={GAUGE.cy + 24} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize={10} fontFamily="system-ui">
                    to level {level + 1}
                  </text>
                </svg>
              </div>
              <div>
                <p style={{ fontWeight: 900, fontSize: 20, marginBottom: 4 }}>Level {level}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 10 }}>
                  {inLevelXp.toLocaleString()} / {needed.toLocaleString()} XP
                </p>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", width: 140, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${xpPct}%`, background: "#facc15", borderRadius: 2, transition: "width 1s ease" }} />
                </div>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 8 }}>
                  {(needed - inLevelXp).toLocaleString()} XP to go
                </p>
              </div>
            </div>

            {/* Continue CTA */}
            <Link href="/classes">
              <div style={{ background: "#4ade80", borderRadius: 12, padding: "14px 18px", cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}
                className="hover:brightness-95 transition-all">
                <div style={{ flex: 1 }}>
                  <p style={{ color: "rgba(0,0,0,0.45)", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Ready?</p>
                  <p style={{ color: "black", fontWeight: 900, fontSize: 15 }}>Continue Learning</p>
                </div>
                <ArrowRight style={{ color: "rgba(0,0,0,0.4)" }} className="w-5 h-5" />
              </div>
            </Link>

            {/* Badges */}
            {profile?.badges && profile.badges.length > 0 && (
              <div style={{ background: "#141414", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  Achievements
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map(b => (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 100, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                      <span>{b.icon}</span><span>{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
