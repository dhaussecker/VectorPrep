import { eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { tools, courses } from "@shared/schema";
import { storage } from "./storage";

async function migrateCourses() {
  const existingCourses = await storage.getCourses();
  if (existingCourses.length > 0) return;

  const existingTools = await storage.getTools();
  if (existingTools.length === 0) return;

  console.log("Migrating: creating default course and assigning existing tools...");
  const course = await storage.createCourse({
    name: "Calculus II Part 1",
    description: "Vectors, integration fundamentals, techniques, and approximation methods",
    icon: "📐",
    color: "#22C55E",
    orderIndex: 0,
  });

  await db.update(tools).set({ courseId: course.id }).where(isNull(tools.courseId));
  console.log("Migration complete: assigned all tools to Calculus II Part 1");
}

export async function seedDatabase() {
  await migrateCourses();

  const toolCount = await storage.getToolCount();
  if (toolCount > 0) return;

  console.log("Seeding database with OnQuest content...");

  // ─── Calculus I ───────────────────────────────────────────────────────────

  const calc1 = await storage.createCourse({
    name: "Calculus I",
    description: "Limits, derivatives, and the foundations of differential calculus",
    icon: "∞",
    color: "#3B82F6",
    orderIndex: 0,
  });

  // ── Quest: Limits via Substitution ────────────────────────────────────────

  const limits = await storage.createTool({
    courseId: calc1.id,
    name: "Limits via Substitution",
    description: "Evaluate limits by direct substitution and factoring techniques",
    icon: "lim",
    status: "active",
    orderIndex: 0,
    xpReward: 120,
  });

  await storage.createToolContent({
    toolId: limits.id,
    type: "text",
    title: "What is a Limit?",
    formula: "$$\\lim_{x \\to a} f(x) = L$$",
    content: `A **limit** describes what value $f(x)$ approaches as $x$ gets closer to $a$ — but never has to reach it.

Think of it like walking toward a wall: you can get infinitely close without ever touching it.

The limit $L$ is the destination, not the arrival.`,
    quickCheck: "What does lim(x→3) f(x) = 7 mean?",
    quickCheckAnswer: "As x approaches 3 from either side, f(x) gets arbitrarily close to 7 — even if f(3) ≠ 7.",
    orderIndex: 0,
  });

  await storage.createToolContent({
    toolId: limits.id,
    type: "text",
    title: "Direct Substitution",
    formula: "$$\\lim_{x \\to a} f(x) = f(a)$$",
    content: `**Direct substitution** is the first method to try: plug $a$ directly in for $x$.

This works whenever $f$ is **continuous** at $x = a$ — no holes, jumps, or vertical asymptotes.

**Example:**
$$\\lim_{x \\to 2}\\,(x^2 + 3x - 1) = (2)^2 + 3(2) - 1 = 4 + 6 - 1 = \\mathbf{9}$$`,
    quickCheck: "Evaluate: lim(x→4) of (√x + x²)",
    quickCheckAnswer: "Plug in x = 4: √4 + 4² = 2 + 16 = 18",
    orderIndex: 1,
  });

  await storage.createToolContent({
    toolId: limits.id,
    type: "text",
    title: "When You Get 0/0",
    formula: "\\[ \\frac{0}{0} \\Rightarrow \\text{factor and cancel} \\]",
    content: `If direct substitution gives $\\dfrac{0}{0}$, you have an **indeterminate form**.

This signals a **common factor** in the numerator and denominator that you can cancel.

**Steps:** Factor → Cancel → Substitute

**Example:**
$$\\lim_{x \\to 3}\\frac{x^2 - 9}{x - 3} = \\lim_{x \\to 3}\\frac{(x+3)(x-3)}{x-3} = \\lim_{x \\to 3}(x+3) = \\mathbf{6}$$`,
    quickCheck: "Evaluate: lim(x→2) of (x² − 4)/(x − 2)",
    quickCheckAnswer: "Factor numerator: (x+2)(x-2)/(x-2) = x+2. At x = 2: 2+2 = 4",
    orderIndex: 2,
  });

  await storage.createToolContent({
    toolId: limits.id,
    type: "text",
    title: "One-Sided Limits",
    formula: "$$\\lim_{x \\to a^-} f(x) \\quad \\text{vs} \\quad \\lim_{x \\to a^+} f(x)$$",
    content: `A **one-sided limit** asks what $f(x)$ approaches from just one direction.

- $a^-$ = approach from the **left** (values less than $a$)
- $a^+$ = approach from the **right** (values greater than $a$)

**Key rule:** $\\displaystyle\\lim_{x\\to a}$ exists **only when** both sides agree.

If $\\displaystyle\\lim_{x\\to a^-}f(x) \\ne \\lim_{x\\to a^+}f(x)$, the two-sided limit **does not exist**.`,
    quickCheck: "lim(x→2⁻) = 5 and lim(x→2⁺) = 7 — does lim(x→2) exist?",
    quickCheckAnswer: "No. The left and right limits differ (5 ≠ 7), so the two-sided limit does not exist.",
    orderIndex: 3,
  });

  await storage.createToolContent({
    toolId: limits.id,
    type: "text",
    title: "Putting It Together",
    formula: "$$\\lim_{x \\to a} f(x): \\text{ try substitution first, then factor}$$",
    content: `**Your limit-solving checklist:**

1. **Try direct substitution.** Plug in $a$ for $x$.
2. **Get a real number?** → That's your answer. ✓
3. **Get $\\frac{0}{0}$?** → Factor and cancel the common term.
4. **After canceling,** substitute again.
5. **Still stuck?** Check for one-sided limits or try other techniques.

Practice makes limits feel automatic — most exams test the same patterns.`,
    quickCheck: "lim(x→1) of (x² − 1)/(x − 1) = ?",
    quickCheckAnswer: "Factor: (x+1)(x-1)/(x-1) = x+1. At x = 1: 1+1 = 2",
    orderIndex: 4,
  });

  await storage.createTask({ toolId: limits.id, label: "Evaluate 5 limits by direct substitution", xp: 20, orderIndex: 0 });
  await storage.createTask({ toolId: limits.id, label: "Factor and solve 3 indeterminate forms", xp: 30, orderIndex: 1 });
  await storage.createTask({ toolId: limits.id, label: "Identify 2 limits that do not exist", xp: 20, orderIndex: 2 });

  // ── Quest: L'Hôpital's Rule (locked) ─────────────────────────────────────

  const lhopital = await storage.createTool({
    courseId: calc1.id,
    name: "L'Hôpital's Rule",
    description: "Handle indeterminate forms using derivatives",
    icon: "∂",
    status: "locked",
    orderIndex: 1,
    xpReward: 140,
  });

  await storage.createToolContent({
    toolId: lhopital.id,
    type: "text",
    title: "L'Hôpital's Rule",
    formula: "$$\\lim_{x\\to a}\\frac{f(x)}{g(x)} = \\lim_{x\\to a}\\frac{f'(x)}{g'(x)}$$",
    content: "When direct substitution gives 0/0 or ∞/∞, differentiate top and bottom separately, then evaluate.",
    orderIndex: 0,
  });

  await storage.createTask({ toolId: lhopital.id, label: "Apply L'Hôpital's Rule to 5 problems", xp: 40, orderIndex: 0 });

  // ─── Calculus II Part 1 ───────────────────────────────────────────────────

  const calc2part1 = await storage.createCourse({
    name: "Calculus II Part 1",
    description: "Vectors, integration fundamentals, techniques, and approximation methods",
    icon: "📐",
    color: "#22C55E",
    orderIndex: 1,
  });

  const vectors = await storage.createTool({
    courseId: calc2part1.id,
    name: "Vectors",
    description: "Building vectors, dot products, cross products, projections, and vector planes",
    icon: "→",
    status: "active",
    orderIndex: 0,
    xpReward: 150,
  });

  await storage.createToolContent({
    toolId: vectors.id,
    type: "text",
    title: "Build a Vector From 2 Points",
    formula: "$$\\vec{PQ} = Q - P$$",
    content: `Given points $P$ and $Q$, subtract coordinates of $P$ from $Q$:

**Example:** $P(1, -1, 2)$, $Q(4, 2, 0)$
$$\\vec{PQ} = (4-1,\\, 2-(-1),\\, 0-2) = (3, 3, -2)$$`,
    quickCheck: "Find the vector from A(2, 0, -1) to B(5, 3, 4)",
    quickCheckAnswer: "B − A = (5−2, 3−0, 4−(−1)) = (3, 3, 5)",
    orderIndex: 0,
  });

  await storage.createTask({ toolId: vectors.id, label: "Build 5 vectors from point pairs", xp: 25, orderIndex: 0 });
  await storage.createTask({ toolId: vectors.id, label: "Calculate 3 dot products", xp: 30, orderIndex: 1 });
  await storage.createTask({ toolId: vectors.id, label: "Solve a projection problem", xp: 40, orderIndex: 2 });

  const integration = await storage.createTool({
    courseId: calc2part1.id,
    name: "Integration Fundamentals",
    description: "Antiderivatives, substitution, and basic integration techniques",
    icon: "∫",
    status: "locked",
    orderIndex: 1,
    xpReward: 150,
  });

  await storage.createToolContent({
    toolId: integration.id,
    type: "text",
    title: "The Fundamental Theorem of Calculus",
    formula: "$$\\int_a^b f(x)\\,dx = F(b) - F(a)$$",
    content: `If $F$ is an antiderivative of $f$ on $[a, b]$, then the definite integral equals $F(b) - F(a)$.

This connects differentiation and integration — the two pillars of calculus.`,
    orderIndex: 0,
  });

  await storage.createTask({ toolId: integration.id, label: "Evaluate 5 definite integrals", xp: 30, orderIndex: 0 });
  await storage.createTask({ toolId: integration.id, label: "Apply u-substitution to 3 problems", xp: 35, orderIndex: 1 });

  console.log("Seeding complete: Calc I + Calc II content loaded.");
}
