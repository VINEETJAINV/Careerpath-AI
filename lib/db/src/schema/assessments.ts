import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assessmentsTable = pgTable("assessments", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  status: text("status").notNull().default("pending"),
  score: integer("score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const assessmentQuestionsTable = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"),
  options: text("options"),
  answer: text("answer"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const careerSuggestionsTable = pgTable("career_suggestions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  careerTitle: text("career_title").notNull(),
  compatibilityScore: integer("compatibility_score").notNull().default(0),
  description: text("description").notNull(),
  pros: text("pros").notNull().default("[]"),
  cons: text("cons").notNull().default("[]"),
  requiredSkills: text("required_skills").notNull().default("[]"),
  salaryRange: text("salary_range").notNull(),
  timeToAchieve: text("time_to_achieve").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAssessmentSchema = createInsertSchema(assessmentsTable).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestionsTable).omit({
  id: true,
});

export const insertCareerSuggestionSchema = createInsertSchema(careerSuggestionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessmentsTable.$inferSelect;
export type AssessmentQuestion = typeof assessmentQuestionsTable.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;
export type CareerSuggestion = typeof careerSuggestionsTable.$inferSelect;
