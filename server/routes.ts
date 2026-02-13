import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { seedDatabase } from "./seed";
import type { User } from "@shared/schema";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = req.user as User;
  if (!user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function generateFromTemplate(
  template: { templateText: string; solutionTemplate: string; parameters: any },
) {
  const params: Record<string, number> = {};
  const paramDefs = template.parameters as Record<string, { min: number; max: number }>;

  for (const [key, def] of Object.entries(paramDefs)) {
    params[key] = Math.floor(Math.random() * (def.max - def.min + 1)) + def.min;
  }

  let questionText = template.templateText;
  let solutionText = template.solutionTemplate;

  const computed: Record<string, number | string> = { ...params };

  if (params.a !== undefined && params.n !== undefined) {
    computed.answer = params.a * params.n;
    computed.nm1 = params.n - 1;
    if (template.templateText.includes("derivative")) {
      computed.answer = `${params.a * params.n}`;
    }
  }
  if (params.a !== undefined && params.b !== undefined) {
    if (template.templateText.includes("integral")) {
      computed.answer = (params.a * params.b * params.b) / 2;
    } else if (template.templateText.includes("magnitude")) {
      computed.a2 = params.a * params.a;
      computed.b2 = params.b * params.b;
      computed.answer = Math.round(Math.sqrt(params.a * params.a + params.b * params.b) * 100) / 100;
    }
  }
  if (params.a2 !== undefined && params.a !== undefined && params.b !== undefined) {
    if (template.templateText.includes("limit")) {
      computed.answer = params.a2 * params.a + params.b;
    }
  }
  if (params.m !== undefined && params.f !== undefined) {
    computed.answer = Math.round((params.f / params.m) * 100) / 100;
  }
  if (params.a !== undefined && params.t !== undefined && template.templateText.includes("velocity")) {
    computed.answer = params.a * params.t;
  }
  if (params.a1 !== undefined && params.a2 !== undefined && params.b1 !== undefined && params.b2 !== undefined) {
    computed.p1 = params.a1 * params.b1;
    computed.p2 = params.a2 * params.b2;
    computed.answer = params.a1 * params.b1 + params.a2 * params.b2;
  }
  if (params.p !== undefined && params.n !== undefined && template.templateText.includes("mass number")) {
    computed.answer = params.p + params.n;
  }
  if (params.g !== undefined && params.mm !== undefined) {
    computed.answer = Math.round((params.g / params.mm) * 100) / 100;
  }
  if (params.n !== undefined && params.a !== undefined && template.templateText.includes("output")) {
    computed.answer = params.n * params.a;
  }

  for (const [key, val] of Object.entries(computed)) {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    questionText = questionText.replace(regex, String(val));
    solutionText = solutionText.replace(regex, String(val));
  }

  return {
    questionText,
    solutionSteps: solutionText,
    correctAnswer: String(computed.answer ?? ""),
    parameters: params,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  await seedDatabase();

  app.get("/api/progress/overview", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const allTopics = await storage.getTopics();

      const topicProgressList = await Promise.all(
        allTopics.map(async (topic) => {
          const cards = await storage.getLearnCardsByTopic(topic.id);
          const templates = await storage.getQuestionTemplatesByTopic(topic.id);
          const learnProgress = await storage.getUserLearnProgress(user.id, topic.id);
          const practiceProgress = await storage.getUserPracticeProgress(user.id, topic.id);

          const learnCompleted = learnProgress.filter((p) => p.completed).length;
          const learnTotal = cards.length;
          const learnPercent = learnTotal > 0 ? (learnCompleted / learnTotal) * 100 : 0;

          const practiceCorrect = practiceProgress.filter((p) => p.correct).length;
          const practiceTotal = templates.length;
          const practicePercent = practiceTotal > 0 ? (practiceCorrect / practiceTotal) * 100 : 0;

          const totalPercent = (learnPercent + practicePercent) / 2;

          return {
            topic,
            learnPercent,
            practicePercent,
            totalPercent,
            learnCompleted,
            learnTotal,
            practiceCorrect,
            practiceTotal,
          };
        })
      );

      const overall =
        topicProgressList.length > 0
          ? topicProgressList.reduce((sum, tp) => sum + tp.totalPercent, 0) / topicProgressList.length
          : 0;

      res.json({ overall, topics: topicProgressList });
    } catch (err) {
      console.error("Error fetching progress:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/learn/:topicId", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { topicId } = req.params;
      const topic = await storage.getTopic(topicId);
      if (!topic) return res.status(404).json({ message: "Topic not found" });

      const cards = await storage.getLearnCardsByTopic(topicId);
      const progress = await storage.getUserLearnProgress(user.id, topicId);
      const progressMap = new Map(progress.map((p) => [p.learnCardId, p.completed]));

      const cardsWithProgress = cards.map((card) => ({
        ...card,
        completed: progressMap.get(card.id) ?? false,
      }));

      res.json({ topic, cards: cardsWithProgress });
    } catch (err) {
      console.error("Error fetching learn data:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/learn/:topicId/complete", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { topicId } = req.params;
      const { cardId } = req.body;
      if (!cardId) return res.status(400).json({ message: "cardId is required" });

      await storage.markLearnCardComplete(user.id, cardId, topicId);
      res.json({ success: true });
    } catch (err) {
      console.error("Error marking complete:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/practice/:topicId/info", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { topicId } = req.params;
      const topic = await storage.getTopic(topicId);
      if (!topic) return res.status(404).json({ message: "Topic not found" });

      const templates = await storage.getQuestionTemplatesByTopic(topicId);
      const progress = await storage.getUserPracticeProgress(user.id, topicId);
      const practiceCorrect = progress.filter((p) => p.correct).length;
      const practicePercent = templates.length > 0 ? (practiceCorrect / templates.length) * 100 : 0;

      res.json({ topic, practicePercent });
    } catch (err) {
      console.error("Error fetching practice info:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/practice/:topicId/generate", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { topicId } = req.params;
      const { templateId } = req.body;

      let template;
      if (templateId) {
        template = await storage.getQuestionTemplate(templateId);
        if (template && template.topicId !== topicId) template = undefined;
      }

      if (!template) {
        const templates = await storage.getQuestionTemplatesByTopic(topicId);
        if (templates.length === 0) {
          return res.status(404).json({ message: "No question templates available" });
        }
        template = templates[Math.floor(Math.random() * templates.length)];
      }

      const generated = generateFromTemplate(template);

      const attemptId = await storage.createPracticeAttempt(
        user.id, template.id, topicId,
        generated.questionText, generated.correctAnswer, generated.solutionSteps
      );

      res.json({
        attemptId,
        templateId: template.id,
        questionText: generated.questionText,
      });
    } catch (err) {
      console.error("Error generating question:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/practice/:topicId/grade", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { topicId } = req.params;
      const { attemptId, answer } = req.body;

      if (!attemptId || answer === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const attempt = await storage.getPracticeAttempt(attemptId);
      if (!attempt) return res.status(404).json({ message: "Attempt not found" });
      if (attempt.userId !== user.id) return res.status(403).json({ message: "Forbidden" });

      const template = await storage.getQuestionTemplate(attempt.templateId);

      const userAns = String(answer).trim().toLowerCase();
      const correctAns = attempt.correctAnswer.trim().toLowerCase();

      let isCorrect = userAns === correctAns;

      if (!isCorrect && template?.answerType === "numeric") {
        const userNum = parseFloat(userAns);
        const correctNum = parseFloat(correctAns);
        if (!isNaN(userNum) && !isNaN(correctNum)) {
          isCorrect = Math.abs(userNum - correctNum) < 0.01;
        }
      }

      await storage.recordPracticeAttempt(user.id, attempt.templateId, topicId, isCorrect);

      res.json({
        correct: isCorrect,
        correctAnswer: attempt.correctAnswer,
        solutionSteps: attempt.solutionSteps,
      });
    } catch (err) {
      console.error("Error grading answer:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============ ADMIN ROUTES ============

  app.get("/api/admin/topics", requireAdmin, async (_req, res) => {
    try {
      const allTopics = await storage.getTopics();
      res.json(allTopics);
    } catch (err) {
      console.error("Error fetching topics:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/topics", requireAdmin, async (req, res) => {
    try {
      const { name, description, icon, orderIndex } = req.body;
      if (!name || !description) {
        return res.status(400).json({ message: "Name and description are required" });
      }
      const topic = await storage.createTopic({ name, description, icon: icon || "NEW", orderIndex: orderIndex ?? 0 });
      res.json(topic);
    } catch (err) {
      console.error("Error creating topic:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/topics/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateTopic(id, req.body);
      if (!updated) return res.status(404).json({ message: "Topic not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating topic:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/topics/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTopic(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting topic:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/topics/:topicId/cards", requireAdmin, async (req, res) => {
    try {
      const cards = await storage.getLearnCardsByTopic(req.params.topicId);
      res.json(cards);
    } catch (err) {
      console.error("Error fetching cards:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/cards", requireAdmin, async (req, res) => {
    try {
      const { topicId, title, content, quickCheck, quickCheckAnswer, orderIndex } = req.body;
      if (!topicId || !title || !content) {
        return res.status(400).json({ message: "topicId, title, and content are required" });
      }
      const card = await storage.createLearnCard({
        topicId, title, content,
        quickCheck: quickCheck || null,
        quickCheckAnswer: quickCheckAnswer || null,
        orderIndex: orderIndex ?? 0,
      });
      res.json(card);
    } catch (err) {
      console.error("Error creating card:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/cards/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateLearnCard(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Card not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating card:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/cards/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteLearnCard(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting card:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/topics/:topicId/templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getQuestionTemplatesByTopic(req.params.topicId);
      res.json(templates);
    } catch (err) {
      console.error("Error fetching templates:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/templates", requireAdmin, async (req, res) => {
    try {
      const { topicId, templateText, solutionTemplate, answerType, parameters } = req.body;
      if (!topicId || !templateText || !solutionTemplate || !parameters) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const template = await storage.createQuestionTemplate({
        topicId, templateText, solutionTemplate,
        answerType: answerType || "numeric",
        parameters,
      });
      res.json(template);
    } catch (err) {
      console.error("Error creating template:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateQuestionTemplate(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Template not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating template:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteQuestionTemplate(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting template:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
