import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users, pairings, facts, reactions,
  type User, type Pairing, type Fact, type Reaction,
  type FactWithReactions, type ReactionType,
} from "@shared/schema";
import { randomBytes } from "crypto";

export interface IStorage {
  createUser(name: string, avatar: string, pairingId: number | null): Promise<User>;
  getUser(id: number): Promise<User | undefined>;

  createPairing(userId: number): Promise<Pairing>;
  getPairingByCode(code: string): Promise<Pairing | undefined>;
  getPairing(id: number): Promise<Pairing | undefined>;
  joinPairing(pairingId: number, userId: number): Promise<Pairing>;

  createFact(authorId: number, pairingId: number, text: string, categories: string[], date: string, imageUrl?: string): Promise<Fact>;
  getFactsByPairing(pairingId: number): Promise<FactWithReactions[]>;
  hasPostedToday(authorId: number, pairingId: number, date: string): Promise<boolean>;

  getFact(factId: number): Promise<Fact | undefined>;
  setReaction(factId: number, userId: number, type: string): Promise<void>;
  removeReaction(factId: number, userId: number): Promise<void>;
  getReaction(factId: number, userId: number): Promise<Reaction | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createUser(name: string, avatar: string, pairingId: number | null): Promise<User> {
    const [user] = await db.insert(users).values({ name, avatar, pairingId }).returning();
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createPairing(userId: number): Promise<Pairing> {
    const inviteCode = randomBytes(8).toString("hex");
    const [pairing] = await db.insert(pairings).values({ inviteCode, user1Id: userId }).returning();
    await db.update(users).set({ pairingId: pairing.id }).where(eq(users.id, userId));
    return pairing;
  }

  async getPairingByCode(code: string): Promise<Pairing | undefined> {
    const [pairing] = await db.select().from(pairings).where(eq(pairings.inviteCode, code));
    return pairing;
  }

  async getPairing(id: number): Promise<Pairing | undefined> {
    const [pairing] = await db.select().from(pairings).where(eq(pairings.id, id));
    return pairing;
  }

  async joinPairing(pairingId: number, userId: number): Promise<Pairing> {
    const [pairing] = await db.update(pairings).set({ user2Id: userId }).where(eq(pairings.id, pairingId)).returning();
    await db.update(users).set({ pairingId }).where(eq(users.id, userId));
    return pairing;
  }

  async createFact(authorId: number, pairingId: number, text: string, categories: string[], date: string, imageUrl?: string): Promise<Fact> {
    const [fact] = await db.insert(facts).values({
      text,
      imageUrl: imageUrl || null,
      authorId,
      pairingId,
      date,
      categories: categories as any,
    }).returning();
    return fact;
  }

  async hasPostedToday(authorId: number, pairingId: number, date: string): Promise<boolean> {
    const [existing] = await db.select().from(facts).where(and(eq(facts.authorId, authorId), eq(facts.pairingId, pairingId), eq(facts.date, date)));
    return !!existing;
  }

  async getFactsByPairing(pairingId: number): Promise<FactWithReactions[]> {
    const allFacts = await db.select().from(facts).where(eq(facts.pairingId, pairingId)).orderBy(desc(facts.id));
    if (allFacts.length === 0) return [];

    const factIds = allFacts.map(f => f.id);
    const pairingReactions = await db.select().from(reactions).where(inArray(reactions.factId, factIds));

    return allFacts.map(fact => {
      const factReactions = pairingReactions.filter(r => r.factId === fact.id);
      const reactionsMap: Record<string, ReactionType | null> = {};
      for (const r of factReactions) {
        reactionsMap[String(r.userId)] = r.type as ReactionType;
      }
      return { ...fact, reactions: reactionsMap };
    });
  }

  async getFact(factId: number): Promise<Fact | undefined> {
    const [fact] = await db.select().from(facts).where(eq(facts.id, factId));
    return fact;
  }

  async setReaction(factId: number, userId: number, type: string): Promise<void> {
    const existing = await this.getReaction(factId, userId);
    if (existing) {
      await db.update(reactions).set({ type }).where(eq(reactions.id, existing.id));
    } else {
      await db.insert(reactions).values({ factId, userId, type });
    }
  }

  async removeReaction(factId: number, userId: number): Promise<void> {
    await db.delete(reactions).where(and(eq(reactions.factId, factId), eq(reactions.userId, userId)));
  }

  async getReaction(factId: number, userId: number): Promise<Reaction | undefined> {
    const [reaction] = await db.select().from(reactions).where(and(eq(reactions.factId, factId), eq(reactions.userId, userId)));
    return reaction;
  }
}

export const storage = new DatabaseStorage();
