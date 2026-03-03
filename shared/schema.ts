import { pgTable, text, varchar, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categoryEnum = z.enum(['Science', 'History', 'Etymology', 'Space', 'Art', 'Us', 'Random']);
export type Category = z.infer<typeof categoryEnum>;

export const reactionEnum = z.enum(['mind-blown', 'fascinating', 'heart', 'laugh', 'thinking', 'sad']);
export type ReactionType = z.infer<typeof reactionEnum>;

export const pairings = pgTable("pairings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  inviteCode: varchar("invite_code", { length: 32 }).notNull().unique(),
  user1Id: integer("user1_id"),
  user2Id: integer("user2_id"),
});

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  pairingId: integer("pairing_id"),
});

export const facts = pgTable("facts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  text: text("text").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").notNull(),
  pairingId: integer("pairing_id").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  categories: jsonb("categories").$type<Category[]>().notNull().default([]),
});

export const reactions = pgTable("reactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  factId: integer("fact_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
});

export const insertUserSchema = z.object({
  name: z.string().min(1).max(50),
});

export const insertFactSchema = z.object({
  text: z.string().min(1),
  imageUrl: z.string().optional(),
  categories: z.array(categoryEnum).min(1),
});

export const insertReactionSchema = z.object({
  type: reactionEnum,
});

export type User = typeof users.$inferSelect;
export type Pairing = typeof pairings.$inferSelect;
export type Fact = typeof facts.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFact = z.infer<typeof insertFactSchema>;

export type FactWithReactions = Fact & {
  reactions: Record<string, ReactionType | null>;
};

export type PublicUser = {
  id: number;
  name: string;
  avatar: string;
};
