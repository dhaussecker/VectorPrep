import { eq, and, count } from "drizzle-orm";
import { db } from "./db";
import {
  users, courses, topics, learnCards, questionTemplates,
  userLearnProgress, userPracticeProgress, practiceAttempts,
  cheatSheetEntries,
  type User, type InsertUser,
  type Course, type InsertCourse,
  type Topic, type InsertTopic,
  type LearnCard, type InsertLearnCard,
  type QuestionTemplate, type InsertQuestionTemplate,
  type UserLearnProgress, type InsertUserLearnProgress,
  type UserPracticeProgress, type InsertUserPracticeProgress,
  type CheatSheetEntry, type InsertCheatSheetEntry,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getTopicsByCourse(courseId: string): Promise<Topic[]>;

  getTopics(): Promise<Topic[]>;
  getTopic(id: string): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;

  getLearnCardsByTopic(topicId: string): Promise<LearnCard[]>;
  getLearnCard(id: string): Promise<LearnCard | undefined>;
  createLearnCard(card: InsertLearnCard): Promise<LearnCard>;

  getQuestionTemplatesByTopic(topicId: string): Promise<QuestionTemplate[]>;
  getQuestionTemplate(id: string): Promise<QuestionTemplate | undefined>;
  createQuestionTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate>;

  getUserLearnProgress(userId: string, topicId: string): Promise<UserLearnProgress[]>;
  markLearnCardComplete(userId: string, cardId: string, topicId: string): Promise<void>;

  getUserPracticeProgress(userId: string, topicId: string): Promise<UserPracticeProgress[]>;
  recordPracticeAttempt(userId: string, templateId: string, topicId: string, correct: boolean): Promise<void>;

  createPracticeAttempt(userId: string, templateId: string, topicId: string, questionText: string, correctAnswer: string, solutionSteps: string): Promise<string>;
  getPracticeAttempt(id: string): Promise<{ id: string; userId: string; templateId: string; topicId: string; questionText: string; correctAnswer: string; solutionSteps: string } | undefined>;

  getTopicCount(): Promise<number>;

  updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic | undefined>;
  deleteTopic(id: string): Promise<void>;

  updateLearnCard(id: string, data: Partial<InsertLearnCard>): Promise<LearnCard | undefined>;
  deleteLearnCard(id: string): Promise<void>;

  updateQuestionTemplate(id: string, data: Partial<InsertQuestionTemplate>): Promise<QuestionTemplate | undefined>;
  deleteQuestionTemplate(id: string): Promise<void>;

  getCheatSheetEntries(userId: string, topicId?: string): Promise<CheatSheetEntry[]>;
  addCheatSheetEntry(entry: InsertCheatSheetEntry): Promise<CheatSheetEntry>;
  deleteCheatSheetEntry(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
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

  async getTopicsByCourse(courseId: string): Promise<Topic[]> {
    return db.select().from(topics).where(eq(topics.courseId, courseId)).orderBy(topics.orderIndex);
  }

  async getTopics(): Promise<Topic[]> {
    return db.select().from(topics).orderBy(topics.orderIndex);
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [created] = await db.insert(topics).values(topic).returning();
    return created;
  }

  async getLearnCardsByTopic(topicId: string): Promise<LearnCard[]> {
    return db.select().from(learnCards).where(eq(learnCards.topicId, topicId)).orderBy(learnCards.orderIndex);
  }

  async getLearnCard(id: string): Promise<LearnCard | undefined> {
    const [card] = await db.select().from(learnCards).where(eq(learnCards.id, id));
    return card;
  }

  async createLearnCard(card: InsertLearnCard): Promise<LearnCard> {
    const [created] = await db.insert(learnCards).values(card).returning();
    return created;
  }

  async getQuestionTemplatesByTopic(topicId: string): Promise<QuestionTemplate[]> {
    return db.select().from(questionTemplates).where(eq(questionTemplates.topicId, topicId));
  }

  async getQuestionTemplate(id: string): Promise<QuestionTemplate | undefined> {
    const [template] = await db.select().from(questionTemplates).where(eq(questionTemplates.id, id));
    return template;
  }

  async createQuestionTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate> {
    const [created] = await db.insert(questionTemplates).values(template).returning();
    return created;
  }

  async getUserLearnProgress(userId: string, topicId: string): Promise<UserLearnProgress[]> {
    return db.select().from(userLearnProgress)
      .where(and(eq(userLearnProgress.userId, userId), eq(userLearnProgress.topicId, topicId)));
  }

  async markLearnCardComplete(userId: string, cardId: string, topicId: string): Promise<void> {
    const existing = await db.select().from(userLearnProgress)
      .where(and(
        eq(userLearnProgress.userId, userId),
        eq(userLearnProgress.learnCardId, cardId),
      ));

    if (existing.length === 0) {
      await db.insert(userLearnProgress).values({
        userId, learnCardId: cardId, topicId, completed: true,
      });
    } else {
      await db.update(userLearnProgress)
        .set({ completed: true })
        .where(eq(userLearnProgress.id, existing[0].id));
    }
  }

  async getUserPracticeProgress(userId: string, topicId: string): Promise<UserPracticeProgress[]> {
    return db.select().from(userPracticeProgress)
      .where(and(eq(userPracticeProgress.userId, userId), eq(userPracticeProgress.topicId, topicId)));
  }

  async recordPracticeAttempt(userId: string, templateId: string, topicId: string, correct: boolean): Promise<void> {
    const existing = await db.select().from(userPracticeProgress)
      .where(and(
        eq(userPracticeProgress.userId, userId),
        eq(userPracticeProgress.questionTemplateId, templateId),
      ));

    if (existing.length === 0) {
      await db.insert(userPracticeProgress).values({
        userId, questionTemplateId: templateId, topicId, correct, attempts: 1,
      });
    } else {
      await db.update(userPracticeProgress)
        .set({
          correct: correct || existing[0].correct,
          attempts: existing[0].attempts + 1,
        })
        .where(eq(userPracticeProgress.id, existing[0].id));
    }
  }

  async createPracticeAttempt(userId: string, templateId: string, topicId: string, questionText: string, correctAnswer: string, solutionSteps: string): Promise<string> {
    const [created] = await db.insert(practiceAttempts).values({
      userId, templateId, topicId, questionText, correctAnswer, solutionSteps,
    }).returning();
    return created.id;
  }

  async getPracticeAttempt(id: string) {
    const [attempt] = await db.select().from(practiceAttempts).where(eq(practiceAttempts.id, id));
    return attempt;
  }

  async getTopicCount(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(topics);
    return result.value;
  }

  async updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic | undefined> {
    const [updated] = await db.update(topics).set(data).where(eq(topics.id, id)).returning();
    return updated;
  }

  async deleteTopic(id: string): Promise<void> {
    await db.delete(learnCards).where(eq(learnCards.topicId, id));
    await db.delete(questionTemplates).where(eq(questionTemplates.topicId, id));
    await db.delete(userLearnProgress).where(eq(userLearnProgress.topicId, id));
    await db.delete(userPracticeProgress).where(eq(userPracticeProgress.topicId, id));
    await db.delete(practiceAttempts).where(eq(practiceAttempts.topicId, id));
    await db.delete(cheatSheetEntries).where(eq(cheatSheetEntries.topicId, id));
    await db.delete(topics).where(eq(topics.id, id));
  }

  async updateLearnCard(id: string, data: Partial<InsertLearnCard>): Promise<LearnCard | undefined> {
    const [updated] = await db.update(learnCards).set(data).where(eq(learnCards.id, id)).returning();
    return updated;
  }

  async deleteLearnCard(id: string): Promise<void> {
    await db.delete(userLearnProgress).where(eq(userLearnProgress.learnCardId, id));
    await db.delete(learnCards).where(eq(learnCards.id, id));
  }

  async updateQuestionTemplate(id: string, data: Partial<InsertQuestionTemplate>): Promise<QuestionTemplate | undefined> {
    const [updated] = await db.update(questionTemplates).set(data).where(eq(questionTemplates.id, id)).returning();
    return updated;
  }

  async deleteQuestionTemplate(id: string): Promise<void> {
    await db.delete(userPracticeProgress).where(eq(userPracticeProgress.questionTemplateId, id));
    await db.delete(questionTemplates).where(eq(questionTemplates.id, id));
  }

  async getCheatSheetEntries(userId: string, topicId?: string): Promise<CheatSheetEntry[]> {
    if (topicId) {
      return db.select().from(cheatSheetEntries)
        .where(and(eq(cheatSheetEntries.userId, userId), eq(cheatSheetEntries.topicId, topicId)))
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

  async deleteCheatSheetEntry(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(cheatSheetEntries)
      .where(and(eq(cheatSheetEntries.id, id), eq(cheatSheetEntries.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
