import type { Express, Request, Response } from "express";
import type { Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { insertUserSchema, insertFactSchema, insertReactionSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: number;
    pairingId: number;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "curio-secret-key-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  function requireAuth(req: Request, res: Response, next: () => void) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  }

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Name is required" });
      }

      const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(parsed.data.name)}&backgroundColor=e5e4df`;
      const user = await storage.createUser(parsed.data.name, avatar, null);
      const pairing = await storage.createPairing(user.id);

      req.session.userId = user.id;
      req.session.pairingId = pairing.id;

      res.json({
        user: { id: user.id, name: user.name, avatar: user.avatar },
        pairing: { id: pairing.id, inviteCode: pairing.inviteCode },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/join/:inviteCode", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Name is required" });
      }

      const pairing = await storage.getPairingByCode(req.params.inviteCode);
      if (!pairing) {
        return res.status(404).json({ message: "Invite not found" });
      }
      if (pairing.user2Id) {
        return res.status(400).json({ message: "This pairing is already full" });
      }

      const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(parsed.data.name)}&backgroundColor=ffd5dc`;
      const user = await storage.createUser(parsed.data.name, avatar, pairing.id);
      await storage.joinPairing(pairing.id, user.id);

      req.session.userId = user.id;
      req.session.pairingId = pairing.id;

      res.json({
        user: { id: user.id, name: user.name, avatar: user.avatar },
        pairing: { id: pairing.id, inviteCode: pairing.inviteCode },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const pairing = user.pairingId ? await storage.getPairing(user.pairingId) : null;
      let partner = null;
      if (pairing) {
        const partnerId = pairing.user1Id === user.id ? pairing.user2Id : pairing.user1Id;
        if (partnerId) {
          const p = await storage.getUser(partnerId);
          if (p) partner = { id: p.id, name: p.name, avatar: p.avatar };
        }
      }

      res.json({
        user: { id: user.id, name: user.name, avatar: user.avatar },
        pairing: pairing ? { id: pairing.id, inviteCode: pairing.inviteCode } : null,
        partner,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/facts", requireAuth, async (req, res) => {
    try {
      const factsData = await storage.getFactsByPairing(req.session.pairingId!);
      res.json(factsData);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/facts", requireAuth, async (req, res) => {
    try {
      const parsed = insertFactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "A discovery or image is needed", errors: parsed.error.flatten() });
      }

      const date = new Date().toISOString().split("T")[0];

      const alreadyPosted = await storage.hasPostedToday(req.session.userId!, req.session.pairingId!, date);
      if (alreadyPosted) {
        return res.status(400).json({ message: "You've already shared a discovery today" });
      }

      const fact = await storage.createFact(
        req.session.userId!,
        req.session.pairingId!,
        parsed.data.text,
        parsed.data.categories,
        date,
        parsed.data.imageUrl
      );

      res.json(fact);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/facts/:factId/react", requireAuth, async (req, res) => {
    try {
      const factId = parseInt(req.params.factId as string);
      if (isNaN(factId)) {
        return res.status(400).json({ message: "Invalid fact ID" });
      }

      const parsed = insertReactionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid reaction" });
      }

      const fact = await storage.getFact(factId);
      if (!fact || fact.pairingId !== req.session.pairingId) {
        return res.status(404).json({ message: "Fact not found" });
      }

      if (fact.authorId === req.session.userId) {
        return res.status(400).json({ message: "You can't react to your own discovery" });
      }

      const existing = await storage.getReaction(factId, req.session.userId!);
      if (existing && existing.type === parsed.data.type) {
        await storage.removeReaction(factId, req.session.userId!);
      } else {
        await storage.setReaction(factId, req.session.userId!, parsed.data.type);
      }

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
