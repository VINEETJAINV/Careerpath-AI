import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  profilesTable,
  conversations,
  assessmentsTable,
  careerSuggestionsTable,
} from "@workspace/db";
import {
  CreateProfileBody,
  UpdateProfileBody,
  GetProfileParams,
  UpdateProfileParams,
  GetProfileSummaryParams,
  GetProfileAssessmentResultParams,
} from "@workspace/api-zod";

const router = Router();

// ── Get current user's profile ──────────────────────────────────────────────
router.get("/profiles/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, req.user.id))
      .orderBy(desc(profilesTable.updatedAt))
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ error: "No profile found" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get my profile");
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.get("/profiles", async (req, res) => {
  try {
    const profiles = await db.select().from(profilesTable).orderBy(profilesTable.createdAt);
    res.json(profiles);
  } catch (err) {
    req.log.error({ err }, "Failed to list profiles");
    res.status(500).json({ error: "Failed to list profiles" });
  }
});

router.post("/profiles", async (req, res) => {
  const body = CreateProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [profile] = await db.insert(profilesTable).values({
      name: body.data.name,
      age: body.data.age ?? null,
      educationLevel: body.data.educationLevel,
      fieldOfStudy: body.data.fieldOfStudy ?? null,
      workExperience: body.data.workExperience ?? null,
      skills: body.data.skills ?? null,
      interests: body.data.interests ?? null,
      goals: body.data.goals ?? null,
      userId: req.isAuthenticated() ? req.user.id : null,
    }).returning();
    res.status(201).json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to create profile");
    res.status(500).json({ error: "Failed to create profile" });
  }
});

router.get("/profiles/:id", async (req, res) => {
  const params = GetProfileParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid profile ID" });
    return;
  }
  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, params.data.id));
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to get profile");
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.patch("/profiles/:id", async (req, res) => {
  const params = UpdateProfileParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid profile ID" });
    return;
  }
  const body = UpdateProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [updated] = await db
      .update(profilesTable)
      .set({
        ...body.data,
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.id, params.data.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/profiles/:id/assessment-result", async (req, res) => {
  const params = GetProfileAssessmentResultParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid profile ID" });
    return;
  }
  try {
    const [completed] = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.profileId, params.data.id))
      .orderBy(desc(assessmentsTable.completedAt));

    if (!completed || completed.status !== "completed") {
      res.status(404).json({ error: "No completed assessment found for this profile" });
      return;
    }

    res.json({
      assessmentId: completed.id,
      profileId: completed.profileId,
      score: completed.score ?? 0,
      analysis: completed.analysis ?? "",
      topStrengths: completed.topStrengths ? (JSON.parse(completed.topStrengths) as string[]) : [],
      areasToImprove: completed.areasToImprove ? (JSON.parse(completed.areasToImprove) as string[]) : [],
      completedAt: completed.completedAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get assessment result");
    res.status(500).json({ error: "Failed to get assessment result" });
  }
});

router.get("/profiles/:id/summary", async (req, res) => {
  const params = GetProfileSummaryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid profile ID" });
    return;
  }
  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, params.data.id));
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const allConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.profileId, params.data.id));

    const assessments = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.profileId, params.data.id));

    const completedAssessment = assessments.find((a) => a.status === "completed");

    const suggestions = await db
      .select()
      .from(careerSuggestionsTable)
      .where(eq(careerSuggestionsTable.profileId, params.data.id))
      .orderBy(desc(careerSuggestionsTable.compatibilityScore))
      .limit(1);

    const topMatch = suggestions[0];

    res.json({
      profileId: profile.id,
      name: profile.name,
      topCareerMatch: topMatch?.careerTitle ?? null,
      compatibilityScore: topMatch?.compatibilityScore ?? null,
      assessmentCompleted: !!completedAssessment,
      totalConversations: allConversations.length,
      lastActivity: profile.updatedAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get profile summary");
    res.status(500).json({ error: "Failed to get profile summary" });
  }
});

export default router;
