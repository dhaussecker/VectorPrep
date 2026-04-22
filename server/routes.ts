import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { seedDatabase } from "./seed";
import { supabaseAdmin } from "./supabase";
import { extractCourseStructure, generateSkillContent, chatRefineContent, generateStudyPlan } from "./deepseek";
import { searchYouTubeVideos } from "./youtube";
import type { User } from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(
  process.env.NODE_ENV === "production"
    ? "/tmp/uploads"
    : path.resolve(__dirname, "..", "client", "public", "uploads"),
);
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
  console.warn("Could not create uploads directory:", uploadsDir);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      cb(null, `${name}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.originalname)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const uploadDocs = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      cb(null, `${name}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(file.originalname)) cb(null, true);
    else cb(new Error("Only PDF and image files are allowed"));
  },
});

declare module "express-serve-static-core" {
  interface Request { user?: User; }
}

async function requireAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "Not authenticated" });
    const token = authHeader.slice(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(data.user.id);
    if (!user) return res.status(401).json({ message: "User profile not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }
}

async function requireAdmin(req: any, res: any, next: any) {
  await requireAuth(req, res, () => {
    const user = req.user as User;
    if (!user.isAdmin) return res.status(403).json({ message: "Admin access required" });
    next();
  });
}

function generateFromTemplate(template: { templateText: string; solutionTemplate: string; parameters: any }) {
  const params: Record<string, number> = {};
  const paramDefs = template.parameters as Record<string, any>;
  const fixedAnswer = paramDefs?._answer;
  const cleanDefs = { ...paramDefs };
  delete cleanDefs._answer;

  for (const [key, def] of Object.entries(cleanDefs)) {
    if (def && typeof def === "object" && "min" in def && "max" in def) {
      params[key] = Math.floor(Math.random() * (def.max - def.min + 1)) + def.min;
    }
  }

  let questionText = template.templateText;
  let solutionText = template.solutionTemplate;
  const computed: Record<string, number | string> = { ...params };
  const tpl = template.templateText;

  if (params.x1 !== undefined && params.y1 !== undefined && params.z1 !== undefined &&
      params.x2 !== undefined && params.y2 !== undefined && params.z2 !== undefined) {
    const dx = params.x2 - params.x1, dy = params.y2 - params.y1, dz = params.z2 - params.z1;
    computed.dx = dx; computed.dy = dy; computed.dz = dz;
    computed.dx2 = dx * dx; computed.dy2 = dy * dy; computed.dz2 = dz * dz;
    computed.sum = dx * dx + dy * dy + dz * dz;
    if (tpl.includes("distance") && !tpl.includes("plane"))
      computed.answer = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 100) / 100;
    if (tpl.includes("plane") && params.pa !== undefined && params.pb !== undefined && params.pc !== undefined && params.pd !== undefined) {
      const num = Math.abs(params.pa * params.x1 + params.pb * params.y1 + params.pc * params.z1 - params.pd);
      const den = Math.sqrt(params.pa * params.pa + params.pb * params.pb + params.pc * params.pc);
      computed.num = num; computed.den = Math.round(den * 100) / 100;
      computed.answer = Math.round((num / den) * 100) / 100;
    }
  }
  if (params.a1 !== undefined && params.a2 !== undefined && params.a3 !== undefined &&
      params.b1 !== undefined && params.b2 !== undefined && params.b3 !== undefined) {
    computed.dot = params.a1 * params.b1 + params.a2 * params.b2 + params.a3 * params.b3;
    computed.magA = Math.round(Math.sqrt(params.a1 ** 2 + params.a2 ** 2 + params.a3 ** 2) * 100) / 100;
    computed.magB = Math.round(Math.sqrt(params.b1 ** 2 + params.b2 ** 2 + params.b3 ** 2) * 100) / 100;
    if (tpl.includes("angle")) {
      const cosTheta = (computed.dot as number) / ((computed.magA as number) * (computed.magB as number));
      computed.answer = Math.round(Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180 / Math.PI * 100) / 100;
    } else if (tpl.includes("dot product")) computed.answer = computed.dot;
  } else if (params.a1 !== undefined && params.a2 !== undefined && params.b1 !== undefined && params.b2 !== undefined) {
    computed.p1 = params.a1 * params.b1; computed.p2 = params.a2 * params.b2;
    computed.answer = params.a1 * params.b1 + params.a2 * params.b2;
  }
  if (tpl.includes("ellipse") && params.a !== undefined && params.b !== undefined)
    computed.answer = Math.round(params.a * params.b * Math.PI * 100) / 100;
  else if (tpl.includes("plane") && params.pa !== undefined && params.pb !== undefined && params.pc !== undefined && params.pd !== undefined &&
      params.px !== undefined && params.py !== undefined && params.pz !== undefined) {
    const num = Math.abs(params.pa * params.px + params.pb * params.py + params.pc * params.pz - params.pd);
    const den = Math.sqrt(params.pa * params.pa + params.pb * params.pb + params.pc * params.pc);
    computed.num = num; computed.den = Math.round(den * 100) / 100;
    computed.answer = Math.round((num / den) * 100) / 100;
  } else if (tpl.includes("f(x)") && params.c !== undefined && params.n !== undefined) {
    computed.coeff = params.c * params.n; computed.nm1 = params.n - 1;
    computed.answer = `${params.c * params.n}x^${params.n - 1}`;
  } else if (tpl.includes("minimum") && params.a !== undefined && Object.keys(params).length === 1)
    computed.answer = params.a;
  else if (tpl.includes("F'(0)") || tpl.includes("F′(0)")) {
    if (params.k !== undefined) computed.answer = 0;
  }
  if (params.a !== undefined && params.n !== undefined && !tpl.includes("f(x)") && !tpl.includes("F'(0)")) {
    computed.answer = computed.answer ?? params.a * params.n;
    computed.nm1 = params.n - 1;
    if (tpl.includes("derivative")) computed.answer = `${params.a * params.n}`;
  }
  if (params.a !== undefined && params.b !== undefined && computed.answer === undefined) {
    if (tpl.includes("integral")) computed.answer = (params.a * params.b * params.b) / 2;
    else if (tpl.includes("magnitude")) {
      computed.a2 = params.a * params.a; computed.b2 = params.b * params.b;
      computed.answer = Math.round(Math.sqrt(params.a * params.a + params.b * params.b) * 100) / 100;
    }
  }
  if (params.a2 !== undefined && params.a !== undefined && params.b !== undefined && params.a3 === undefined)
    if (tpl.includes("limit")) computed.answer = (params.a2 as number) * params.a + params.b;
  if (params.m !== undefined && params.f !== undefined)
    computed.answer = Math.round((params.f / params.m) * 100) / 100;
  if (params.a !== undefined && params.t !== undefined && tpl.includes("velocity"))
    computed.answer = params.a * params.t;
  if (params.p !== undefined && params.n !== undefined && tpl.includes("mass number"))
    computed.answer = params.p + params.n;
  if (params.g !== undefined && params.mm !== undefined)
    computed.answer = Math.round((params.g / params.mm) * 100) / 100;
  if (params.n !== undefined && params.a !== undefined && tpl.includes("output"))
    computed.answer = params.n * params.a;

  for (const [key, val] of Object.entries(computed)) {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    questionText = questionText.replace(regex, String(val));
    solutionText = solutionText.replace(regex, String(val));
  }

  return {
    questionText,
    solutionSteps: solutionText,
    correctAnswer: String(computed.answer ?? fixedAnswer ?? ""),
    parameters: params,
  };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupAuth(app);
  await seedDatabase();

  // ─── Courses ──────────────────────────────────────────────────────

  app.get("/api/courses", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getCourses());
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Tools ────────────────────────────────────────────────────────

  app.get("/api/courses/:courseId/tools", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { courseId } = req.params;
      const course = await storage.getCourse(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      const courseTools = await storage.getToolsByCourse(courseId);

      const toolsWithProgress = await Promise.all(
        courseTools.map(async (tool) => {
          const content = await storage.getToolContent(tool.id);
          const contentProgress = await storage.getUserContentProgress(user.id, tool.id);
          const contentCompleted = contentProgress.filter((p) => p.completed).length;
          const contentPercent = content.length > 0 ? (contentCompleted / content.length) * 100 : 0;

          const toolTasks = await storage.getTasksByTool(tool.id);
          const taskProgress = await storage.getUserTaskProgress(user.id, tool.id);
          const tasksCompleted = taskProgress.filter((p) => p.completed).length;
          const taskPercent = toolTasks.length > 0 ? (tasksCompleted / toolTasks.length) * 100 : 0;

          const totalPercent = (contentPercent + taskPercent) / 2;

          return { tool, contentPercent, taskPercent, totalPercent, tasksCompleted, totalTasks: toolTasks.length };
        })
      );

      res.json({ course, tools: toolsWithProgress });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Progress Overview ────────────────────────────────────────────

  app.get("/api/progress/overview", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const allTools = await storage.getTools();

      const toolProgressList = await Promise.all(
        allTools.map(async (tool) => {
          const content = await storage.getToolContent(tool.id);
          const toolTasks = await storage.getTasksByTool(tool.id);
          const contentProgress = await storage.getUserContentProgress(user.id, tool.id);
          const taskProgress = await storage.getUserTaskProgress(user.id, tool.id);

          const contentCompleted = contentProgress.filter((p) => p.completed).length;
          const contentPercent = content.length > 0 ? (contentCompleted / content.length) * 100 : 0;
          const tasksCompleted = taskProgress.filter((p) => p.completed).length;
          const taskPercent = toolTasks.length > 0 ? (tasksCompleted / toolTasks.length) * 100 : 0;
          const totalPercent = (contentPercent + taskPercent) / 2;

          return { tool, contentPercent, taskPercent, totalPercent, contentCompleted, totalContent: content.length, tasksCompleted, totalTasks: toolTasks.length };
        })
      );

      const overall = toolProgressList.length > 0
        ? toolProgressList.reduce((sum, tp) => sum + tp.totalPercent, 0) / toolProgressList.length
        : 0;

      res.json({ overall, tools: toolProgressList });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── User Profile (XP/streak) ─────────────────────────────────────

  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      let profile = await storage.getUserProfile(user.id);
      if (!profile) profile = await storage.createUserProfile(user.id);
      const userBadges = await storage.getUserBadges(user.id);
      res.json({ ...profile, badges: userBadges });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/streak", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const profile = await storage.updateStreak(user.id);
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Learn (tool content) ─────────────────────────────────────────

  app.get("/api/learn/:toolId", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { toolId } = req.params;
      const tool = await storage.getTool(toolId);
      if (!tool) return res.status(404).json({ message: "Tool not found" });

      const content = await storage.getToolContent(toolId);
      const progress = await storage.getUserContentProgress(user.id, toolId);
      const progressMap = new Map(progress.map((p) => [p.contentId, p.completed]));

      res.json({ tool, content: content.map((c) => ({ ...c, completed: progressMap.get(c.id) ?? false })) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/learn/:toolId/complete", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { toolId } = req.params;
      const { contentId } = req.body;
      if (!contentId) return res.status(400).json({ message: "contentId is required" });
      await storage.markContentComplete(user.id, contentId, toolId);
      await storage.updateStreak(user.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Tasks ────────────────────────────────────────────────────────

  app.get("/api/tools/:toolId/tasks", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { toolId } = req.params;
      const toolTasks = await storage.getTasksByTool(toolId);
      const progress = await storage.getUserTaskProgress(user.id, toolId);
      const progressMap = new Map(progress.map((p) => [p.taskId, p.completed]));
      res.json(toolTasks.map((t) => ({ ...t, completed: progressMap.get(t.id) ?? false })));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tools/:toolId/tasks/:taskId/complete", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { toolId, taskId } = req.params;
      const task = await storage.getTask(taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });

      await storage.completeTask(user.id, taskId, toolId);
      const profile = await storage.awardXP(user.id, task.xp);
      await storage.updateStreak(user.id);

      // Badge: first task
      const allProgress = await storage.getUserTaskProgress(user.id, toolId);
      const completedCount = allProgress.filter((p) => p.completed).length;
      if (completedCount === 1) {
        await storage.addBadge(user.id, "First Step", "Completed your first task!", "zap");
      }

      res.json({ success: true, xpAwarded: task.xp, profile });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Practice (question templates) ───────────────────────────────

  app.get("/api/practice/:toolId/info", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { toolId } = req.params;
      const tool = await storage.getTool(toolId);
      if (!tool) return res.status(404).json({ message: "Tool not found" });
      const templates = await storage.getQuestionTemplatesByTool(toolId);
      const progress = await storage.getUserPracticeProgress(user.id, toolId);
      const practiceCorrect = progress.filter((p) => p.correct).length;
      const practicePercent = templates.length > 0 ? (practiceCorrect / templates.length) * 100 : 0;
      res.json({ tool, practicePercent });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/practice/:toolId/generate", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { toolId } = req.params;
      const { templateId } = req.body;

      let template;
      if (templateId) {
        template = await storage.getQuestionTemplate(templateId);
        if (template && template.toolId !== toolId) template = undefined;
      }
      if (!template) {
        const templates = await storage.getQuestionTemplatesByTool(toolId);
        if (templates.length === 0) return res.status(404).json({ message: "No question templates available" });
        template = templates[Math.floor(Math.random() * templates.length)];
      }

      const generated = generateFromTemplate(template);
      const attemptId = await storage.createPracticeAttempt(user.id, template.id, toolId, generated.questionText, generated.correctAnswer, generated.solutionSteps);
      res.json({ attemptId, templateId: template.id, questionText: generated.questionText });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/practice/:toolId/grade", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { toolId } = req.params;
      const { attemptId, answer, viewOnly, markMastered } = req.body;
      if (!attemptId) return res.status(400).json({ message: "Missing required fields" });

      const attempt = await storage.getPracticeAttempt(attemptId);
      if (!attempt) return res.status(404).json({ message: "Attempt not found" });
      if (attempt.userId !== user.id) return res.status(403).json({ message: "Forbidden" });

      if (viewOnly) return res.json({ correct: false, correctAnswer: attempt.correctAnswer, solutionSteps: attempt.solutionSteps });

      if (markMastered) {
        await storage.recordPracticeAttempt(user.id, attempt.templateId, toolId, true);
        await storage.awardXP(user.id, 15);
        return res.json({ correct: true, correctAnswer: attempt.correctAnswer, solutionSteps: attempt.solutionSteps });
      }

      const template = await storage.getQuestionTemplate(attempt.templateId);
      const userAns = String(answer).trim().toLowerCase();
      const correctAns = attempt.correctAnswer.trim().toLowerCase();
      let isCorrect = userAns === correctAns;

      if (!isCorrect && template?.answerType === "numeric") {
        const userNum = parseFloat(userAns), correctNum = parseFloat(correctAns);
        if (!isNaN(userNum) && !isNaN(correctNum)) isCorrect = Math.abs(userNum - correctNum) < 0.01;
      }

      await storage.recordPracticeAttempt(user.id, attempt.templateId, toolId, isCorrect);
      if (isCorrect) await storage.awardXP(user.id, 20);

      res.json({ correct: isCorrect, correctAnswer: attempt.correctAnswer, solutionSteps: attempt.solutionSteps });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Cheat Sheet ──────────────────────────────────────────────────

  app.get("/api/cheatsheet", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const courseId = req.query.courseId as string | undefined;
      let allTools = await storage.getTools();
      if (courseId) allTools = allTools.filter((t) => t.courseId === courseId);
      const userEntries = await storage.getCheatSheetEntries(user.id);

      const sections = await Promise.all(
        allTools.map(async (tool) => {
          const content = await storage.getToolContent(tool.id);
          const toolEntries = userEntries.filter((e) => e.toolId === tool.id);
          const groups: { contentId: string; contentTitle: string; formulas: { id: string; formula: string; source: "preset" | "user" }[] }[] = [];

          for (const item of content) {
            const formulas: { id: string; formula: string; source: "preset" | "user" }[] = [];
            if (item.formula) formulas.push({ id: `preset-${item.id}`, formula: item.formula, source: "preset" });
            for (const e of toolEntries.filter((e) => e.label === item.title))
              formulas.push({ id: e.id, formula: e.formula, source: "user" });
            if (formulas.length > 0) groups.push({ contentId: item.id, contentTitle: item.title, formulas });
          }

          const contentTitles = new Set(content.map((c) => c.title));
          const orphans = toolEntries.filter((e) => !contentTitles.has(e.label));
          if (orphans.length > 0)
            groups.push({ contentId: "custom", contentTitle: "Custom Formulas", formulas: orphans.map((e) => ({ id: e.id, formula: e.formula, source: "user" as const })) });

          return { tool, groups };
        })
      );
      res.json(sections);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/cheatsheet", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { toolId, formula, label } = req.body;
      if (!toolId || !formula || !label) return res.status(400).json({ message: "toolId, formula, and label are required" });
      const entry = await storage.addCheatSheetEntry({ userId: user.id, toolId, formula, label });
      res.json(entry);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/cheatsheet/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { formula } = req.body;
      if (!formula) return res.status(400).json({ message: "formula is required" });
      const updated = await storage.updateCheatSheetEntry(req.params.id, user.id, formula);
      if (!updated) return res.status(404).json({ message: "Entry not found" });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/cheatsheet/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const deleted = await storage.deleteCheatSheetEntry(req.params.id, user.id);
      if (!deleted) return res.status(404).json({ message: "Entry not found" });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Invite Codes ─────────────────────────────────────────────────

  app.get("/api/admin/invite-codes", requireAdmin, async (_req, res) => {
    try { res.json(await storage.listInviteCodes()); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/admin/invite-codes", requireAdmin, async (req, res) => {
    try {
      const num = Math.min(Math.max(parseInt(req.body.count) || 1, 1), 100);
      res.json(await storage.createInviteCodes(num));
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  // ─── Admin Upload ─────────────────────────────────────────────────

  app.post("/api/admin/upload", requireAdmin, upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // ─── AI Syllabus ──────────────────────────────────────────────────

  app.post("/api/admin/syllabus-analyze", requireAdmin, uploadDocs.array("files", 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ message: "No files provided" });

      const texts: string[] = [];
      const imageBase64s: string[] = [];

      for (const file of files) {
        if (/\.pdf$/i.test(file.originalname)) {
          const pdfParse = (await import("pdf-parse")).default;
          const buffer = fs.readFileSync(file.path);
          const pdfData = await pdfParse(buffer);
          texts.push(pdfData.text);
        } else {
          imageBase64s.push(fs.readFileSync(file.path).toString("base64"));
        }
        try { fs.unlinkSync(file.path); } catch {}
      }

      const structure = await extractCourseStructure(texts, imageBase64s);
      res.json({
        ...structure,
        tools: structure.topics.map((t: any) => ({ ...t, skills: (t.skills || []).map((s: any) => ({ title: s.title })) })),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to analyze syllabus" });
    }
  });

  app.post("/api/admin/syllabus-create", requireAdmin, async (req, res) => {
    try {
      const structure = req.body;
      if (!structure?.courseName || !Array.isArray(structure?.tools || structure?.topics)) {
        return res.status(400).json({ message: "Invalid course structure" });
      }

      const course = await storage.createCourse({
        name: structure.courseName,
        description: structure.courseDescription || "",
        icon: structure.courseIcon || "📚",
        color: structure.courseColor || "#22C55E",
        orderIndex: 0,
      });

      const items = structure.tools || structure.topics || [];
      const createdTools = [];
      for (let i = 0; i < items.length; i++) {
        const t = items[i];
        const tool = await storage.createTool({
          courseId: course.id,
          name: t.name,
          description: t.description || "",
          icon: t.icon || "📝",
          status: i === 0 ? "active" : "locked",
          orderIndex: i,
          xpReward: 100,
        });

        for (let si = 0; si < (t.skills || []).length; si++) {
          const skill = t.skills[si];
          await storage.createToolContent({
            toolId: tool.id,
            type: "text",
            title: skill.title,
            content: skill.content || "",
            orderIndex: si,
          });
        }

        createdTools.push(tool);
      }

      res.json({ course, toolCount: createdTools.length, tools: createdTools });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create course" });
    }
  });

  app.post("/api/admin/syllabus-generate-content", requireAdmin, async (req, res) => {
    try {
      const outline = req.body;
      if (!outline?.courseName || !Array.isArray(outline?.topics)) return res.status(400).json({ message: "Invalid outline" });

      const result = {
        ...outline,
        topics: await Promise.all(
          outline.topics.map(async (topic: any) => {
            const skillTitles = (topic.skills || []).map((s: any) => s.title);
            const skillsWithContent = await Promise.all(
              (topic.skills || []).map(async (skill: any) => {
                try {
                  let content = await generateSkillContent(outline.courseName, topic.name, skill.title, skillTitles.filter((t: string) => t !== skill.title));
                  const videos = await searchYouTubeVideos(`${skill.title} ${topic.name}`, 2);
                  if (videos.length > 0) {
                    content += "\n\n---\n\n**Tutorial Videos:**\n\n";
                    for (const v of videos) content += `${v.url}\n\n`;
                  }
                  return { title: skill.title, content };
                } catch {
                  return { title: skill.title, content: "*Content generation failed. You can edit it manually.*" };
                }
              }),
            );
            return { ...topic, skills: skillsWithContent };
          }),
        ),
      };

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to generate content" });
    }
  });

  app.post("/api/admin/ai-chat", requireAdmin, async (req, res) => {
    try {
      const { content, message, context } = req.body;
      if (!content || !message) return res.status(400).json({ message: "content and message are required" });
      res.json({ content: await chatRefineContent(content, message, context) });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "AI chat failed" });
    }
  });

  // ─── Study Plans ──────────────────────────────────────────────────

  app.post("/api/admin/study-plan/generate", requireAdmin, async (req, res) => {
    try {
      const { courseName, topics: topicList, totalDays } = req.body;
      if (!courseName || !topicList || !totalDays) return res.status(400).json({ message: "courseName, topics, and totalDays are required" });
      res.json({ plan: await generateStudyPlan(courseName, topicList, totalDays) });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to generate study plan" });
    }
  });

  app.post("/api/study-plans", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { courseId, totalDays, plan } = req.body;
      if (!courseId || !plan) return res.status(400).json({ message: "courseId and plan are required" });
      res.json(await storage.createStudyPlan({ courseId, userId: user.id, totalDays: totalDays || plan.length, plan }));
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to save study plan" });
    }
  });

  app.get("/api/study-plans/:courseId", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const studyPlan = await storage.getStudyPlan(user.id, req.params.courseId);
      if (!studyPlan) return res.status(404).json({ message: "No study plan found" });
      res.json(studyPlan);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch study plan" });
    }
  });

  // ─── Admin: Courses ───────────────────────────────────────────────

  app.get("/api/admin/courses", requireAdmin, async (_req, res) => {
    try { res.json(await storage.getCourses()); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/admin/courses", requireAdmin, async (req, res) => {
    try {
      const { name, description, icon, color, orderIndex, locked } = req.body;
      if (!name || !description) return res.status(400).json({ message: "Name and description are required" });
      res.json(await storage.createCourse({ name, description, icon: icon || "📚", color: color || "#22C55E", orderIndex: orderIndex ?? 0, locked: locked ?? false }));
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { name, description, icon, color, orderIndex, locked } = req.body;
      res.json(await storage.updateCourse(req.params.id, { name, description, icon, color, orderIndex, locked }));
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try { await storage.deleteCourse(req.params.id); res.json({ success: true }); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  // ─── Admin: Tools ─────────────────────────────────────────────────

  app.get("/api/admin/tools", requireAdmin, async (_req, res) => {
    try { res.json(await storage.getTools()); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/admin/tools", requireAdmin, async (req, res) => {
    try {
      const { name, description, icon, courseId, status, orderIndex, xpReward } = req.body;
      if (!name || !description) return res.status(400).json({ message: "Name and description are required" });
      res.json(await storage.createTool({ name, description, icon: icon || "📝", courseId: courseId || undefined, status: status || "active", orderIndex: orderIndex ?? 0, xpReward: xpReward ?? 100 }));
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/admin/tools/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateTool(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Tool not found" });
      res.json(updated);
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/admin/tools/:id", requireAdmin, async (req, res) => {
    try { await storage.deleteTool(req.params.id); res.json({ success: true }); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/admin/tools/:toolId/content", requireAdmin, async (req, res) => {
    try { res.json(await storage.getToolContent(req.params.toolId)); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/admin/content", requireAdmin, async (req, res) => {
    try {
      const { toolId, type, title, content, formula, quickCheck, quickCheckAnswer, url, imageUrl, orderIndex } = req.body;
      if (!toolId || !title) return res.status(400).json({ message: "toolId and title are required" });
      res.json(await storage.createToolContent({ toolId, type: type || "text", title, content: content || "", formula: formula || null, quickCheck: quickCheck || null, quickCheckAnswer: quickCheckAnswer || null, url: url || null, imageUrl: imageUrl || null, orderIndex: orderIndex ?? 0 }));
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/admin/content/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateToolContent(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Content not found" });
      res.json(updated);
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/admin/content/:id", requireAdmin, async (req, res) => {
    try { await storage.deleteToolContent(req.params.id); res.json({ success: true }); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  // ─── Admin: Tasks ─────────────────────────────────────────────────

  app.get("/api/admin/tools/:toolId/tasks", requireAdmin, async (req, res) => {
    try { res.json(await storage.getTasksByTool(req.params.toolId)); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/admin/tasks", requireAdmin, async (req, res) => {
    try {
      const { toolId, label, xp, orderIndex } = req.body;
      if (!toolId || !label) return res.status(400).json({ message: "toolId and label are required" });
      res.json(await storage.createTask({ toolId, label, xp: xp ?? 25, orderIndex: orderIndex ?? 0 }));
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateTask(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Task not found" });
      res.json(updated);
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    try { await storage.deleteTask(req.params.id); res.json({ success: true }); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  // ─── Admin: Question Templates ────────────────────────────────────

  app.get("/api/admin/tools/:toolId/templates", requireAdmin, async (req, res) => {
    try { res.json(await storage.getQuestionTemplatesByTool(req.params.toolId)); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/admin/templates", requireAdmin, async (req, res) => {
    try {
      const { toolId, templateText, solutionTemplate, answerType, parameters } = req.body;
      if (!toolId || !templateText || !solutionTemplate || !parameters) return res.status(400).json({ message: "All fields are required" });
      res.json(await storage.createQuestionTemplate({ toolId, templateText, solutionTemplate, answerType: answerType || "numeric", parameters }));
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateQuestionTemplate(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Template not found" });
      res.json(updated);
    } catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try { await storage.deleteQuestionTemplate(req.params.id); res.json({ success: true }); }
    catch (err) { res.status(500).json({ message: "Internal server error" }); }
  });

  app.use("/uploads", express.static(uploadsDir));

  return httpServer;
}
