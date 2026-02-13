import { eq, and, count } from "drizzle-orm";
import { db } from "./db";
import {
  users, topics, learnCards, questionTemplates,
  userLearnProgress, userPracticeProgress, practiceAttempts,
  type User, type InsertUser, type Topic, type InsertTopic,
  type LearnCard, type InsertLearnCard,
  type QuestionTemplate, type InsertQuestionTemplate,
  type UserLearnProgress, type InsertUserLearnProgress,
  type UserPracticeProgress, type InsertUserPracticeProgress,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
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
}

export const storage = new DatabaseStorage();
