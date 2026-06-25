import { pgTable, serial, text, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const roadmapProgressTable = pgTable("roadmap_progress", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  careerTitle: text("career_title").notNull(),
  milestoneIndex: integer("milestone_index").notNull(),
  phaseIndex: integer("phase_index").notNull(),
  completed: integer("completed").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const profileCommentsTable = pgTable("profile_comments", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  authorUserId: varchar("author_user_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userSkillsTable = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  skillName: text("skill_name").notNull(),
  selfRating: integer("self_rating"),
  testedLevel: integer("tested_level"),
  testedAt: timestamp("tested_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const learningResourcesTable = pgTable("learning_resources", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  careerSuggestionId: integer("career_suggestion_id"),
  userSkillId: integer("user_skill_id"),
  resourceType: text("resource_type").notNull().default("course"),
  title: text("title").notNull(),
  platform: text("platform"),
  url: text("url"),
  description: text("description"),
  difficulty: text("difficulty"),
  isFree: integer("is_free").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const progressPostsTable = pgTable("progress_posts", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  postType: text("post_type").notNull().default("general"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RoadmapProgress = typeof roadmapProgressTable.$inferSelect;
export type ProfileComment = typeof profileCommentsTable.$inferSelect;
export type UserSkill = typeof userSkillsTable.$inferSelect;
export type LearningResource = typeof learningResourcesTable.$inferSelect;
export type ProgressPost = typeof progressPostsTable.$inferSelect;
