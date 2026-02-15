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

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const learnCards = pgTable("learn_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  formula: text("formula"),
  quickCheck: text("quick_check"),
  quickCheckAnswer: text("quick_check_answer"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const questionTemplates = pgTable("question_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").notNull(),
  templateText: text("template_text").notNull(),
  solutionTemplate: text("solution_template").notNull(),
  answerType: text("answer_type").notNull().default("numeric"),
  parameters: jsonb("parameters").notNull(),
});

export const userLearnProgress = pgTable("user_learn_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  learnCardId: varchar("learn_card_id").notNull(),
  topicId: varchar("topic_id").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const userPracticeProgress = pgTable("user_practice_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  questionTemplateId: varchar("question_template_id").notNull(),
  topicId: varchar("topic_id").notNull(),
  correct: boolean("correct").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
});

export const cheatSheetEntries = pgTable("cheat_sheet_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  topicId: varchar("topic_id").notNull(),
  formula: text("formula").notNull(),
  label: text("label").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const practiceAttempts = pgTable("practice_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  templateId: varchar("template_id").notNull(),
  topicId: varchar("topic_id").notNull(),
  questionText: text("question_text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  solutionSteps: text("solution_steps").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true });
export const insertLearnCardSchema = createInsertSchema(learnCards).omit({ id: true });
export const insertQuestionTemplateSchema = createInsertSchema(questionTemplates).omit({ id: true });
export const insertUserLearnProgressSchema = createInsertSchema(userLearnProgress).omit({ id: true });
export const insertUserPracticeProgressSchema = createInsertSchema(userPracticeProgress).omit({ id: true });
export const insertCheatSheetEntrySchema = createInsertSchema(cheatSheetEntries).omit({ id: true });
export const insertPracticeAttemptSchema = createInsertSchema(practiceAttempts).omit({ id: true });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = loginSchema.extend({
  displayName: z.string().min(1, "Display name is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Topic = typeof topics.$inferSelect;
export type LearnCard = typeof learnCards.$inferSelect;
export type QuestionTemplate = typeof questionTemplates.$inferSelect;
export type UserLearnProgress = typeof userLearnProgress.$inferSelect;
export type UserPracticeProgress = typeof userPracticeProgress.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type InsertLearnCard = z.infer<typeof insertLearnCardSchema>;
export type InsertQuestionTemplate = z.infer<typeof insertQuestionTemplateSchema>;
export type CheatSheetEntry = typeof cheatSheetEntries.$inferSelect;
export type InsertCheatSheetEntry = z.infer<typeof insertCheatSheetEntrySchema>;
export type InsertUserLearnProgress = z.infer<typeof insertUserLearnProgressSchema>;
export type InsertUserPracticeProgress = z.infer<typeof insertUserPracticeProgressSchema>;
