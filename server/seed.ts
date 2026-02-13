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

  await storage.createLearnCard({ topicId: calculusTopic.id, title: "What is a Limit?", content: "A limit describes the value a function approaches as the input approaches some value. Formally:\n\nlim (x -> a) f(x) = L\n\nmeans that f(x) gets arbitrarily close to L as x gets close to a.\n\nKey insight: The limit may exist even if f(a) is undefined. For example, lim (x -> 0) sin(x)/x = 1, even though sin(0)/0 is undefined.", quickCheck: "What is lim (x -> 0) sin(x)/x?", quickCheckAnswer: "1", orderIndex: 0 });
  await storage.createLearnCard({ topicId: calculusTopic.id, title: "Derivative Definition", content: "The derivative of f at point a is defined as:\n\nf'(a) = lim (h -> 0) [f(a+h) - f(a)] / h\n\nThis represents the instantaneous rate of change of f at a, or equivalently, the slope of the tangent line to the graph at x = a.\n\nCommon derivatives:\n- d/dx [x^n] = n*x^(n-1)  (Power Rule)\n- d/dx [sin(x)] = cos(x)\n- d/dx [e^x] = e^x", quickCheck: "What is the derivative of x^3?", quickCheckAnswer: "3x^2", orderIndex: 1 });
  await storage.createLearnCard({ topicId: calculusTopic.id, title: "Chain Rule", content: "The chain rule is used to differentiate composite functions:\n\nIf y = f(g(x)), then dy/dx = f'(g(x)) * g'(x)\n\nThink of it as: \"derivative of the outside times derivative of the inside.\"\n\nExample: d/dx [sin(x^2)] = cos(x^2) * 2x", quickCheck: "What is d/dx [e^(3x)]?", quickCheckAnswer: "3e^(3x)", orderIndex: 2 });
  await storage.createLearnCard({ topicId: calculusTopic.id, title: "Definite Integrals", content: "The definite integral from a to b of f(x) dx represents the net signed area between f(x) and the x-axis from x = a to x = b.\n\nFundamental Theorem of Calculus:\nIf F'(x) = f(x), then integral from a to b of f(x) dx = F(b) - F(a)\n\nBasic rules:\n- integral of x^n dx = x^(n+1)/(n+1) + C\n- integral of e^x dx = e^x + C\n- integral of 1/x dx = ln|x| + C", quickCheck: "What is the integral of 2x dx?", quickCheckAnswer: "x^2 + C", orderIndex: 3 });

  await storage.createLearnCard({ topicId: physicsTopic.id, title: "Newton's First Law", content: "An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an unbalanced force.\n\nThis is also called the Law of Inertia. Inertia is the tendency of an object to resist changes in its state of motion.\n\nKey point: If the net force on an object is zero, its velocity does not change.", quickCheck: "What happens to a moving object if no net force acts on it?", quickCheckAnswer: "It continues moving at constant velocity", orderIndex: 0 });
  await storage.createLearnCard({ topicId: physicsTopic.id, title: "Newton's Second Law", content: "The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass:\n\nF = ma\n\nwhere F is force (Newtons), m is mass (kg), and a is acceleration (m/s^2).\n\nThis is the most important equation in classical mechanics. It tells us how forces cause changes in motion.", quickCheck: "If F = 10N and m = 2kg, what is a?", quickCheckAnswer: "5", orderIndex: 1 });
  await storage.createLearnCard({ topicId: physicsTopic.id, title: "Kinematics Equations", content: "The four kinematic equations for constant acceleration:\n\n1. v = v0 + at\n2. x = x0 + v0*t + (1/2)*a*t^2\n3. v^2 = v0^2 + 2*a*(x - x0)\n4. x = x0 + (v + v0)/2 * t\n\nwhere v0 is initial velocity, v is final velocity, a is acceleration, t is time, x0 is initial position, x is final position.", quickCheck: "If v0 = 0, a = 10 m/s^2, and t = 3s, what is v?", quickCheckAnswer: "30", orderIndex: 2 });

  await storage.createLearnCard({ topicId: linearAlgTopic.id, title: "Vectors", content: "A vector is a quantity with both magnitude and direction. In 2D:\n\nv = (v1, v2) or v = v1*i + v2*j\n\nVector operations:\n- Addition: (a1,a2) + (b1,b2) = (a1+b1, a2+b2)\n- Scalar multiplication: c*(a1,a2) = (c*a1, c*a2)\n- Magnitude: |v| = sqrt(v1^2 + v2^2)\n- Dot product: a . b = a1*b1 + a2*b2", quickCheck: "What is the magnitude of vector (3, 4)?", quickCheckAnswer: "5", orderIndex: 0 });
  await storage.createLearnCard({ topicId: linearAlgTopic.id, title: "Matrix Multiplication", content: "To multiply matrices A (m x n) and B (n x p), the element in row i, column j of AB is:\n\n(AB)ij = sum of A(i,k) * B(k,j) for k = 1 to n\n\nImportant: AB is not necessarily equal to BA. Matrix multiplication is not commutative!\n\nThe resulting matrix AB has dimensions m x p.", quickCheck: "If A is 2x3 and B is 3x4, what size is AB?", quickCheckAnswer: "2x4", orderIndex: 1 });

  await storage.createLearnCard({ topicId: chemTopic.id, title: "Atomic Structure", content: "Atoms consist of:\n- Protons (positive charge) in the nucleus\n- Neutrons (no charge) in the nucleus\n- Electrons (negative charge) orbiting the nucleus\n\nAtomic number (Z) = number of protons\nMass number (A) = protons + neutrons\n\nElectron configuration follows:\n1. Aufbau principle (fill lowest energy first)\n2. Pauli exclusion (max 2 electrons per orbital)\n3. Hund's rule (fill orbitals singly first)", quickCheck: "How many protons does Carbon (Z=6) have?", quickCheckAnswer: "6", orderIndex: 0 });
  await storage.createLearnCard({ topicId: chemTopic.id, title: "Stoichiometry", content: "Stoichiometry relates quantities in chemical reactions using balanced equations.\n\nKey concepts:\n- Molar mass: mass of one mole of a substance (g/mol)\n- Avogadro's number: 6.022 x 10^23 particles/mol\n- Mole ratios: from balanced equation coefficients\n\nProblem-solving steps:\n1. Write and balance the equation\n2. Convert given quantity to moles\n3. Use mole ratio to find moles of desired substance\n4. Convert moles to desired units", quickCheck: "How many particles are in 1 mole?", quickCheckAnswer: "6.022 x 10^23", orderIndex: 1 });

  await storage.createLearnCard({ topicId: progTopic.id, title: "Variables and Types", content: "Variables store data in a program. Common data types:\n\n- int: whole numbers (42, -7)\n- float/double: decimal numbers (3.14)\n- string: text (\"hello\")\n- boolean: true/false\n\nVariable declaration in many languages:\nint age = 21;\nstring name = \"Alice\";\nbool isStudent = true;\n\nVariables should have descriptive names that indicate their purpose.", quickCheck: "What data type would you use for 3.14?", quickCheckAnswer: "float", orderIndex: 0 });
  await storage.createLearnCard({ topicId: progTopic.id, title: "Loops", content: "Loops repeat code blocks:\n\nFor loop: when you know how many times to repeat\nfor (int i = 0; i < 10; i++) { ... }\n\nWhile loop: when you repeat until a condition is false\nwhile (condition) { ... }\n\nDo-while: executes at least once\ndo { ... } while (condition);\n\nCommon patterns:\n- Counting from 0 to n-1\n- Processing each element in a collection\n- Repeating until user input is valid", quickCheck: "How many times does 'for(i=0; i<5; i++)' execute?", quickCheckAnswer: "5", orderIndex: 1 });

  await storage.createQuestionTemplate({ topicId: calculusTopic.id, templateText: "Find the derivative of f(x) = {a}x^{n}.", solutionTemplate: "Using the power rule: d/dx [{a}x^{n}] = {a} * {n} * x^({n}-1) = {answer}x^{nm1}", answerType: "text", parameters: { a: { min: 2, max: 10 }, n: { min: 2, max: 5 } } });
  await storage.createQuestionTemplate({ topicId: calculusTopic.id, templateText: "Evaluate the definite integral from 0 to {b} of {a}x dx.", solutionTemplate: "integral of {a}x dx = {a}x^2/2\nEvaluate from 0 to {b}: {a}*{b}^2/2 - 0 = {answer}", answerType: "numeric", parameters: { a: { min: 1, max: 6 }, b: { min: 1, max: 5 } } });
  await storage.createQuestionTemplate({ topicId: calculusTopic.id, templateText: "Find the limit: lim (x -> {a}) ({a2}x + {b}).", solutionTemplate: "Since this is a polynomial (continuous everywhere), we can directly substitute:\nlim (x -> {a}) ({a2}x + {b}) = {a2}*{a} + {b} = {answer}", answerType: "numeric", parameters: { a: { min: 1, max: 5 }, a2: { min: 2, max: 8 }, b: { min: 1, max: 10 } } });

  await storage.createQuestionTemplate({ topicId: physicsTopic.id, templateText: "A {m} kg object has a force of {f} N applied to it. What is the acceleration?", solutionTemplate: "Using Newton's Second Law: F = ma\na = F/m = {f}/{m} = {answer} m/s^2", answerType: "numeric", parameters: { m: { min: 2, max: 20 }, f: { min: 10, max: 100 } } });
  await storage.createQuestionTemplate({ topicId: physicsTopic.id, templateText: "An object starts from rest and accelerates at {a} m/s^2 for {t} seconds. What is its final velocity?", solutionTemplate: "Using v = v0 + at\nv0 = 0 (starts from rest)\nv = 0 + {a} * {t} = {answer} m/s", answerType: "numeric", parameters: { a: { min: 2, max: 10 }, t: { min: 2, max: 10 } } });

  await storage.createQuestionTemplate({ topicId: linearAlgTopic.id, templateText: "Find the magnitude of vector ({a}, {b}).", solutionTemplate: "Magnitude = sqrt({a}^2 + {b}^2) = sqrt({a2} + {b2}) = {answer}", answerType: "numeric", parameters: { a: { min: 1, max: 12 }, b: { min: 1, max: 12 } } });
  await storage.createQuestionTemplate({ topicId: linearAlgTopic.id, templateText: "Find the dot product of vectors ({a1}, {a2}) and ({b1}, {b2}).", solutionTemplate: "Dot product = {a1}*{b1} + {a2}*{b2} = {p1} + {p2} = {answer}", answerType: "numeric", parameters: { a1: { min: 1, max: 8 }, a2: { min: 1, max: 8 }, b1: { min: 1, max: 8 }, b2: { min: 1, max: 8 } } });

  await storage.createQuestionTemplate({ topicId: chemTopic.id, templateText: "An element has {p} protons and {n} neutrons. What is its mass number?", solutionTemplate: "Mass number (A) = protons + neutrons = {p} + {n} = {answer}", answerType: "numeric", parameters: { p: { min: 1, max: 30 }, n: { min: 1, max: 30 } } });
  await storage.createQuestionTemplate({ topicId: chemTopic.id, templateText: "How many moles are in {g} grams of a substance with molar mass {mm} g/mol?", solutionTemplate: "Moles = mass / molar mass = {g} / {mm} = {answer} mol", answerType: "numeric", parameters: { g: { min: 10, max: 100 }, mm: { min: 10, max: 60 } } });

  await storage.createQuestionTemplate({ topicId: progTopic.id, templateText: "What is the output of: for(int i = 0; i < {n}; i++) sum += {a}; if sum starts at 0?", solutionTemplate: "The loop runs {n} times, each time adding {a} to sum.\nsum = {n} * {a} = {answer}", answerType: "numeric", parameters: { n: { min: 2, max: 10 }, a: { min: 1, max: 10 } } });

  console.log("Database seeded successfully!");
}
