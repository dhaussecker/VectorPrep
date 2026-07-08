/**
 * Seeds the Calculus I skill path with all first-year calculus topics.
 * Run: npx tsx --env-file=.env script/seed-calculus-path.ts
 *
 * SAFE to re-run — skips existing tools by name, only inserts missing ones.
 */

import { storage } from "../server/storage";

const TOPICS = [
  { name: "What is a Limit?",             icon: "📈", description: "Limit notation, intuition, and one-sided limits",              xp: 80  },
  { name: "Computing Limits",             icon: "🔍", description: "Algebraic techniques: substitution, factoring, conjugates",    xp: 100 },
  { name: "Continuity",                   icon: "🔄", description: "Continuity, removable vs. non-removable discontinuities",     xp: 100 },
  { name: "Limits at Infinity",           icon: "∞",  description: "Horizontal asymptotes and behavior as x → ±∞",               xp: 100 },
  { name: "Intro to Derivatives",         icon: "📐", description: "Derivative as the limit of the difference quotient",          xp: 120 },
  { name: "Power Rule",                   icon: "⚡", description: "Differentiating polynomials using the power rule",            xp: 80  },
  { name: "Product & Quotient Rules",     icon: "🔗", description: "Derivatives of products and quotients of functions",          xp: 120 },
  { name: "Chain Rule",                   icon: "🔧", description: "Differentiating compositions — the chain rule",               xp: 140 },
  { name: "Trig & Inverse Trig",          icon: "📉", description: "Derivatives of sin, cos, tan and their inverses",            xp: 130 },
  { name: "Implicit Differentiation",     icon: "🌀", description: "Differentiating when y is not isolated",                      xp: 140 },
  { name: "Exponential & Log Derivatives",icon: "📊", description: "Derivatives of eˣ, ln x, and logarithmic differentiation",  xp: 130 },
  { name: "Related Rates",                icon: "🎯", description: "Two quantities changing with respect to time",                xp: 160 },
  { name: "Optimization",                 icon: "🏔️", description: "Finding absolute and local max/min values",                  xp: 160 },
  { name: "L'Hôpital's Rule",             icon: "📏", description: "Evaluating indeterminate forms using derivatives",            xp: 130 },
  { name: "Curve Sketching",              icon: "✏️", description: "Using f′ and f″ to analyze and sketch functions",            xp: 150 },
  { name: "Intro to Integration",         icon: "∫",  description: "Riemann sums, the definite integral, and net area",          xp: 120 },
  { name: "Antiderivatives",              icon: "↩️", description: "Reversing differentiation, indefinite integrals",            xp: 100 },
  { name: "Fundamental Theorem",          icon: "🌉", description: "The bridge connecting derivatives and integrals",             xp: 160 },
];

async function main() {
  // Find or identify Calculus I course
  const allCourses = await storage.getCourses();
  const calc1 = allCourses.find(c => c.name.toLowerCase().includes("calculus i") && !c.name.toLowerCase().includes("ii"));

  if (!calc1) {
    console.error("No 'Calculus I' course found. Create one in the admin panel first.");
    process.exit(1);
  }

  console.log(`Found course: "${calc1.name}" (${calc1.id})`);

  // Get existing tools to avoid duplicates
  const existing = await storage.getToolsByCourse(calc1.id);
  const existingNames = new Set(existing.map(t => t.name.toLowerCase()));

  let added = 0;
  for (let i = 0; i < TOPICS.length; i++) {
    const t = TOPICS[i];
    if (existingNames.has(t.name.toLowerCase())) {
      console.log(`  skip  "${t.name}" (already exists)`);
      continue;
    }
    await storage.createTool({
      courseId: calc1.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      xpReward: t.xp,
      order: (existing.length + i) * 10,
      status: i === 0 ? "active" : "locked",
    });
    console.log(`  added "${t.name}"`);
    added++;
  }

  console.log(`\nDone. Added ${added} topic(s) to "${calc1.name}".`);
}

main().catch(console.error).finally(() => process.exit(0));
