import { eq, and, count } from "drizzle-orm";
import { db } from "./db";
import {
  users, userProfiles, badges, courses, tools, toolContent, tasks,
  userTaskProgress, userContentProgress, questionTemplates,
  userPracticeProgress, practiceAttempts, cheatSheetEntries,
  inviteCodes, studyPlans,
  type User, type InsertUser,
  type UserProfile,
  type Badge,
  type Course, type InsertCourse,
  type Tool, type InsertTool,
  type ToolContentItem, type InsertToolContent,
  type Task, type InsertTask,
  type UserTaskProgress,
  type UserContentProgress,
  type QuestionTemplate, type InsertQuestionTemplate,
  type UserPracticeProgress,
  type CheatSheetEntry, type InsertCheatSheetEntry,
  type InviteCode,
  type StudyPlan, type InsertStudyPlan,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User profiles (XP/level/streak)
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(userId: string): Promise<UserProfile>;
  updateUserProfile(userId: string, data: Partial<Omit<UserProfile, "id" | "userId">>): Promise<UserProfile>;
  awardXP(userId: string, xp: number): Promise<UserProfile>;
  updateStreak(userId: string): Promise<UserProfile>;

  // Badges
  getUserBadges(userId: string): Promise<Badge[]>;
  addBadge(userId: string, name: string, description: string, icon?: string): Promise<Badge>;

  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  // Tools (was: topics)
  getTools(): Promise<Tool[]>;
  getToolsByCourse(courseId: string): Promise<Tool[]>;
  getTool(id: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, data: Partial<InsertTool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<void>;
  getToolCount(): Promise<number>;

  // Tool content (was: learn_cards)
  getToolContent(toolId: string): Promise<ToolContentItem[]>;
  getToolContentItem(id: string): Promise<ToolContentItem | undefined>;
  createToolContent(item: InsertToolContent): Promise<ToolContentItem>;
  updateToolContent(id: string, data: Partial<InsertToolContent>): Promise<ToolContentItem | undefined>;
  deleteToolContent(id: string): Promise<void>;

  // Tasks
  getTasksByTool(toolId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  // User task progress
  getUserTaskProgress(userId: string, toolId: string): Promise<UserTaskProgress[]>;
  completeTask(userId: string, taskId: string, toolId: string): Promise<void>;

  // User content progress
  getUserContentProgress(userId: string, toolId: string): Promise<UserContentProgress[]>;
  markContentComplete(userId: string, contentId: string, toolId: string): Promise<void>;

  // Question templates
  getQuestionTemplatesByTool(toolId: string): Promise<QuestionTemplate[]>;
  getQuestionTemplate(id: string): Promise<QuestionTemplate | undefined>;
  createQuestionTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate>;
  updateQuestionTemplate(id: string, data: Partial<InsertQuestionTemplate>): Promise<QuestionTemplate | undefined>;
  deleteQuestionTemplate(id: string): Promise<void>;

  // Practice progress
  getUserPracticeProgress(userId: string, toolId: string): Promise<UserPracticeProgress[]>;
  recordPracticeAttempt(userId: string, templateId: string, toolId: string, correct: boolean): Promise<void>;
  createPracticeAttempt(userId: string, templateId: string, toolId: string, questionText: string, correctAnswer: string, solutionSteps: string): Promise<string>;
  getPracticeAttempt(id: string): Promise<{ id: string; userId: string; templateId: string; toolId: string; questionText: string; correctAnswer: string; solutionSteps: string } | undefined>;

  // Cheat sheet
  getCheatSheetEntries(userId: string, toolId?: string): Promise<CheatSheetEntry[]>;
  addCheatSheetEntry(entry: InsertCheatSheetEntry): Promise<CheatSheetEntry>;
  updateCheatSheetEntry(id: string, userId: string, formula: string): Promise<CheatSheetEntry | null>;
  deleteCheatSheetEntry(id: string, userId: string): Promise<boolean>;

  // Invite codes
  getInviteCode(code: string): Promise<InviteCode | undefined>;
  redeemInviteCode(code: string, userId: string): Promise<void>;
  listInviteCodes(): Promise<InviteCode[]>;
  createInviteCodes(count: number): Promise<InviteCode[]>;

  // Study plans
  createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan>;
  getStudyPlan(userId: string, courseId: string): Promise<StudyPlan | undefined>;
  updateStudyPlan(id: string, data: Partial<InsertStudyPlan>): Promise<StudyPlan | undefined>;
}

export class DatabaseStorage implements IStorage {
  // ─── Users ────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  // ─── User Profiles ────────────────────────────────────────────────

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(userId: string): Promise<UserProfile> {
    const [created] = await db.insert(userProfiles).values({ userId }).returning();
    return created;
  }

  async updateUserProfile(userId: string, data: Partial<Omit<UserProfile, "id" | "userId">>): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      return this.createUserProfile(userId);
    }
    const [updated] = await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId)).returning();
    return updated;
  }

  async awardXP(userId: string, xp: number): Promise<UserProfile> {
    let profile = await this.getUserProfile(userId);
    if (!profile) profile = await this.createUserProfile(userId);
    const newXp = profile.xp + xp;
    const newLevel = Math.floor(newXp / 500) + 1;
    const [updated] = await db.update(userProfiles)
      .set({ xp: newXp, level: newLevel })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  async updateStreak(userId: string): Promise<UserProfile> {
    let profile = await this.getUserProfile(userId);
    if (!profile) profile = await this.createUserProfile(userId);
    const today = new Date().toISOString().split("T")[0];
    if (profile.lastActiveDate === today) return profile;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const newStreak = profile.lastActiveDate === yesterday ? profile.streak + 1 : 1;
    const [updated] = await db.update(userProfiles)
      .set({ streak: newStreak, lastActiveDate: today })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  // ─── Badges ───────────────────────────────────────────────────────

  async getUserBadges(userId: string): Promise<Badge[]> {
    return db.select().from(badges).where(eq(badges.userId, userId));
  }

  async addBadge(userId: string, name: string, description: string, icon = "award"): Promise<Badge> {
    const [created] = await db.insert(badges).values({ userId, name, description, icon }).returning();
    return created;
  }

  // ─── Courses ──────────────────────────────────────────────────────

  async getCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(courses.orderIndex);
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course> {
    const [updated] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: string): Promise<void> {
    const courseTools = await this.getToolsByCourse(id);
    for (const tool of courseTools) {
      await this.deleteTool(tool.id);
    }
    await db.delete(courses).where(eq(courses.id, id));
  }

  // ─── Tools ────────────────────────────────────────────────────────

  async getTools(): Promise<Tool[]> {
    return db.select().from(tools).orderBy(tools.orderIndex);
  }

  async getToolsByCourse(courseId: string): Promise<Tool[]> {
    return db.select().from(tools).where(eq(tools.courseId, courseId)).orderBy(tools.orderIndex);
  }

  async getTool(id: string): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool;
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const [created] = await db.insert(tools).values(tool).returning();
    return created;
  }

  async updateTool(id: string, data: Partial<InsertTool>): Promise<Tool | undefined> {
    const [updated] = await db.update(tools).set(data).where(eq(tools.id, id)).returning();
    return updated;
  }

  async deleteTool(id: string): Promise<void> {
    await db.delete(toolContent).where(eq(toolContent.toolId, id));
    await db.delete(tasks).where(eq(tasks.toolId, id));
    await db.delete(questionTemplates).where(eq(questionTemplates.toolId, id));
    await db.delete(userContentProgress).where(eq(userContentProgress.toolId, id));
    await db.delete(userPracticeProgress).where(eq(userPracticeProgress.toolId, id));
    await db.delete(userTaskProgress).where(eq(userTaskProgress.toolId, id));
    await db.delete(practiceAttempts).where(eq(practiceAttempts.toolId, id));
    await db.delete(cheatSheetEntries).where(eq(cheatSheetEntries.toolId, id));
    await db.delete(tools).where(eq(tools.id, id));
  }

  async getToolCount(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(tools);
    return result.value;
  }

  // ─── Tool Content ─────────────────────────────────────────────────

  async getToolContent(toolId: string): Promise<ToolContentItem[]> {
    return db.select().from(toolContent).where(eq(toolContent.toolId, toolId)).orderBy(toolContent.orderIndex);
  }

  async getToolContentItem(id: string): Promise<ToolContentItem | undefined> {
    const [item] = await db.select().from(toolContent).where(eq(toolContent.id, id));
    return item;
  }

  async createToolContent(item: InsertToolContent): Promise<ToolContentItem> {
    const [created] = await db.insert(toolContent).values(item).returning();
    return created;
  }

  async updateToolContent(id: string, data: Partial<InsertToolContent>): Promise<ToolContentItem | undefined> {
    const [updated] = await db.update(toolContent).set(data).where(eq(toolContent.id, id)).returning();
    return updated;
  }

  async deleteToolContent(id: string): Promise<void> {
    await db.delete(userContentProgress).where(eq(userContentProgress.contentId, id));
    await db.delete(toolContent).where(eq(toolContent.id, id));
  }

  // ─── Tasks ────────────────────────────────────────────────────────

  async getTasksByTool(toolId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.toolId, toolId)).orderBy(tasks.orderIndex);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(userTaskProgress).where(eq(userTaskProgress.taskId, id));
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // ─── User Task Progress ───────────────────────────────────────────

  async getUserTaskProgress(userId: string, toolId: string): Promise<UserTaskProgress[]> {
    return db.select().from(userTaskProgress)
      .where(and(eq(userTaskProgress.userId, userId), eq(userTaskProgress.toolId, toolId)));
  }

  async completeTask(userId: string, taskId: string, toolId: string): Promise<void> {
    const existing = await db.select().from(userTaskProgress)
      .where(and(eq(userTaskProgress.userId, userId), eq(userTaskProgress.taskId, taskId)));
    if (existing.length === 0) {
      await db.insert(userTaskProgress).values({ userId, taskId, toolId, completed: true });
    } else {
      await db.update(userTaskProgress)
        .set({ completed: true })
        .where(eq(userTaskProgress.id, existing[0].id));
    }
  }

  // ─── User Content Progress ────────────────────────────────────────

  async getUserContentProgress(userId: string, toolId: string): Promise<UserContentProgress[]> {
    return db.select().from(userContentProgress)
      .where(and(eq(userContentProgress.userId, userId), eq(userContentProgress.toolId, toolId)));
  }

  async markContentComplete(userId: string, contentId: string, toolId: string): Promise<void> {
    const existing = await db.select().from(userContentProgress)
      .where(and(eq(userContentProgress.userId, userId), eq(userContentProgress.contentId, contentId)));
    if (existing.length === 0) {
      await db.insert(userContentProgress).values({ userId, contentId, toolId, completed: true });
    } else {
      await db.update(userContentProgress)
        .set({ completed: true })
        .where(eq(userContentProgress.id, existing[0].id));
    }
  }

  // ─── Question Templates ───────────────────────────────────────────

  async getQuestionTemplatesByTool(toolId: string): Promise<QuestionTemplate[]> {
    return db.select().from(questionTemplates).where(eq(questionTemplates.toolId, toolId));
  }

  async getQuestionTemplate(id: string): Promise<QuestionTemplate | undefined> {
    const [template] = await db.select().from(questionTemplates).where(eq(questionTemplates.id, id));
    return template;
  }

  async createQuestionTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate> {
    const [created] = await db.insert(questionTemplates).values(template).returning();
    return created;
  }

  async updateQuestionTemplate(id: string, data: Partial<InsertQuestionTemplate>): Promise<QuestionTemplate | undefined> {
    const [updated] = await db.update(questionTemplates).set(data).where(eq(questionTemplates.id, id)).returning();
    return updated;
  }

  async deleteQuestionTemplate(id: string): Promise<void> {
    await db.delete(userPracticeProgress).where(eq(userPracticeProgress.questionTemplateId, id));
    await db.delete(questionTemplates).where(eq(questionTemplates.id, id));
  }

  // ─── Practice Progress ────────────────────────────────────────────

  async getUserPracticeProgress(userId: string, toolId: string): Promise<UserPracticeProgress[]> {
    return db.select().from(userPracticeProgress)
      .where(and(eq(userPracticeProgress.userId, userId), eq(userPracticeProgress.toolId, toolId)));
  }

  async recordPracticeAttempt(userId: string, templateId: string, toolId: string, correct: boolean): Promise<void> {
    const existing = await db.select().from(userPracticeProgress)
      .where(and(eq(userPracticeProgress.userId, userId), eq(userPracticeProgress.questionTemplateId, templateId)));
    if (existing.length === 0) {
      await db.insert(userPracticeProgress).values({ userId, questionTemplateId: templateId, toolId, correct, attempts: 1 });
    } else {
      await db.update(userPracticeProgress)
        .set({ correct: correct || existing[0].correct, attempts: existing[0].attempts + 1 })
        .where(eq(userPracticeProgress.id, existing[0].id));
    }
  }

  async createPracticeAttempt(userId: string, templateId: string, toolId: string, questionText: string, correctAnswer: string, solutionSteps: string): Promise<string> {
    const [created] = await db.insert(practiceAttempts).values({
      userId, templateId, toolId, questionText, correctAnswer, solutionSteps,
    }).returning();
    return created.id;
  }

  async getPracticeAttempt(id: string) {
    const [attempt] = await db.select().from(practiceAttempts).where(eq(practiceAttempts.id, id));
    return attempt;
  }

  // ─── Cheat Sheet ──────────────────────────────────────────────────

  async getCheatSheetEntries(userId: string, toolId?: string): Promise<CheatSheetEntry[]> {
    if (toolId) {
      return db.select().from(cheatSheetEntries)
        .where(and(eq(cheatSheetEntries.userId, userId), eq(cheatSheetEntries.toolId, toolId)))
        .orderBy(cheatSheetEntries.orderIndex);
    }
    return db.select().from(cheatSheetEntries)
      .where(eq(cheatSheetEntries.userId, userId))
      .orderBy(cheatSheetEntries.orderIndex);
  }

  async addCheatSheetEntry(entry: InsertCheatSheetEntry): Promise<CheatSheetEntry> {
    const [created] = await db.insert(cheatSheetEntries).values(entry).returning();
    return created;
  }

  async updateCheatSheetEntry(id: string, userId: string, formula: string): Promise<CheatSheetEntry | null> {
    const [updated] = await db.update(cheatSheetEntries)
      .set({ formula })
      .where(and(eq(cheatSheetEntries.id, id), eq(cheatSheetEntries.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async deleteCheatSheetEntry(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(cheatSheetEntries)
      .where(and(eq(cheatSheetEntries.id, id), eq(cheatSheetEntries.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // ─── Invite Codes ─────────────────────────────────────────────────

  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    const [row] = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return row;
  }

  async redeemInviteCode(code: string, userId: string): Promise<void> {
    await db.update(inviteCodes).set({ used: true, usedBy: userId }).where(eq(inviteCodes.code, code));
  }

  async listInviteCodes(): Promise<InviteCode[]> {
    return db.select().from(inviteCodes).orderBy(inviteCodes.createdAt);
  }

  async createInviteCodes(count: number): Promise<InviteCode[]> {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      let code = "";
      for (let j = 0; j < 8; j++) code += chars[Math.floor(Math.random() * chars.length)];
      codes.push(code);
    }
    return db.insert(inviteCodes).values(codes.map((code) => ({ code }))).returning();
  }

  // ─── Study Plans ──────────────────────────────────────────────────

  async createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan> {
    const existing = await this.getStudyPlan(plan.userId, plan.courseId);
    if (existing) {
      const [updated] = await db.update(studyPlans)
        .set({ totalDays: plan.totalDays, plan: plan.plan })
        .where(eq(studyPlans.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(studyPlans).values(plan).returning();
    return created;
  }

  async getStudyPlan(userId: string, courseId: string): Promise<StudyPlan | undefined> {
    const [plan] = await db.select().from(studyPlans)
      .where(and(eq(studyPlans.userId, userId), eq(studyPlans.courseId, courseId)));
    return plan;
  }

  async updateStudyPlan(id: string, data: Partial<InsertStudyPlan>): Promise<StudyPlan | undefined> {
    const [updated] = await db.update(studyPlans).set(data).where(eq(studyPlans.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
