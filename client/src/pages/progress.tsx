import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GraduationCap, Upload, Check, X, Pencil, BookOpen, Flame, Trophy, Loader2, ArrowRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Course } from "@shared/schema";

type ProgramCourse = { name: string; code: string; description: string };
type ProfileData = {
  xp: number; level: number; streak: number;
  program?: string;
  programCourses?: ProgramCourse[];
  selectedCourseNames?: string[];
  badges: { id: string; name: string; icon: string }[];
};

function xpToNext(level: number) { return level * 500; }
function xpInLevel(xp: number, level: number) { return xp - (level - 1) * 500; }

// ─── Step 1: Program input ─────────────────────────────────────────────────

function ProgramSetup({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"input" | "loading" | "select" | "uploading">("input");
  const [programText, setProgramText] = useState("");
  const [courses, setCourses] = useState<ProgramCourse[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploadedCourses, setUploadedCourses] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const searchMut = useMutation({
    mutationFn: async (program: string) => {
      const res = await apiRequest("POST", "/api/user/program", { program });
      return res.json() as Promise<{ program: string; courses: ProgramCourse[] }>;
    },
    onSuccess: (data) => {
      setCourses(data.courses);
      setStep("select");
    },
  });

  const saveMut = useMutation({
    mutationFn: async (names: string[]) => {
      const res = await apiRequest("PUT", "/api/user/program-courses", { selectedCourseNames: names });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      onDone();
    },
  });

  const uploadMut = useMutation({
    mutationFn: async ({ file, courseName }: { file: File; courseName: string }) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? "";
      const fd = new FormData();
      fd.append("files", file);
      fd.append("courseName", courseName);
      const res = await fetch("/api/user/syllabus-upload", {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, vars) => {
      setUploadedCourses(p => new Set([...Array.from(p), vars.courseName]));
      setUploadingFor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: () => setUploadingFor(null),
  });

  const toggle = (name: string) => {
    setSelected(s => {
      const n = new Set(Array.from(s));
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingFor) {
      uploadMut.mutate({ file, courseName: uploadingFor });
    }
    e.target.value = "";
  };

  if (step === "input") {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border-2 border-primary/30 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-black">What program are you in?</h2>
          <p className="text-xs text-muted-foreground mt-1 font-mono">We'll find your courses automatically</p>
        </div>
        <input
          value={programText}
          onChange={e => setProgramText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && programText.trim() && searchMut.mutate(programText.trim())}
          placeholder="e.g. University of Saskatchewan, Engineering, Year 2"
          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-sm font-mono focus:outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={() => searchMut.mutate(programText.trim())}
          disabled={!programText.trim() || searchMut.isPending}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
        >
          {searchMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {searchMut.isPending ? "Finding your courses…" : "Find My Courses"}
        </button>
        {searchMut.isError && (
          <p className="text-xs text-destructive text-center font-mono">Failed to fetch courses. Try again.</p>
        )}
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black">Select Your Courses</h2>
            <p className="text-xs text-muted-foreground font-mono">Pick the ones you're taking this term</p>
          </div>
          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{selected.size} selected</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {courses.map(c => {
            const isSelected = selected.has(c.name);
            const isUploaded = uploadedCourses.has(c.name);
            return (
              <div
                key={c.code}
                onClick={() => toggle(c.name)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                  isSelected ? "bg-primary border-primary" : "border-border"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-muted-foreground">{c.code}</span>
                    {isUploaded && <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">syllabus added</span>}
                  </div>
                  <p className="text-sm font-semibold leading-tight mt-0.5">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>
                </div>
                {isSelected && !isUploaded && (
                  <button
                    onClick={e => { e.stopPropagation(); setUploadingFor(c.name); fileRef.current?.click(); }}
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border text-[10px] font-mono hover:border-primary transition-colors"
                  >
                    {uploadMut.isPending && uploadingFor === c.name
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Upload className="w-3 h-3" />}
                    syllabus
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

        <button
          onClick={() => saveMut.mutate(Array.from(selected))}
          disabled={selected.size === 0 || saveMut.isPending}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
        >
          {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {saveMut.isPending ? "Saving…" : `Confirm ${selected.size} Course${selected.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    );
  }

  return null;
}

// ─── Profile done state ────────────────────────────────────────────────────

function ProfileCard({ profile, onEdit }: { profile: ProfileData; onEdit: () => void }) {
  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  const selected = profile.selectedCourseNames ?? [];
  const programCourses = (profile.programCourses ?? []) as ProgramCourse[];
  const xpForNext = xpToNext(profile.level);
  const xpPct = (xpInLevel(profile.xp, profile.level) / xpForNext) * 100;

  return (
    <div className="space-y-4">
      {/* XP card */}
      <div className="rounded-2xl border-2 border-foreground overflow-hidden shadow-hard">
        <div className="bg-foreground px-4 py-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white/40">Level</p>
              <p className="text-4xl font-black font-mono text-white leading-none">{profile.level}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white/40">Total XP</p>
              <p className="text-2xl font-bold font-mono text-primary">{profile.xp}</p>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-white/10">
            <div className="h-full rounded-full transition-all duration-700 bg-primary" style={{ width: `${Math.min(xpPct, 100)}%` }} />
          </div>
          <p className="text-[9px] font-mono text-white/30 mt-1.5">
            {xpInLevel(profile.xp, profile.level)} / {xpForNext} XP to Level {profile.level + 1}
          </p>
        </div>
        <div className="bg-card px-4 py-3 flex gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold font-mono">{profile.streak}d streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold font-mono">{profile.badges?.length ?? 0} badges</span>
          </div>
        </div>
      </div>

      {/* Program */}
      <div className="rounded-2xl border-2 border-foreground overflow-hidden shadow-hard">
        <div className="bg-foreground px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-white/60" />
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40">Academic Program</p>
          </div>
          <button onClick={onEdit} className="flex items-center gap-1 text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors">
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
        <div className="bg-card px-4 py-3">
          <p className="text-sm font-bold mb-2">{profile.program}</p>
          {selected.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">This Term's Courses</p>
              {selected.map(name => {
                const pc = programCourses.find(c => c.name === name);
                const platformCourse = courses?.find(c => c.name === name || c.name.includes(name.split(" ")[0]));
                return (
                  <div key={name} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-background border border-border">
                    <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{name}</p>
                      {pc && <p className="text-[10px] text-muted-foreground font-mono">{pc.code}</p>}
                    </div>
                    {platformCourse && (
                      <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">on platform</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      {profile.badges?.length > 0 && (
        <div className="rounded-2xl border-2 border-foreground overflow-hidden shadow-hard">
          <div className="bg-foreground px-4 py-3">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40">Achievements</p>
          </div>
          <div className="bg-card px-4 py-3 flex flex-wrap gap-2">
            {profile.badges.map(b => (
              <div key={b.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <span>{b.icon}</span><span>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/user/profile"],
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/user/program"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      setEditing(true);
    },
  });

  const firstName = user?.displayName?.split(" ")[0] ?? "Adventurer";
  const hasProgram = profile?.program && !editing;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="px-5 pt-6 pb-5 bg-foreground relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)/.25), transparent 70%)" }} />
        <div className="relative z-10">
          <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/40">Your Profile</p>
          <h1 className="text-3xl font-black tracking-tight text-white">{firstName}</h1>
          {profile?.program && (
            <p className="text-xs font-mono text-white/50 mt-1 truncate">{profile.program}</p>
          )}
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : hasProgram ? (
          <ProfileCard profile={profile!} onEdit={() => { setEditing(true); }} />
        ) : (
          <div className="rounded-2xl border-2 border-foreground overflow-hidden shadow-hard">
            <div className="bg-foreground px-4 py-3">
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40">Academic Setup</p>
            </div>
            <div className="bg-card px-4 py-4">
              <ProgramSetup onDone={() => setEditing(false)} />
            </div>
          </div>
        )}

        {/* Edit mode shows setup again */}
        {editing && profile?.program && (
          <div className="rounded-2xl border-2 border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted flex items-center justify-between">
              <p className="text-xs font-mono font-bold">Update Program</p>
              <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-4">
              <ProgramSetup onDone={() => setEditing(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
