import { eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { topics, courses } from "@shared/schema";
import { storage } from "./storage";

async function migrateCourses() {
  const existingCourses = await storage.getCourses();
  if (existingCourses.length > 0) return;

  const existingTopics = await storage.getTopics();
  if (existingTopics.length === 0) return;

  console.log("Migrating: creating default course and assigning existing topics...");
  const course = await storage.createCourse({
    name: "Calculus II Part 1",
    description: "Vectors, integration fundamentals, techniques, and approximation methods",
    icon: "📐",
    orderIndex: 0,
  });

  await db.update(topics).set({ courseId: course.id }).where(isNull(topics.courseId));
  console.log("Migration complete: assigned all topics to Calculus II Part 1");
}

export async function seedDatabase() {
  await migrateCourses();

  const topicCount = await storage.getTopicCount();
  if (topicCount > 0) return;

  console.log("Seeding database with Calc 2 Part 1 content...");

  // ─── Create Course ─────────────────────────────────────────────────

  const calc2part1 = await storage.createCourse({
    name: "Calculus II Part 1",
    description: "Vectors, integration fundamentals, techniques, and approximation methods",
    icon: "📐",
    orderIndex: 0,
  });

  // ─── Section 1: Vectors ───────────────────────────────────────────

  const vectors = await storage.createTopic({
    courseId: calc2part1.id,
    name: "Vectors",
    description: "Building vectors, dot products, cross products, projections, and vector planes",
    icon: "→",
    orderIndex: 0,
  });

  await storage.createLearnCard({
    topicId: vectors.id,
    title: "Skill 1: Build a Vector From 2 Points",
    content: `Given points $P$ and $Q$, the vector $\\vec{PQ}$ is found by subtracting the coordinates of $P$ from $Q$:

$$\\vec{PQ} = Q - P$$

**Example:** Given $P(1, -1, 2)$, $Q(4, 2, 0)$, $R(1, 3, 2)$

$$\\vec{PQ} = (4, 2, 0) - (1, -1, 2) = (4-1,\\; 2-(-1),\\; 0-2) = (3, 3, -2)$$

Similarly:
$$\\vec{PR} = (1, 3, 2) - (1, -1, 2) = (0, 4, 0)$$`,
    formula: "$$\\vec{PQ} = Q - P$$",
    quickCheck: "Find PQ if P = (2, 1) and Q = (5, 4)",
    quickCheckAnswer: "(3, 3)",
    orderIndex: 0,
  });

  await storage.createLearnCard({
    topicId: vectors.id,
    title: "Skill 2: Find The Angle Between 2 Vectors Using The Dot Product",
    content: `The dot product relates two vectors to the angle between them:

$$\\vec{A} \\cdot \\vec{B} = |A||B|\\cos\\theta$$

Solving for the angle:

$$\\theta = \\cos^{-1}\\left(\\frac{\\vec{A} \\cdot \\vec{B}}{|A||B|}\\right)$$

**Example:** If the points form a triangle, find the angle at $P$:
- $\\vec{PQ} = (3, 3, -2)$
- $\\vec{PR} = (0, 4, 0)$

$$\\vec{PQ} \\cdot \\vec{PR} = 3(0) + 3(4) + (-2)(0) = 12$$
$$|PQ| = \\sqrt{9 + 9 + 4} = \\sqrt{22}, \\quad |PR| = \\sqrt{0 + 16 + 0} = 4$$
$$\\theta = \\cos^{-1}\\left(\\frac{12}{4\\sqrt{22}}\\right)$$`,
    formula: "$$\\vec{A} \\cdot \\vec{B} = |A||B|\\cos\\theta$$",
    quickCheck: "Find the dot product of (1, 2, 3) and (4, 5, 6)",
    quickCheckAnswer: "32",
    orderIndex: 1,
  });

  await storage.createLearnCard({
    topicId: vectors.id,
    title: "Skill 3: Find The Area In a Triangle Using The Cross Product",
    content: `The area of a triangle formed by vectors $\\vec{PQ}$ and $\\vec{PR}$ is:

$$\\text{Area} = \\frac{1}{2}|\\vec{PQ} \\times \\vec{PR}|$$

**Computing the cross product** using the determinant:

$$\\vec{PQ} \\times \\vec{PR} = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ PQ_x & PQ_y & PQ_z \\\\ PR_x & PR_y & PR_z \\end{vmatrix}$$

**Example:** $\\vec{PQ} = (3, 3, -2)$, $\\vec{PR} = (0, 4, 0)$

$$\\vec{PQ} \\times \\vec{PR} = \\hat{i}(3 \\cdot 0 - (-2) \\cdot 4) - \\hat{j}(3 \\cdot 0 - (-2) \\cdot 0) + \\hat{k}(3 \\cdot 4 - 3 \\cdot 0)$$
$$= (8, 0, 12)$$

$$|\\vec{PQ} \\times \\vec{PR}| = \\sqrt{64 + 0 + 144} = \\sqrt{208} = 4\\sqrt{13}$$

$$\\text{Area} = \\frac{1}{2}(4\\sqrt{13}) = 2\\sqrt{13}$$`,
    formula: "$$\\text{Area} = \\frac{1}{2}|\\vec{PQ} \\times \\vec{PR}|$$",
    quickCheck: "What is the magnitude of (8, 0, 12)?",
    quickCheckAnswer: "4sqrt(13)",
    orderIndex: 2,
  });

  await storage.createLearnCard({
    topicId: vectors.id,
    title: "Skill 4: Projections",
    content: `**Vector Projection** of $\\vec{u}$ onto $\\vec{v}$:

$$\\text{proj}_{\\vec{v}}\\vec{u} = \\frac{\\vec{u} \\cdot \\vec{v}}{||\\vec{v}||^2}\\vec{v}$$

**Scalar Projection** (component):

$$\\text{comp}_{\\vec{v}}\\vec{u} = \\frac{\\vec{u} \\cdot \\vec{v}}{||\\vec{v}||}$$

**Example:** Find the projection of $\\vec{PQ}$ onto $\\vec{PR}$

$\\vec{PQ} = (3, 3, -2)$, $\\vec{PR} = (0, 4, 0)$

**Step 1:** $\\vec{PQ} \\cdot \\vec{PR} = 12$, $|\\vec{PR}|^2 = 16$

**Step 2:** $\\text{proj}_{\\vec{PR}}\\vec{PQ} = \\frac{12}{16}(0, 4, 0) = \\frac{3}{4}(0, 4, 0) = (0, 3, 0)$

**Scalar projection:** $\\text{comp}_{\\vec{PR}}\\vec{PQ} = \\frac{12}{4} = 3$`,
    formula: "$$\\text{proj}_{\\vec{v}}\\vec{u} = \\frac{\\vec{u} \\cdot \\vec{v}}{||\\vec{v}||^2}\\vec{v}$$",
    quickCheck: "What is PQ dot PR if PQ = (3,3,-2) and PR = (0,4,0)?",
    quickCheckAnswer: "12",
    orderIndex: 3,
  });

  await storage.createLearnCard({
    topicId: vectors.id,
    title: "Skill 5: Vector Planes",
    content: `The equation of a plane through point $P_0(x_0, y_0, z_0)$ with normal vector $\\vec{n} = (a, b, c)$:

$$a(x - x_0) + b(y - y_0) + c(z - z_0) = 0$$

Or in standard form:

$$ax + by + cz = d$$

where $d = ax_0 + by_0 + cz_0$.

**Finding the normal vector:** The cross product of two vectors in the plane gives the normal:

$$\\vec{n} = \\vec{PQ} \\times \\vec{PR}$$

**Example:** Find the equation of the plane through $P(1, -1, 2)$ with $\\vec{PQ} = (3, 3, -2)$ and $\\vec{PR} = (0, 4, 0)$

$\\vec{n} = \\vec{PQ} \\times \\vec{PR} = (8, 0, 12)$

$$8(x - 1) + 0(y + 1) + 12(z - 2) = 0$$
$$8x + 12z = 32$$
$$2x + 3z = 8$$

**Distance from a point to a plane** $ax + by + cz = d$:

$$D = \\frac{|ax_1 + by_1 + cz_1 - d|}{\\sqrt{a^2 + b^2 + c^2}}$$`,
    formula: "$$a(x - x_0) + b(y - y_0) + c(z - z_0) = 0$$",
    quickCheck: "If n = (2, 3, 1) and P0 = (1, 0, 2), what is d in ax+by+cz=d?",
    quickCheckAnswer: "4",
    orderIndex: 4,
  });

  // Vector question templates
  await storage.createQuestionTemplate({
    topicId: vectors.id,
    templateText: "Find the dot product of $({a1}, {a2})$ and $({b1}, {b2})$.",
    solutionTemplate: "$\\vec{a} \\cdot \\vec{b} = {a1} \\cdot {b1} + {a2} \\cdot {b2} = {p1} + {p2} = {answer}$",
    answerType: "numeric",
    parameters: { a1: { min: 1, max: 8 }, a2: { min: 1, max: 8 }, b1: { min: 1, max: 8 }, b2: { min: 1, max: 8 } },
  });

  await storage.createQuestionTemplate({
    topicId: vectors.id,
    templateText: "Find the magnitude of vector $({a}, {b})$.",
    solutionTemplate: "$|\\vec{v}| = \\sqrt{{a}^2 + {b}^2} = \\sqrt{{a2} + {b2}} = {answer}$",
    answerType: "numeric",
    parameters: { a: { min: 1, max: 12 }, b: { min: 1, max: 12 } },
  });

  // ─── Section 2: Integration Fundamentals ──────────────────────────

  const intFundamentals = await storage.createTopic({
    courseId: calc2part1.id,
    name: "Integration Fundamentals",
    description: "Riemann sums, Fundamental Theorem of Calculus, and graphical connections",
    icon: "∫",
    orderIndex: 1,
  });

  await storage.createLearnCard({
    topicId: intFundamentals.id,
    title: "Skill 1: Using The Riemann Sum Formula",
    content: `A Riemann sum approximates $\\int_a^b f(x) \\, dx$ by dividing $[a,b]$ into $n$ subintervals of width $\\Delta x = \\frac{b-a}{n}$.

$$\\int_a^b f(x) \\, dx \\approx \\sum_{i=1}^{n} f(x_i^*) \\Delta x$$

**Left Riemann Sum:** $x_i^* = x_{i-1}$ (left endpoints)
$$L_n = \\sum_{i=0}^{n-1} f(x_i) \\Delta x$$

**Right Riemann Sum:** $x_i^* = x_i$ (right endpoints)
$$R_n = \\sum_{i=1}^{n} f(x_i) \\Delta x$$

where $x_i = a + i \\cdot \\Delta x$.

**Example:** Approximate $\\int_0^2 x^2 \\, dx$ with $n = 4$ (Left):

$\\Delta x = 0.5$, sample points: $0, 0.5, 1, 1.5$

$$L_4 = 0.5[f(0) + f(0.5) + f(1) + f(1.5)] = 0.5[0 + 0.25 + 1 + 2.25] = 1.75$$

**As $n \\to \\infty$, the Riemann sum becomes the exact integral:**
$$\\int_a^b f(x) \\, dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i^*) \\Delta x$$`,
    formula: "$$\\int_a^b f(x) \\, dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i^*) \\Delta x$$",
    quickCheck: "What is delta x for [0, 4] with n = 4?",
    quickCheckAnswer: "1",
    orderIndex: 0,
  });

  await storage.createLearnCard({
    topicId: intFundamentals.id,
    title: "Skill 2: Apply Part 1 of Fundamental Theorem of Calculus",
    content: `**FTC Part 1** connects integrals and derivatives:

If $F(x) = \\int_a^x f(t) \\, dt$, then:

$$F'(x) = f(x)$$

In other words, the derivative of an integral (with variable upper limit) gives back the original function.

**With chain rule:** If the upper limit is $g(x)$ instead of just $x$:

$$\\frac{d}{dx}\\int_a^{g(x)} f(t) \\, dt = f(g(x)) \\cdot g'(x)$$

**Example 1:** $\\frac{d}{dx}\\int_1^x t^3 \\, dt = x^3$

**Example 2:** $\\frac{d}{dx}\\int_0^{x^2} \\sin(t) \\, dt = \\sin(x^2) \\cdot 2x$

**Example 3:** $\\frac{d}{dx}\\int_x^5 e^t \\, dt = -\\frac{d}{dx}\\int_5^x e^t \\, dt = -e^x$

> Note: If $x$ is in the lower limit, flip the integral and negate.`,
    formula: "$$\\frac{d}{dx}\\int_a^x f(t) \\, dt = f(x)$$",
    quickCheck: "What is d/dx of integral from 1 to x of t^2 dt?",
    quickCheckAnswer: "x^2",
    orderIndex: 1,
  });

  await storage.createLearnCard({
    topicId: intFundamentals.id,
    title: "Skill 3: Apply Part 2 of Fundamental Theorem of Calculus",
    content: `**FTC Part 2** (Evaluation Theorem):

If $F'(x) = f(x)$ (i.e., $F$ is an antiderivative of $f$), then:

$$\\int_a^b f(x) \\, dx = F(b) - F(a)$$

**Steps:**
1. Find the antiderivative $F(x)$
2. Evaluate $F$ at the upper limit $b$
3. Evaluate $F$ at the lower limit $a$
4. Subtract: $F(b) - F(a)$

**Example 1:** $\\int_1^3 2x \\, dx$

$F(x) = x^2$, so $F(3) - F(1) = 9 - 1 = 8$

**Example 2:** $\\int_0^{\\pi} \\sin(x) \\, dx$

$F(x) = -\\cos(x)$, so $-\\cos(\\pi) - (-\\cos(0)) = 1 + 1 = 2$

**Example 3:** $\\int_1^e \\frac{1}{x} \\, dx$

$F(x) = \\ln(x)$, so $\\ln(e) - \\ln(1) = 1 - 0 = 1$`,
    formula: "$$\\int_a^b f(x) \\, dx = F(b) - F(a)$$",
    quickCheck: "Evaluate the integral of 3x^2 from 0 to 2",
    quickCheckAnswer: "8",
    orderIndex: 2,
  });

  await storage.createLearnCard({
    topicId: intFundamentals.id,
    title: "Skill 4: Relate Derivatives To Integrals Graphically",
    content: `The derivative and integral have a visual relationship on graphs:

**Key Relationships:**

1. **If $f(x)$ is positive** on $[a,b]$, then $\\int_a^b f(x) \\, dx > 0$ (area above x-axis)
2. **If $f(x)$ is negative** on $[a,b]$, then $\\int_a^b f(x) \\, dx < 0$ (area below x-axis)
3. **If $F(x) = \\int_a^x f(t) \\, dt$**, then:
   - $F$ is increasing where $f > 0$
   - $F$ is decreasing where $f < 0$
   - $F$ has a local max/min where $f$ changes sign

**Reading the graph of $f$ to sketch $F$:**
- Where $f(x) = 0$, $F$ has a horizontal tangent
- Where $f(x)$ is largest, $F$ is increasing fastest
- The signed area under $f$ from $a$ to $x$ gives $F(x) - F(a)$

**Example:** If $f(x) > 0$ on $(0, 3)$ and $f(x) < 0$ on $(3, 5)$, then $F(x) = \\int_0^x f(t) \\, dt$ increases on $(0,3)$, has a max at $x=3$, and decreases on $(3,5)$.`,
    formula: "$$F'(x) = f(x) \\implies F \\text{ increases where } f > 0$$",
    quickCheck: "If f(x) > 0 on [1,4], is the integral from 1 to 4 positive or negative?",
    quickCheckAnswer: "positive",
    orderIndex: 3,
  });

  // Integration Fundamentals question templates
  await storage.createQuestionTemplate({
    topicId: intFundamentals.id,
    templateText: "Evaluate the definite integral: $\\int_0^{b} {a}x \\, dx$",
    solutionTemplate: "$\\int {a}x \\, dx = \\frac{{a}x^2}{2}$\n\nEvaluate from $0$ to ${b}$: $\\frac{{a} \\cdot {b}^2}{2} - 0 = {answer}$",
    answerType: "numeric",
    parameters: { a: { min: 1, max: 6 }, b: { min: 1, max: 5 } },
  });

  await storage.createQuestionTemplate({
    topicId: intFundamentals.id,
    templateText: "Evaluate: $\\int_1^{b} {a}x^2 \\, dx$",
    solutionTemplate: "$\\int {a}x^2 \\, dx = \\frac{{a}x^3}{3}$\n\nEvaluate: $\\frac{{a} \\cdot {b}^3}{3} - \\frac{{a}}{3} = {answer}$",
    answerType: "numeric",
    parameters: { a: { min: 1, max: 4 }, b: { min: 2, max: 4 } },
  });

  // ─── Section 3: Integration Techniques ────────────────────────────

  const intTechniques = await storage.createTopic({
    courseId: calc2part1.id,
    name: "Integration Techniques",
    description: "u-substitution, integration by parts, trig integration, and partial fractions",
    icon: "∮",
    orderIndex: 2,
  });

  await storage.createLearnCard({
    topicId: intTechniques.id,
    title: "Skill 1: u Substitution",
    content: `U-substitution reverses the chain rule. Set $u = g(x)$, then $du = g'(x) \\, dx$:

$$\\int f(g(x)) \\cdot g'(x) \\, dx = \\int f(u) \\, du$$

**Steps:**
1. Choose $u$ (usually the "inner" function)
2. Find $du = g'(x) \\, dx$
3. Substitute $u$ and $du$ into the integral
4. Integrate in terms of $u$
5. Back-substitute to $x$

**Example 1:** $\\int 2x \\cos(x^2) \\, dx$

Let $u = x^2$, $du = 2x \\, dx$:
$$\\int \\cos(u) \\, du = \\sin(u) + C = \\sin(x^2) + C$$

**Example 2:** $\\int \\frac{3x^2}{x^3 + 1} \\, dx$

Let $u = x^3 + 1$, $du = 3x^2 \\, dx$:
$$\\int \\frac{du}{u} = \\ln|u| + C = \\ln|x^3 + 1| + C$$

**For definite integrals:** Change the limits when you substitute!
$$\\int_a^b f(g(x))g'(x) \\, dx = \\int_{g(a)}^{g(b)} f(u) \\, du$$`,
    formula: "$$\\int f(g(x)) \\cdot g'(x) \\, dx = \\int f(u) \\, du$$",
    quickCheck: "If u = x^2 + 1, what is du?",
    quickCheckAnswer: "2x dx",
    orderIndex: 0,
  });

  await storage.createLearnCard({
    topicId: intTechniques.id,
    title: "Skill 2: Integration by Parts",
    content: `Integration by parts comes from the product rule in reverse:

$$\\int u \\, dv = uv - \\int v \\, du$$

**LIATE Rule** for choosing $u$ (in order of priority):
- **L**ogarithmic: $\\ln(x)$
- **I**nverse trig: $\\arctan(x)$
- **A**lgebraic: $x^2, x$
- **T**rig: $\\sin(x), \\cos(x)$
- **E**xponential: $e^x$

**Example 1:** $\\int x e^x \\, dx$

Let $u = x$, $dv = e^x \\, dx$, then $du = dx$, $v = e^x$:
$$xe^x - \\int e^x \\, dx = xe^x - e^x + C$$

**Example 2:** $\\int x^2 \\sin(x) \\, dx$

Requires applying integration by parts **twice**. After first application with $u = x^2$, $dv = \\sin(x)dx$, you get another integral that needs IBP again.

**Tabular method** is useful for repeated applications.`,
    formula: "$$\\int u \\, dv = uv - \\int v \\, du$$",
    quickCheck: "In integration by parts for integral of x*cos(x) dx, what should u be?",
    quickCheckAnswer: "x",
    orderIndex: 1,
  });

  await storage.createLearnCard({
    topicId: intTechniques.id,
    title: "Skill 3: Trig Integration (Trig Substitution)",
    content: `## Inverse-Trig (Trig Sub) — The Plug-and-Play Process

### Step 1 — Choose the correct trig substitution (match the radical)

| If you see | Set | Identity used |
|---|---|---|
| $\\sqrt{a^2 - x^2}$ | $x = a\\sin\\theta$ | $1 - \\sin^2\\theta = \\cos^2\\theta$ |
| $\\sqrt{a^2 + x^2}$ | $x = a\\tan\\theta$ | $1 + \\tan^2\\theta = \\sec^2\\theta$ |
| $\\sqrt{x^2 - a^2}$ | $x = a\\sec\\theta$ | $\\sec^2\\theta - 1 = \\tan^2\\theta$ |

### Step 2 — Convert to a trig equation ($\\theta$ in terms of $x$)

From your substitution, isolate the trig function:
- If $x = a\\sin\\theta$ then $\\sin\\theta = \\frac{x}{a}$
- If $x = a\\tan\\theta$ then $\\tan\\theta = \\frac{x}{a}$
- If $x = a\\sec\\theta$ then $\\sec\\theta = \\frac{x}{a}$

### Step 3 — Differentiate to get $dx$

| Substitution | $\\frac{dx}{d\\theta}$ | $dx$ |
|---|---|---|
| $x = a\\sin\\theta$ | $a\\cos\\theta$ | $dx = a\\cos\\theta \\, d\\theta$ |
| $x = a\\tan\\theta$ | $a\\sec^2\\theta$ | $dx = a\\sec^2\\theta \\, d\\theta$ |
| $x = a\\sec\\theta$ | $a\\sec\\theta\\tan\\theta$ | $dx = a\\sec\\theta\\tan\\theta \\, d\\theta$ |

### Step 4 — Write $\\theta$ explicitly (inverse trig)

- $\\sin\\theta = \\frac{x}{a} \\implies \\theta = \\arcsin\\left(\\frac{x}{a}\\right)$
- $\\tan\\theta = \\frac{x}{a} \\implies \\theta = \\arctan\\left(\\frac{x}{a}\\right)$
- $\\sec\\theta = \\frac{x}{a} \\implies \\theta = \\text{arcsec}\\left(\\frac{x}{a}\\right)$

### Step 5 — Substitute $x$, $dx$, and the radical into the integral

Replace everything with trig expressions in $\\theta$.

### Step 6 — Simplify using identities

Common simplification for $\\sqrt{a^2 - x^2}$ with $x = a\\sin\\theta$:

$$\\sqrt{a^2 - x^2} = \\sqrt{a^2 - a^2\\sin^2\\theta} = a\\sqrt{1 - \\sin^2\\theta} = a\\cos\\theta$$

Useful rewrite: $\\cot^2\\theta = \\csc^2\\theta - 1$

### Step 7 — Integrate in $\\theta$

Do the trig integral.

### Step 8 — Draw the triangle and convert back to $x$

Use the trig equation from Step 2 to build a right triangle:

| If | opp | adj | hyp |
|---|---|---|---|
| $\\sin\\theta = \\frac{x}{a}$ | $x$ | $\\sqrt{a^2 - x^2}$ | $a$ |
| $\\tan\\theta = \\frac{x}{a}$ | $x$ | $a$ | $\\sqrt{a^2 + x^2}$ |
| $\\sec\\theta = \\frac{x}{a}$ | $\\sqrt{x^2 - a^2}$ | $a$ | $x$ |

### Step 9 — Substitute back to $x$ (final answer)

---

## Worked Example: $\\int \\frac{\\sqrt{9 - x^2}}{x^2} \\, dx$

**Step 1:** Radical is $\\sqrt{9 - x^2}$ which matches $\\sqrt{a^2 - x^2}$ with $a = 3$. Set $x = 3\\sin\\theta$.

**Step 2:** $\\sin\\theta = \\frac{x}{3}$

**Step 3:** $dx = 3\\cos\\theta \\, d\\theta$

**Step 4:** $\\theta = \\arcsin\\left(\\frac{x}{3}\\right)$

**Step 5:** Simplify the radical:
$$\\sqrt{9 - x^2} = \\sqrt{9 - 9\\sin^2\\theta} = 3\\cos\\theta$$

Also $x^2 = 9\\sin^2\\theta$. Substitute:

$$\\int \\frac{3\\cos\\theta}{9\\sin^2\\theta}(3\\cos\\theta \\, d\\theta)$$

**Step 6:** Simplify:
$$= \\int \\frac{9\\cos^2\\theta}{9\\sin^2\\theta} \\, d\\theta = \\int \\frac{\\cos^2\\theta}{\\sin^2\\theta} \\, d\\theta = \\int \\cot^2\\theta \\, d\\theta$$

Use $\\cot^2\\theta = \\csc^2\\theta - 1$:
$$= \\int (\\csc^2\\theta - 1) \\, d\\theta$$

**Step 7:** Integrate:
$$= -\\cot\\theta - \\theta + C$$

**Step 8:** From $\\sin\\theta = \\frac{x}{3}$: opp $= x$, hyp $= 3$, adj $= \\sqrt{9 - x^2}$

$$\\cot\\theta = \\frac{\\text{adj}}{\\text{opp}} = \\frac{\\sqrt{9 - x^2}}{x}$$

**Step 9:** Final answer:
$$\\int \\frac{\\sqrt{9 - x^2}}{x^2} \\, dx = -\\frac{\\sqrt{9 - x^2}}{x} - \\arcsin\\left(\\frac{x}{3}\\right) + C$$`,
    formula: "$$\\sqrt{a^2 - x^2} \\to x = a\\sin\\theta, \\quad \\sqrt{a^2 + x^2} \\to x = a\\tan\\theta, \\quad \\sqrt{x^2 - a^2} \\to x = a\\sec\\theta$$",
    quickCheck: "For sqrt(9 + x^2), what substitution do you use?",
    quickCheckAnswer: "x = 3tan(theta)",
    orderIndex: 2,
  });

  await storage.createLearnCard({
    topicId: intTechniques.id,
    title: "Skill 4: Partial Fractions",
    content: `For rational functions $\\frac{P(x)}{Q(x)}$ where $\\deg(P) < \\deg(Q)$, decompose into simpler fractions:

**Distinct linear factors:**
$$\\frac{1}{(x-a)(x-b)} = \\frac{A}{x-a} + \\frac{B}{x-b}$$

**Repeated linear factor:**
$$\\frac{1}{(x-a)^2} = \\frac{A}{x-a} + \\frac{B}{(x-a)^2}$$

**Irreducible quadratic factor:**
$$\\frac{1}{(x-a)(x^2+1)} = \\frac{A}{x-a} + \\frac{Bx+C}{x^2+1}$$

**Example:** $\\int \\frac{1}{x^2 - 1} \\, dx = \\int \\frac{1}{(x-1)(x+1)} \\, dx$

$$\\frac{1}{(x-1)(x+1)} = \\frac{A}{x-1} + \\frac{B}{x+1}$$

Multiply both sides by $(x-1)(x+1)$: $1 = A(x+1) + B(x-1)$

Set $x = 1$: $1 = 2A \\implies A = \\frac{1}{2}$
Set $x = -1$: $1 = -2B \\implies B = -\\frac{1}{2}$

$$= \\frac{1}{2}\\ln|x-1| - \\frac{1}{2}\\ln|x+1| + C$$`,
    formula: "$$\\frac{P(x)}{Q(x)} = \\frac{A}{x-a} + \\frac{B}{x-b} + \\cdots$$",
    quickCheck: "Decompose 1/((x-1)(x+1)): what is A?",
    quickCheckAnswer: "1/2",
    orderIndex: 3,
  });

  // Integration Techniques question templates
  await storage.createQuestionTemplate({
    topicId: intTechniques.id,
    templateText: "Using integration by parts, evaluate $\\int_0^1 {a}x e^x \\, dx$.",
    solutionTemplate: "Let $u = {a}x$, $dv = e^x dx$, then $du = {a}dx$, $v = e^x$\n\n$= {a}xe^x - {a}e^x \\Big|_0^1 = ({a}e - {a}e) - (0 - {a}) = {answer}$",
    answerType: "numeric",
    parameters: { a: { min: 1, max: 5 } },
  });

  // ─── Section 4: Approximations ────────────────────────────────────

  const approx = await storage.createTopic({
    courseId: calc2part1.id,
    name: "Approximations",
    description: "Midpoint, Simpson's, and trapezoidal approximation methods",
    icon: "≈",
    orderIndex: 3,
  });

  await storage.createLearnCard({
    topicId: approx.id,
    title: "Skill 1: Midpoint Approximation",
    content: `The midpoint rule uses the function value at the center of each subinterval:

$$M_n = \\sum_{i=1}^{n} f(\\bar{x}_i) \\Delta x$$

where $\\bar{x}_i = \\frac{x_{i-1} + x_i}{2}$ is the midpoint and $\\Delta x = \\frac{b-a}{n}$.

**Steps:**
1. Compute $\\Delta x = \\frac{b-a}{n}$
2. Find the midpoints: $\\bar{x}_i = a + (i - \\frac{1}{2})\\Delta x$
3. Evaluate $f$ at each midpoint
4. Sum: $M_n = \\Delta x \\cdot [f(\\bar{x}_1) + f(\\bar{x}_2) + \\cdots + f(\\bar{x}_n)]$

**Example:** Approximate $\\int_0^2 x^2 \\, dx$ with $n = 4$:

$\\Delta x = 0.5$, midpoints: $0.25, 0.75, 1.25, 1.75$

$$M_4 = 0.5[f(0.25) + f(0.75) + f(1.25) + f(1.75)]$$
$$= 0.5[0.0625 + 0.5625 + 1.5625 + 3.0625] = 0.5(5.25) = 2.625$$

(Exact answer: $\\frac{8}{3} \\approx 2.667$)

**Practice Problem:**

![Midpoint approximation example problem](/midpoint-example.png)`,
    formula: "$$M_n = \\Delta x \\sum_{i=1}^{n} f(\\bar{x}_i)$$",
    quickCheck: "What is the midpoint of the interval [1, 3]?",
    quickCheckAnswer: "2",
    orderIndex: 0,
  });

  await storage.createLearnCard({
    topicId: approx.id,
    title: "Skill 2: Simpson's Approximation",
    content: `Simpson's rule uses parabolas to approximate the curve. Requires $n$ to be **even**:

$$S_n = \\frac{\\Delta x}{3}[f(x_0) + 4f(x_1) + 2f(x_2) + 4f(x_3) + \\cdots + 4f(x_{n-1}) + f(x_n)]$$

**Coefficient pattern:** $1, 4, 2, 4, 2, \\ldots, 4, 1$

**Steps:**
1. Compute $\\Delta x = \\frac{b-a}{n}$ (make sure $n$ is even)
2. Find all sample points $x_0, x_1, \\ldots, x_n$
3. Apply alternating coefficients: $1, 4, 2, 4, 2, \\ldots, 4, 1$
4. Multiply sum by $\\frac{\\Delta x}{3}$

**Example:** Approximate $\\int_0^2 x^2 \\, dx$ with $n = 4$:

$$S_4 = \\frac{0.5}{3}[f(0) + 4f(0.5) + 2f(1) + 4f(1.5) + f(2)]$$
$$= \\frac{0.5}{3}[0 + 4(0.25) + 2(1) + 4(2.25) + 4]$$
$$= \\frac{0.5}{3}[0 + 1 + 2 + 9 + 4] = \\frac{0.5}{3}(16) = \\frac{8}{3}$$

> Simpson's rule gives the **exact** answer for polynomials of degree $\\leq 3$.`,
    formula: "$$S_n = \\frac{\\Delta x}{3}[f(x_0) + 4f(x_1) + 2f(x_2) + \\cdots + 4f(x_{n-1}) + f(x_n)]$$",
    quickCheck: "Must n be even or odd for Simpson's rule?",
    quickCheckAnswer: "even",
    orderIndex: 1,
  });

  await storage.createLearnCard({
    topicId: approx.id,
    title: "Skill 3: Trapezoidal Approximation",
    content: `The trapezoidal rule approximates the area using trapezoids:

$$T_n = \\frac{\\Delta x}{2}[f(x_0) + 2f(x_1) + 2f(x_2) + \\cdots + 2f(x_{n-1}) + f(x_n)]$$

**Coefficient pattern:** First and last get $1$, all middle terms get $2$.

**Steps:**
1. Compute $\\Delta x = \\frac{b-a}{n}$
2. Find all sample points $x_0, x_1, \\ldots, x_n$
3. Evaluate $f$ at each point
4. Apply: first + last get coefficient 1, all others get coefficient 2
5. Multiply by $\\frac{\\Delta x}{2}$

**Example:** Approximate $\\int_0^2 x^2 \\, dx$ with $n = 4$:

$\\Delta x = 0.5$, points: $0, 0.5, 1, 1.5, 2$

$$T_4 = \\frac{0.5}{2}[f(0) + 2f(0.5) + 2f(1) + 2f(1.5) + f(2)]$$
$$= 0.25[0 + 2(0.25) + 2(1) + 2(2.25) + 4]$$
$$= 0.25[0 + 0.5 + 2 + 4.5 + 4] = 0.25(11) = 2.75$$

(Exact answer: $\\frac{8}{3} \\approx 2.667$)

**Error comparison:** Generally, Midpoint is more accurate than Trapezoidal, and Simpson's is the most accurate.`,
    formula: "$$T_n = \\frac{\\Delta x}{2}[f(x_0) + 2f(x_1) + \\cdots + 2f(x_{n-1}) + f(x_n)]$$",
    quickCheck: "In the trapezoidal rule, what coefficient do the middle terms get?",
    quickCheckAnswer: "2",
    orderIndex: 2,
  });

  // Approximations question templates
  await storage.createQuestionTemplate({
    topicId: approx.id,
    templateText: "Using the Midpoint Rule with $n = {n}$, approximate $\\int_0^{b} x \\, dx$.",
    solutionTemplate: "$\\Delta x = \\frac{{b}}{{n}}$\n\nMidpoints evaluated and summed.\n\nAnswer: ${answer}$",
    answerType: "numeric",
    parameters: { n: { min: 2, max: 6 }, b: { min: 2, max: 6 } },
  });

  // ─── Calculus II Part 2 (Locked / Coming Soon) ──────────────────

  const calc2part2 = await storage.createCourse({
    name: "Calculus II Part 2",
    description: "Polar coordinates, complex numbers, integral applications, arc length, and improper integrals",
    icon: "📏",
    orderIndex: 1,
    locked: true,
  });

  await storage.createTopic({
    courseId: calc2part2.id,
    name: "Polar Coordinates",
    description: "Polar curves, area, and conversion between coordinate systems",
    icon: "🎯",
    orderIndex: 0,
  });

  await storage.createTopic({
    courseId: calc2part2.id,
    name: "Complex Numbers",
    description: "Complex arithmetic, polar form, Euler's formula, and De Moivre's theorem",
    icon: "ℂ",
    orderIndex: 1,
  });

  await storage.createTopic({
    courseId: calc2part2.id,
    name: "Integral Applications (Slicing & Shells)",
    description: "Volume by disk, washer, and shell methods",
    icon: "🔄",
    orderIndex: 2,
  });

  await storage.createTopic({
    courseId: calc2part2.id,
    name: "Arc Length & Surface Area",
    description: "Computing arc length and surface area of revolution",
    icon: "📐",
    orderIndex: 3,
  });

  await storage.createTopic({
    courseId: calc2part2.id,
    name: "Improper Integrals",
    description: "Convergence, divergence, and evaluation of improper integrals",
    icon: "∞",
    orderIndex: 4,
  });

  console.log("Database seeded with Calc 2 Part 1 & Part 2 content!");
}
