import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const followedCareersTable = pgTable("followed_careers", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  careerSuggestionId: integer("career_suggestion_id").notNull(),
  careerTitle: text("career_title").notNull(),
  isPrimary: integer("is_primary").notNull().default(0),
  status: text("status").notNull().default("active"), // active | archived
  followedAt: timestamp("followed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFollowedCareerSchema = createInsertSchema(followedCareersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FollowedCareer = typeof followedCareersTable.$inferSelect;
export type InsertFollowedCareer = z.infer<typeof insertFollowedCareerSchema>;
