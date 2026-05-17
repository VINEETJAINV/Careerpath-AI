import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  age: integer("age"),
  educationLevel: text("education_level").notNull(),
  fieldOfStudy: text("field_of_study"),
  workExperience: text("work_experience"),
  skills: text("skills"),
  interests: text("interests"),
  goals: text("goals"),
  conversationId: integer("conversation_id"),
  isPublic: integer("is_public").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
