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

  console.log("Seeding database with Calc 2 Part 1 content...");

  const calc2part1 = await storage.createCourse({
    name: "Calculus II Part 1",
    description: "Vectors, integration fundamentals, techniques, and approximation methods",
    icon: "📐",
    color: "#22C55E",
    orderIndex: 0,
  });

  // ─── Vectors ─────────────────────────────────────────────────────

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
    title: "Skill 1: Build a Vector From 2 Points",
    content: `Given points $P$ and $Q$, the vector $\\vec{PQ}$ is found by subtracting the coordinates of $P$ from $Q$:

$$\\vec{PQ} = Q - P$$

**Example:** Given $P(1, -1, 2)$, $Q(4, 2, 0)$
$$\\vec{PQ} = (4-1, 2-(-1), 0-2) = (3, 3, -2)$$`,
    orderIndex: 0,
  });

  await storage.createTask({ toolId: vectors.id, label: "Build 5 vectors from point pairs", xp: 25, orderIndex: 0 });
  await storage.createTask({ toolId: vectors.id, label: "Calculate 3 dot products", xp: 30, orderIndex: 1 });
  await storage.createTask({ toolId: vectors.id, label: "Solve a projection problem", xp: 40, orderIndex: 2 });

  // ─── Integration ──────────────────────────────────────────────────

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
    content: `If $F$ is an antiderivative of $f$ on $[a, b]$, then:

$$\\int_a^b f(x)\\,dx = F(b) - F(a)$$

This connects differentiation and integration — the two pillars of calculus.`,
    orderIndex: 0,
  });

  await storage.createTask({ toolId: integration.id, label: "Evaluate 5 definite integrals", xp: 30, orderIndex: 0 });
  await storage.createTask({ toolId: integration.id, label: "Apply u-substitution to 3 problems", xp: 35, orderIndex: 1 });

  console.log("Seeding complete.");
}
