import { Router } from "express";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  followedCareersTable,
  profilesTable,
  careerSuggestionsTable,
  roadmapProgressTable,
  userSkillsTable,
  assessmentsTable,
} from "@workspace/db";

const router = Router();

// ── Get followed careers ────────────────────────────────────────────────────
router.get("/profiles/:id/followed-careers", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const rows = await db
      .select()
      .from(followedCareersTable)
      .where(eq(followedCareersTable.profileId, id))
      .orderBy(desc(followedCareersTable.isPrimary), desc(followedCareersTable.followedAt));

    res.json(rows.map((r) => ({
      ...r,
      followedAt: r.followedAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch followed careers" });
  }
});

// ── Follow a career ───────────────────────────────────────────────────────
router.post("/profiles/:id/followed-careers", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Must be logged in" }); return; }
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { careerSuggestionId, careerTitle } = req.body as {
    careerSuggestionId?: number;
    careerTitle?: string;
  };
  if (!careerSuggestionId || !careerTitle?.trim()) {
    res.status(400).json({ error: "careerSuggestionId and careerTitle required" });
    return;
  }

  try {
    // Max 3 active
    const active = await db
      .select()
      .from(followedCareersTable)
      .where(and(
        eq(followedCareersTable.profileId, id),
        eq(followedCareersTable.status, "active")
      ));
    if (active.length >= 3) {
      res.status(400).json({ error: "Maximum 3 active careers. Archive one first." });
      return;
    }

    // First career becomes primary
    const isPrimary = active.length === 0 ? 1 : 0;

    const [row] = await db.insert(followedCareersTable).values({
      profileId: id,
      careerSuggestionId,
      careerTitle: careerTitle.trim(),
      isPrimary,
      status: "active",
    }).returning();

    res.status(201).json({
      ...row,
      followedAt: row.followedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to follow career" });
  }
});

// ── Unfollow a career ───────────────────────────────────────────────────────
router.delete("/profiles/:id/followed-careers/:careerId", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Must be logged in" }); return; }
  const id = Number(req.params.id);
  const careerId = Number(req.params.careerId);
  if (isNaN(id) || isNaN(careerId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    await db
      .delete(followedCareersTable)
      .where(and(
        eq(followedCareersTable.profileId, id),
        eq(followedCareersTable.id, careerId)
      ));
    res.json({ success: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to unfollow career" });
  }
});

// ── Update followed career (primary / status) ────────────────────────────
router.put("/profiles/:id/followed-careers/:careerId", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Must be logged in" }); return; }
  const id = Number(req.params.id);
  const careerId = Number(req.params.careerId);
  if (isNaN(id) || isNaN(careerId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { isPrimary, status } = req.body as { isPrimary?: number; status?: string };

  try {
    // If setting primary, clear all other primary flags
    if (isPrimary === 1) {
      await db
        .update(followedCareersTable)
        .set({ isPrimary: 0 })
        .where(eq(followedCareersTable.profileId, id));
    }

    const [row] = await db
      .update(followedCareersTable)
      .set({
        ...(isPrimary !== undefined ? { isPrimary } : {}),
        ...(status ? { status } : {}),
        updatedAt: new Date(),
      })
      .where(and(
        eq(followedCareersTable.profileId, id),
        eq(followedCareersTable.id, careerId)
      )).returning();

    res.json({
      ...row,
      followedAt: row.followedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to update career" });
  }
});

// ── Compare careers ─────────────────────────────────────────────────────────
router.get("/profiles/:id/compare-careers", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const followed = await db
      .select()
      .from(followedCareersTable)
      .where(and(
        eq(followedCareersTable.profileId, id),
        eq(followedCareersTable.status, "active")
      ));

    const suggestions = await db
      .select()
      .from(careerSuggestionsTable)
      .where(eq(careerSuggestionsTable.profileId, id));

    const careers = followed.map((f) => {
      const suggestion = suggestions.find((s) => s.id === f.careerSuggestionId);
      return {
        careerTitle: f.careerTitle,
        compatibilityScore: suggestion?.compatibilityScore ?? 0,
        requiredSkills: suggestion ? JSON.parse(suggestion.requiredSkills) as string[] : [],
        learningDifficulty: suggestion?.timeToAchieve ?? "Unknown",
        estimatedTimeline: suggestion?.timeToAchieve ?? "Unknown",
        salaryRange: suggestion?.salaryRange ?? "Unknown",
        industryGrowth: "High",
        pros: suggestion ? JSON.parse(suggestion.pros) as string[] : [],
        cons: suggestion ? JSON.parse(suggestion.cons) as string[] : [],
        recommendedCertifications: suggestion ? JSON.parse(suggestion.requiredSkills).slice(0, 3) as string[] : [],
        status: f.status,
        isPrimary: f.isPrimary,
      };
    });

    res.json({ careers });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to compare careers" });
  }
});

// ── Leaderboard ─────────────────────────────────────────────────────────────
router.get("/community/leaderboard", async (req, res) => {
  try {
    const publicProfiles = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.isPublic, 1));

    const allProgress = await db.select().from(roadmapProgressTable);
    const allSkills = await db.select().from(userSkillsTable);

    const entries = publicProfiles.map((p, idx) => {
      const userProgress = allProgress.filter((r) => r.profileId === p.id);
      const completedCount = userProgress.filter((r) => r.status === "completed" || r.completed === 1).length;
      const totalCount = userProgress.length || 1;
      const roadmapCompletion = Math.round((completedCount / totalCount) * 100);
      const skillsTested = allSkills.filter((s) => s.profileId === p.id && s.testedLevel != null).length;
      const totalScore = roadmapCompletion + skillsTested * 10;

      return {
        rank: idx + 1,
        profileId: p.id,
        name: p.name,
        topCareer: null,
        roadmapCompletion,
        skillsTested,
        totalScore,
        isPublic: p.isPublic,
      };
    });

    // Sort by totalScore desc, then re-rank
    entries.sort((a, b) => b.totalScore - a.totalScore);
    entries.forEach((e, i) => { e.rank = i + 1; });

    res.json(entries);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
