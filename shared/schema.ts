import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streak: integer("streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  program: text("program"),
  programCourses: jsonb("program_courses"),
  selectedCourseNames: jsonb("selected_course_names"),
});

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("award"),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull().default("#22C55E"),
  orderIndex: integer("order_index").notNull().default(0),
  locked: boolean("locked").notNull().default(false),
});

// tools (was: topics)
export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  status: text("status").notNull().default("active"), // locked | active | mastered
  orderIndex: integer("order_index").notNull().default(0),
  xpReward: integer("xp_reward").notNull().default(100),
});

// tool_content (was: learn_cards)
export const toolContent = pgTable("tool_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull(),
  type: text("type").notNull().default("text"), // text | video | image
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  formula: text("formula"),
  quickCheck: text("quick_check"),
  quickCheckAnswer: text("quick_check_answer"),
  url: text("url"),
  imageUrl: text("image_url"),
  tutorVideoUrl: text("tutor_video_url"),
  captions: jsonb("captions"), // [{t: number, text: string}]
  animationId: text("animation_id"), // key into MATH_ANIMATIONS registry
  orderIndex: integer("order_index").notNull().default(0),
});

// tasks (NEW — checkbox tasks that award XP)
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull(),
  label: text("label").notNull(),
  xp: integer("xp").notNull().default(25),
  orderIndex: integer("order_index").notNull().default(0),
});

// user_task_progress (NEW)
export const userTaskProgress = pgTable("user_task_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  taskId: varchar("task_id").notNull(),
  toolId: varchar("tool_id").notNull(),
  completed: boolean("completed").notNull().default(false),
});

// user_content_progress (was: user_learn_progress)
export const userContentProgress = pgTable("user_content_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  contentId: varchar("content_id").notNull(),
  toolId: varchar("tool_id").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const questionTemplates = pgTable("question_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull(),
  templateText: text("template_text").notNull(),
  solutionTemplate: text("solution_template").notNull(),
  answerType: text("answer_type").notNull().default("numeric"),
  parameters: jsonb("parameters").notNull(),
});

export const userPracticeProgress = pgTable("user_practice_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  questionTemplateId: varchar("question_template_id").notNull(),
  toolId: varchar("tool_id").notNull(),
  correct: boolean("correct").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
});

export const cheatSheetEntries = pgTable("cheat_sheet_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  toolId: varchar("tool_id").notNull(),
  formula: text("formula").notNull(),
  label: text("label").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const inviteCodes = pgTable("invite_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  used: boolean("used").notNull().default(false),
  usedBy: text("used_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const studyPlans = pgTable("study_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  userId: varchar("user_id").notNull(),
  totalDays: integer("total_days").notNull(),
  plan: jsonb("plan").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const practiceAttempts = pgTable("practice_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  templateId: varchar("template_id").notNull(),
  toolId: varchar("tool_id").notNull(),
  questionText: text("question_text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  solutionSteps: text("solution_steps").notNull(),
});

// ─── Insert schemas ────────────────────────────────────────────────
export const insertUserSchema = createInsertSchema(users);
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertToolSchema = createInsertSchema(tools).omit({ id: true });
export const insertToolContentSchema = createInsertSchema(toolContent).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertUserTaskProgressSchema = createInsertSchema(userTaskProgress).omit({ id: true });
export const insertUserContentProgressSchema = createInsertSchema(userContentProgress).omit({ id: true });
export const insertQuestionTemplateSchema = createInsertSchema(questionTemplates).omit({ id: true });
export const insertUserPracticeProgressSchema = createInsertSchema(userPracticeProgress).omit({ id: true });
export const insertCheatSheetEntrySchema = createInsertSchema(cheatSheetEntries).omit({ id: true });
export const insertPracticeAttemptSchema = createInsertSchema(practiceAttempts).omit({ id: true });
export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({ id: true, createdAt: true });
export const insertInviteCodeSchema = createInsertSchema(inviteCodes).omit({ id: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = loginSchema.extend({
  displayName: z.string().min(1, "Display name is required"),
});

// ─── Types ────────────────────────────────────────────────────────
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type ToolContentItem = typeof toolContent.$inferSelect;
export type InsertToolContent = z.infer<typeof insertToolContentSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UserTaskProgress = typeof userTaskProgress.$inferSelect;
export type UserContentProgress = typeof userContentProgress.$inferSelect;
export type QuestionTemplate = typeof questionTemplates.$inferSelect;
export type UserPracticeProgress = typeof userPracticeProgress.$inferSelect;
export type InsertQuestionTemplate = z.infer<typeof insertQuestionTemplateSchema>;
export type CheatSheetEntry = typeof cheatSheetEntries.$inferSelect;
export type InsertCheatSheetEntry = z.infer<typeof insertCheatSheetEntrySchema>;
export type StudyPlan = typeof studyPlans.$inferSelect;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
