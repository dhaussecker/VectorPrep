// Canonical list of classes Quisly supports — the single source of truth for
// "what class is this" across weekly-email signups (signups.classes),
// AI-built student courses (courses.classCode), weekly skill sheets
// (weekly_docs.class_name), and syllabus timelines (syllabus_timelines.class_name).
// Previously this list was duplicated ad hoc (e.g. a local CLASSES const in
// admin.tsx) with no shared normalization, so the same class could silently
// fail to match across tables on whitespace/case differences.
export const CLASSES = ["MATH110", "GE122", "GE152", "GE172", "CMPT142", "MATH133"] as const;

export type ClassCode = (typeof CLASSES)[number];

export function normalizeClassCode(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

// Best-effort match of a freeform string (e.g. an AI-inferred course name, or
// user-typed class name) against the canonical list. Returns null if nothing
// matches closely enough to be confident.
export function matchClassCode(input: string): ClassCode | null {
  const normalizedInput = normalizeClassCode(input);
  for (const code of CLASSES) {
    if (normalizeClassCode(code) === normalizedInput) return code;
  }
  // Loose containment match, e.g. "Math 110 - Calculus I" → "MATH110"
  for (const code of CLASSES) {
    if (normalizedInput.includes(normalizeClassCode(code))) return code;
  }
  return null;
}
