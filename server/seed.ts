import { storage } from "./storage";

export async function seedDatabase() {
  const topicCount = await storage.getTopicCount();
  if (topicCount > 0) return;

  console.log("Seeding database with initial data...");

  const calculusTopic = await storage.createTopic({
    name: "Calculus I",
    description: "Limits, derivatives, and integrals for single-variable functions",
    icon: "f(x)",
    orderIndex: 0,
  });

  const physicsTopic = await storage.createTopic({
    name: "Physics - Mechanics",
    description: "Newton's laws, kinematics, energy, and momentum",
    icon: "F=ma",
    orderIndex: 1,
  });

  const linearAlgTopic = await storage.createTopic({
    name: "Linear Algebra",
    description: "Vectors, matrices, determinants, and linear transformations",
    icon: "[M]",
    orderIndex: 2,
  });

  const chemTopic = await storage.createTopic({
    name: "Chemistry",
    description: "Atomic structure, bonding, stoichiometry, and thermochemistry",
    icon: "H2O",
    orderIndex: 3,
  });

  const progTopic = await storage.createTopic({
    name: "Programming Fundamentals",
    description: "Variables, loops, functions, and basic data structures",
    icon: "</>",
    orderIndex: 4,
  });

  await storage.createLearnCard({ topicId: calculusTopic.id, title: "What is a Limit?", content: `A limit describes the value a function approaches as the input approaches some value. Formally:

$$\\lim_{x \\to a} f(x) = L$$

means that $f(x)$ gets arbitrarily close to $L$ as $x$ gets close to $a$.

**Key insight:** The limit may exist even if $f(a)$ is undefined. For example:

$$\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1$$

even though $\\frac{\\sin(0)}{0}$ is undefined.`, quickCheck: "What is lim (x -> 0) sin(x)/x?", quickCheckAnswer: "1", orderIndex: 0 });

  await storage.createLearnCard({ topicId: calculusTopic.id, title: "Derivative Definition", content: `The derivative of $f$ at point $a$ is defined as:

$$f'(a) = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}$$

This represents the **instantaneous rate of change** of $f$ at $a$, or equivalently, the slope of the tangent line to the graph at $x = a$.

### Common Derivatives

| Function | Derivative |
|---|---|
| $x^n$ | $nx^{n-1}$ (Power Rule) |
| $\\sin(x)$ | $\\cos(x)$ |
| $\\cos(x)$ | $-\\sin(x)$ |
| $e^x$ | $e^x$ |
| $\\ln(x)$ | $\\frac{1}{x}$ |`, quickCheck: "What is the derivative of x^3?", quickCheckAnswer: "3x^2", orderIndex: 1 });

  await storage.createLearnCard({ topicId: calculusTopic.id, title: "Chain Rule", content: `The chain rule is used to differentiate **composite functions**:

If $y = f(g(x))$, then:

$$\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$$

> Think of it as: "derivative of the outside times derivative of the inside."

**Example:**

$$\\frac{d}{dx}[\\sin(x^2)] = \\cos(x^2) \\cdot 2x$$`, quickCheck: "What is d/dx [e^(3x)]?", quickCheckAnswer: "3e^(3x)", orderIndex: 2 });

  await storage.createLearnCard({ topicId: calculusTopic.id, title: "Definite Integrals", content: `The definite integral represents the **net signed area** between $f(x)$ and the x-axis:

$$\\int_a^b f(x)\\,dx$$

### Fundamental Theorem of Calculus

If $F'(x) = f(x)$, then:

$$\\int_a^b f(x)\\,dx = F(b) - F(a)$$

### Basic Integration Rules

| Function | Integral |
|---|---|
| $x^n$ | $\\frac{x^{n+1}}{n+1} + C$ |
| $e^x$ | $e^x + C$ |
| $\\frac{1}{x}$ | $\\ln|x| + C$ |`, quickCheck: "What is the integral of 2x dx?", quickCheckAnswer: "x^2 + C", orderIndex: 3 });

  await storage.createLearnCard({ topicId: physicsTopic.id, title: "Newton's First Law", content: `An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, **unless acted upon by an unbalanced force**.

This is also called the **Law of Inertia**. Inertia is the tendency of an object to resist changes in its state of motion.

> If the net force on an object is zero, its velocity does not change: $\\sum \\vec{F} = 0 \\implies \\vec{v} = \\text{constant}$`, quickCheck: "What happens to a moving object if no net force acts on it?", quickCheckAnswer: "It continues moving at constant velocity", orderIndex: 0 });

  await storage.createLearnCard({ topicId: physicsTopic.id, title: "Newton's Second Law", content: `The acceleration of an object is directly proportional to the net force and inversely proportional to its mass:

$$\\vec{F} = m\\vec{a}$$

where:
- $F$ is force (Newtons, N)
- $m$ is mass (kg)
- $a$ is acceleration ($\\text{m/s}^2$)

This is the **most important equation** in classical mechanics. It tells us how forces cause changes in motion.`, quickCheck: "If F = 10N and m = 2kg, what is a?", quickCheckAnswer: "5", orderIndex: 1 });

  await storage.createLearnCard({ topicId: physicsTopic.id, title: "Kinematics Equations", content: `The four kinematic equations for **constant acceleration**:

1. $v = v_0 + at$
2. $x = x_0 + v_0 t + \\frac{1}{2}at^2$
3. $v^2 = v_0^2 + 2a(x - x_0)$
4. $x = x_0 + \\frac{v + v_0}{2} \\cdot t$

where:
- $v_0$ = initial velocity
- $v$ = final velocity
- $a$ = acceleration
- $t$ = time
- $x_0$, $x$ = initial and final position`, quickCheck: "If v0 = 0, a = 10 m/s^2, and t = 3s, what is v?", quickCheckAnswer: "30", orderIndex: 2 });

  await storage.createLearnCard({ topicId: linearAlgTopic.id, title: "Vectors", content: `A vector is a quantity with both **magnitude and direction**. In 2D:

$$\\vec{v} = (v_1, v_2) = v_1\\hat{i} + v_2\\hat{j}$$

### Vector Operations

| Operation | Formula |
|---|---|
| Addition | $(a_1, a_2) + (b_1, b_2) = (a_1+b_1, a_2+b_2)$ |
| Scalar mult. | $c \\cdot (a_1, a_2) = (ca_1, ca_2)$ |
| Magnitude | $|\\vec{v}| = \\sqrt{v_1^2 + v_2^2}$ |
| Dot product | $\\vec{a} \\cdot \\vec{b} = a_1 b_1 + a_2 b_2$ |`, quickCheck: "What is the magnitude of vector (3, 4)?", quickCheckAnswer: "5", orderIndex: 0 });

  await storage.createLearnCard({ topicId: linearAlgTopic.id, title: "Matrix Multiplication", content: `To multiply matrices $A$ ($m \\times n$) and $B$ ($n \\times p$), the element in row $i$, column $j$ of $AB$ is:

$$(AB)_{ij} = \\sum_{k=1}^{n} A_{ik} \\cdot B_{kj}$$

> **Important:** $AB \\neq BA$ in general. Matrix multiplication is **not commutative!**

The resulting matrix $AB$ has dimensions $m \\times p$.`, quickCheck: "If A is 2x3 and B is 3x4, what size is AB?", quickCheckAnswer: "2x4", orderIndex: 1 });

  await storage.createLearnCard({ topicId: chemTopic.id, title: "Atomic Structure", content: `Atoms consist of:
- **Protons** (positive charge) in the nucleus
- **Neutrons** (no charge) in the nucleus
- **Electrons** (negative charge) orbiting the nucleus

### Key Numbers
- **Atomic number** ($Z$) = number of protons
- **Mass number** ($A$) = protons + neutrons: $A = Z + N$

### Electron Configuration Rules
1. **Aufbau principle** - fill lowest energy first
2. **Pauli exclusion** - max 2 electrons per orbital
3. **Hund's rule** - fill orbitals singly first`, quickCheck: "How many protons does Carbon (Z=6) have?", quickCheckAnswer: "6", orderIndex: 0 });

  await storage.createLearnCard({ topicId: chemTopic.id, title: "Stoichiometry", content: `Stoichiometry relates quantities in chemical reactions using balanced equations.

### Key Concepts
- **Molar mass**: mass of one mole of a substance (g/mol)
- **Avogadro's number**: $6.022 \\times 10^{23}$ particles/mol
- **Mole ratios**: from balanced equation coefficients

### Problem-Solving Steps
1. Write and balance the equation
2. Convert given quantity to moles: $n = \\frac{m}{M}$
3. Use mole ratio to find moles of desired substance
4. Convert moles to desired units`, quickCheck: "How many particles are in 1 mole?", quickCheckAnswer: "6.022 x 10^23", orderIndex: 1 });

  await storage.createLearnCard({ topicId: progTopic.id, title: "Variables and Types", content: `Variables store data in a program. Common data types:

| Type | Description | Example |
|---|---|---|
| \`int\` | whole numbers | \`42\`, \`-7\` |
| \`float\`/\`double\` | decimal numbers | \`3.14\` |
| \`string\` | text | \`"hello"\` |
| \`boolean\` | true/false | \`true\` |

### Variable Declaration

\`\`\`
int age = 21;
string name = "Alice";
bool isStudent = true;
\`\`\`

Variables should have **descriptive names** that indicate their purpose.`, quickCheck: "What data type would you use for 3.14?", quickCheckAnswer: "float", orderIndex: 0 });

  await storage.createLearnCard({ topicId: progTopic.id, title: "Loops", content: `Loops repeat code blocks:

### For Loop
When you know how many times to repeat:
\`\`\`
for (int i = 0; i < 10; i++) {
    // runs 10 times
}
\`\`\`

### While Loop
Repeat until a condition is false:
\`\`\`
while (condition) {
    // runs until condition is false
}
\`\`\`

### Common Patterns
- Counting from $0$ to $n-1$
- Processing each element in a collection
- Repeating until user input is valid`, quickCheck: "How many times does 'for(i=0; i<5; i++)' execute?", quickCheckAnswer: "5", orderIndex: 1 });

  await storage.createQuestionTemplate({ topicId: calculusTopic.id, templateText: "Find the derivative of $f(x) = {a}x^{n}$.", solutionTemplate: "Using the power rule: $\\frac{d}{dx}[{a}x^{n}] = {a} \\cdot {n} \\cdot x^{n-1} = {answer}x^{nm1}$", answerType: "text", parameters: { a: { min: 2, max: 10 }, n: { min: 2, max: 5 } } });
  await storage.createQuestionTemplate({ topicId: calculusTopic.id, templateText: "Evaluate the definite integral: $\\int_0^{b} {a}x \\, dx$", solutionTemplate: "$\\int {a}x \\, dx = \\frac{{a}x^2}{2}$\n\nEvaluate from $0$ to ${b}$: $\\frac{{a} \\cdot {b}^2}{2} - 0 = {answer}$", answerType: "numeric", parameters: { a: { min: 1, max: 6 }, b: { min: 1, max: 5 } } });
  await storage.createQuestionTemplate({ topicId: calculusTopic.id, templateText: "Find the limit: $\\lim_{x \\to {a}} ({a2}x + {b})$", solutionTemplate: "Since this is a polynomial (continuous everywhere), we can directly substitute:\n\n$\\lim_{x \\to {a}} ({a2}x + {b}) = {a2} \\cdot {a} + {b} = {answer}$", answerType: "numeric", parameters: { a: { min: 1, max: 5 }, a2: { min: 2, max: 8 }, b: { min: 1, max: 10 } } });

  await storage.createQuestionTemplate({ topicId: physicsTopic.id, templateText: "A ${m}$ kg object has a force of ${f}$ N applied to it. What is the acceleration?", solutionTemplate: "Using Newton's Second Law: $F = ma$\n\n$a = \\frac{F}{m} = \\frac{{f}}{{m}} = {answer}$ m/s$^2$", answerType: "numeric", parameters: { m: { min: 2, max: 20 }, f: { min: 10, max: 100 } } });
  await storage.createQuestionTemplate({ topicId: physicsTopic.id, templateText: "An object starts from rest and accelerates at ${a}$ m/s$^2$ for ${t}$ seconds. What is its final velocity?", solutionTemplate: "Using $v = v_0 + at$\n\n$v_0 = 0$ (starts from rest)\n\n$v = 0 + {a} \\cdot {t} = {answer}$ m/s", answerType: "numeric", parameters: { a: { min: 2, max: 10 }, t: { min: 2, max: 10 } } });

  await storage.createQuestionTemplate({ topicId: linearAlgTopic.id, templateText: "Find the magnitude of vector $({a}, {b})$.", solutionTemplate: "$|\\vec{v}| = \\sqrt{{a}^2 + {b}^2} = \\sqrt{{a2} + {b2}} = {answer}$", answerType: "numeric", parameters: { a: { min: 1, max: 12 }, b: { min: 1, max: 12 } } });
  await storage.createQuestionTemplate({ topicId: linearAlgTopic.id, templateText: "Find the dot product of vectors $({a1}, {a2})$ and $({b1}, {b2})$.", solutionTemplate: "$\\vec{a} \\cdot \\vec{b} = {a1} \\cdot {b1} + {a2} \\cdot {b2} = {p1} + {p2} = {answer}$", answerType: "numeric", parameters: { a1: { min: 1, max: 8 }, a2: { min: 1, max: 8 }, b1: { min: 1, max: 8 }, b2: { min: 1, max: 8 } } });

  await storage.createQuestionTemplate({ topicId: chemTopic.id, templateText: "An element has ${p}$ protons and ${n}$ neutrons. What is its mass number?", solutionTemplate: "Mass number: $A = Z + N = {p} + {n} = {answer}$", answerType: "numeric", parameters: { p: { min: 1, max: 30 }, n: { min: 1, max: 30 } } });
  await storage.createQuestionTemplate({ topicId: chemTopic.id, templateText: "How many moles are in ${g}$ grams of a substance with molar mass ${mm}$ g/mol?", solutionTemplate: "$n = \\frac{m}{M} = \\frac{{g}}{{mm}} = {answer}$ mol", answerType: "numeric", parameters: { g: { min: 10, max: 100 }, mm: { min: 10, max: 60 } } });

  await storage.createQuestionTemplate({ topicId: progTopic.id, templateText: "What is the output of: `for(int i = 0; i < {n}; i++) sum += {a};` if sum starts at 0?", solutionTemplate: "The loop runs ${n}$ times, each time adding ${a}$ to sum.\n\n$\\text{sum} = {n} \\times {a} = {answer}$", answerType: "numeric", parameters: { n: { min: 2, max: 10 }, a: { min: 1, max: 10 } } });

  console.log("Database seeded successfully!");
}
