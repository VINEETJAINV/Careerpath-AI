import { Router } from "express";
import { eq, and, desc, isNull, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  profilesTable,
  assessmentsTable,
  careerSuggestionsTable,
  profileCommentsTable,
  roadmapProgressTable,
  userSkillsTable,
  learningResourcesTable,
  progressPostsTable,
  userResourceProgressTable,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ── Community members directory (public profiles only) ────────────────────────
router.get("/community/members", async (req, res) => {
  try {
    const profiles = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.isPublic, 1))
      .orderBy(desc(profilesTable.createdAt));

    const assessments = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.status, "completed"));

    const topCareers = await db
      .select()
      .from(careerSuggestionsTable)
      .orderBy(desc(careerSuggestionsTable.compatibilityScore));

    const assessmentMap = new Map(assessments.map((a) => [a.profileId, a]));
    const topCareerMap = new Map<number, typeof topCareers[0]>();
    for (const c of topCareers) {
      if (!topCareerMap.has(c.profileId)) topCareerMap.set(c.profileId, c);
    }

    const members = profiles.map((p) => {
      const assessment = assessmentMap.get(p.id);
      const career = topCareerMap.get(p.id);
      return {
        profileId: p.id,
        name: p.name,
        topCareer: career?.careerTitle ?? null,
        compatibilityScore: career?.compatibilityScore ?? null,
        assessmentCompleted: !!assessment,
        createdAt: p.createdAt.toISOString(),
      };
    });

    res.json(members);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch community members" });
  }
});

// ── Community progress feed (public profiles only) ───────────────────────────
router.get("/community/feed", async (req, res) => {
  try {
    const posts = await db
      .select({
        post: progressPostsTable,
        isPublic: profilesTable.isPublic,
      })
      .from(progressPostsTable)
      .leftJoin(profilesTable, eq(progressPostsTable.profileId, profilesTable.id))
      .where(eq(profilesTable.isPublic, 1))
      .orderBy(desc(progressPostsTable.createdAt))
      .limit(50);

    res.json(
      posts.map(({ post }) => ({
        ...post,
        createdAt: post.createdAt.toISOString(),
        metadata: post.metadata ?? null,
      }))
    );
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch community feed" });
  }
});

// ── Public profile view ───────────────────────────────────────────────────────
router.get("/profiles/:id/public", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, id));
    if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

    // Only allow viewing if public, or if it's the authenticated owner
    const viewerUserId = req.isAuthenticated() ? req.user.id : null;
    const isOwner = viewerUserId && profile.userId === viewerUserId;
    if (!profile.isPublic && !isOwner) {
      res.status(403).json({ error: "This profile is private" });
      return;
    }

    const [assessment] = await db
      .select()
      .from(assessmentsTable)
      .where(and(eq(assessmentsTable.profileId, id), eq(assessmentsTable.status, "completed")));

    const suggestions = await db
      .select()
      .from(careerSuggestionsTable)
      .where(eq(careerSuggestionsTable.profileId, id))
      .orderBy(desc(careerSuggestionsTable.compatibilityScore));

    const progress = await db
      .select()
      .from(roadmapProgressTable)
      .where(eq(roadmapProgressTable.profileId, id));

    const skills = await db
      .select()
      .from(userSkillsTable)
      .where(eq(userSkillsTable.profileId, id));

    res.json({
      profileId: profile.id,
      name: profile.name,
      educationLevel: profile.educationLevel,
      fieldOfStudy: profile.fieldOfStudy ?? null,
      workExperience: profile.workExperience ?? null,
      goals: profile.goals ?? null,
      assessmentCompleted: !!assessment,
      score: assessment?.score ?? null,
      analysis: assessment?.analysis ?? null,
      topStrengths: assessment?.topStrengths ? JSON.parse(assessment.topStrengths) : [],
      areasToImprove: assessment?.areasToImprove ? JSON.parse(assessment.areasToImprove) : [],
      careerSuggestions: suggestions.map((s) => ({
        ...s,
        pros: JSON.parse(s.pros),
        cons: JSON.parse(s.cons),
        requiredSkills: JSON.parse(s.requiredSkills),
        createdAt: s.createdAt.toISOString(),
      })),
      progress: progress.map((p) => ({
        ...p,
        completed: p.completed === 1,
        completedAt: p.completedAt?.toISOString() ?? null,
      })),
      skills: skills.map((s) => ({
        ...s,
        testedAt: s.testedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
      createdAt: profile.createdAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch public profile" });
  }
});

// ── Privacy toggle ────────────────────────────────────────────────────────────
router.put("/profiles/:id/privacy", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { isPublic } = req.body as { isPublic?: boolean };
  if (typeof isPublic !== "boolean") {
    res.status(400).json({ error: "isPublic (boolean) required" });
    return;
  }

  try {
    await db
      .update(profilesTable)
      .set({ isPublic: isPublic ? 1 : 0, updatedAt: new Date() })
      .where(eq(profilesTable.id, id));
    res.json({ success: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to update privacy" });
  }
});

// ── Comments ──────────────────────────────────────────────────────────────────
router.get("/profiles/:id/comments", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const comments = await db
      .select()
      .from(profileCommentsTable)
      .where(eq(profileCommentsTable.profileId, id))
      .orderBy(desc(profileCommentsTable.createdAt));

    res.json(comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/profiles/:id/comments", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Must be logged in to comment" });
    return;
  }
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { content } = req.body as { content?: string };
  if (!content?.trim()) { res.status(400).json({ error: "Comment content required" }); return; }

  try {
    const authorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Anonymous";
    const [comment] = await db.insert(profileCommentsTable).values({
      profileId: id,
      authorUserId: req.user.id,
      authorName,
      content: content.trim(),
    }).returning();

    res.status(201).json({ ...comment, createdAt: comment!.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ── Roadmap progress ──────────────────────────────────────────────────────────
router.get("/profiles/:id/progress", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const career = req.query["career"] as string | undefined;

  try {
    const query = db.select().from(roadmapProgressTable).where(
      career
        ? and(eq(roadmapProgressTable.profileId, id), eq(roadmapProgressTable.careerTitle, career))
        : eq(roadmapProgressTable.profileId, id)
    );

    const rows = await query;
    res.json(rows.map((r) => ({
      ...r,
      completed: r.completed === 1,
      completedAt: r.completedAt?.toISOString() ?? null,
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

router.put("/profiles/:id/progress", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const {
    careerTitle,
    milestoneIndex,
    phaseIndex,
    completed,
    status,
    progressPercent,
    notes,
  } = req.body as {
    careerTitle: string;
    milestoneIndex: number;
    phaseIndex: number;
    completed?: boolean;
    status?: "not_started" | "in_progress" | "completed";
    progressPercent?: number;
    notes?: string;
  };

  if (!careerTitle || milestoneIndex === undefined || phaseIndex === undefined) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const effectiveStatus = status ?? (completed ? "completed" : "not_started");
  const effectiveCompleted = effectiveStatus === "completed" ? 1 : 0;
  const effectivePercent = progressPercent ?? (effectiveCompleted ? 100 : 0);

  try {
    const [existing] = await db
      .select()
      .from(roadmapProgressTable)
      .where(
        and(
          eq(roadmapProgressTable.profileId, id),
          eq(roadmapProgressTable.careerTitle, careerTitle),
          eq(roadmapProgressTable.milestoneIndex, milestoneIndex),
          eq(roadmapProgressTable.phaseIndex, phaseIndex),
        )
      );

    let row;
    if (existing) {
      [row] = await db
        .update(roadmapProgressTable)
        .set({
          status: effectiveStatus,
          progressPercent: effectivePercent,
          completed: effectiveCompleted,
          completedAt: effectiveCompleted ? new Date() : null,
          notes: notes ?? existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(roadmapProgressTable.id, existing.id))
        .returning();
    } else {
      [row] = await db
        .insert(roadmapProgressTable)
        .values({
          profileId: id,
          careerTitle,
          milestoneIndex,
          phaseIndex,
          status: effectiveStatus,
          progressPercent: effectivePercent,
          completed: effectiveCompleted,
          completedAt: effectiveCompleted ? new Date() : null,
          notes: notes ?? null,
        })
        .returning();
    }

    res.json({
      ...row!,
      completed: row!.completed === 1,
      completedAt: row!.completedAt?.toISOString() ?? null,
      createdAt: row!.createdAt.toISOString(),
      updatedAt: row!.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

// ── Skills ────────────────────────────────────────────────────────────────────
router.get("/profiles/:id/skills", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const skills = await db
      .select()
      .from(userSkillsTable)
      .where(eq(userSkillsTable.profileId, id))
      .orderBy(desc(userSkillsTable.updatedAt));

    res.json(skills.map((s) => ({
      ...s,
      testedAt: s.testedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

router.post("/profiles/:id/skills", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { skillName, selfRating } = req.body as { skillName?: string; selfRating?: number };
  if (!skillName?.trim()) { res.status(400).json({ error: "Skill name required" }); return; }

  try {
    const [skill] = await db
      .insert(userSkillsTable)
      .values({
        profileId: id,
        skillName: skillName.trim(),
        selfRating: selfRating ?? null,
      })
      .returning();

    res.status(201).json({
      ...skill!,
      testedAt: null,
      createdAt: skill!.createdAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to add skill" });
  }
});

router.delete("/profiles/:id/skills/:skillId", async (req, res) => {
  const id = Number(req.params.id);
  const skillId = Number(req.params.skillId);
  if (isNaN(id) || isNaN(skillId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    await db.delete(userSkillsTable).where(
      and(eq(userSkillsTable.id, skillId), eq(userSkillsTable.profileId, id))
    );
    res.json({ success: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to delete skill" });
  }
});

// ── Skill test question generation ───────────────────────────────────────────
router.get("/profiles/:id/skills/:skillId/questions", async (req, res) => {
  const skillId = Number(req.params.skillId);
  if (isNaN(skillId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const [skill] = await db.select().from(userSkillsTable).where(eq(userSkillsTable.id, skillId));
    if (!skill) { res.status(404).json({ error: "Skill not found" }); return; }

    const prompt = `You are a skill assessment expert. Generate 5 multiple-choice questions to assess someone's practical level in "${skill.skillName}". Questions should range from beginner to intermediate to advanced. Each question must have exactly 4 options (A, B, C, D) with one clearly correct answer.

Return ONLY valid JSON in this exact format:
[
  {
    "index": 0,
    "question": "question text here",
    "options": ["A: ...", "B: ...", "C: ...", "D: ..."],
    "correct": "A"
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let questions;
    try {
      const parsed = JSON.parse(raw);
      questions = Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
    } catch {
      questions = [];
    }

    res.json({ questions, skillName: skill.skillName });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// ── Skill test submission ─────────────────────────────────────────────────────
router.post("/profiles/:id/skills/:skillId/test", async (req, res) => {
  const id = Number(req.params.id);
  const skillId = Number(req.params.skillId);
  if (isNaN(id) || isNaN(skillId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { answers, questions } = req.body as {
    answers: Array<{ questionIndex: number; answer: string }>;
    questions: Array<{ index: number; question: string; options: string[]; correct?: string }>;
  };

  try {
    const [skill] = await db.select().from(userSkillsTable).where(eq(userSkillsTable.id, skillId));
    if (!skill) { res.status(404).json({ error: "Skill not found" }); return; }

    const qa = questions.map((q) => {
      const a = answers.find((ans) => ans.questionIndex === q.index);
      return `Q: ${q.question}\nUser answered: ${a?.answer ?? "(none)"}\nCorrect answer: ${q.correct ?? "N/A"}`;
    }).join("\n\n");

    const prompt = `You are evaluating a skill test for "${skill.skillName}" (self-rated ${skill.selfRating ?? "?"}/10).

Questions and answers:
${qa}

Based on these answers, assess the person's actual skill level on a scale of 1-10 (1=complete beginner, 10=expert).
Also provide honest, specific, actionable advice on what to learn or do next to improve this skill toward their career goals.

Return ONLY valid JSON:
{
  "testedLevel": <number 1-10>,
  "summary": "<2-3 sentence honest assessment of their current level>",
  "advice": ["<specific action 1>", "<specific action 2>", "<specific action 3>", "<specific action 4>"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw) as { testedLevel: number; summary: string; advice: string[] };

    await db
      .update(userSkillsTable)
      .set({
        testedLevel: result.testedLevel,
        testedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userSkillsTable.id, skillId));

    res.json({
      skillId,
      skillName: skill.skillName,
      testedLevel: result.testedLevel,
      summary: result.summary,
      advice: result.advice,
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to evaluate skill test" });
  }
});

// ── Skill learning resources ──────────────────────────────────────────────────
router.get("/profiles/:id/skills/:skillId/resources", async (req, res) => {
  const id = Number(req.params.id);
  const skillId = Number(req.params.skillId);
  if (isNaN(id) || isNaN(skillId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const resources = await db
      .select()
      .from(learningResourcesTable)
      .where(
        and(
          eq(learningResourcesTable.profileId, id),
          eq(learningResourcesTable.userSkillId, skillId)
        )
      )
      .orderBy(learningResourcesTable.createdAt);

    res.json(resources.map((r) => ({
      ...r,
      isFree: r.isFree === 1,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch skill resources" });
  }
});

router.post("/profiles/:id/skills/:skillId/resources", async (req, res) => {
  const id = Number(req.params.id);
  const skillId = Number(req.params.skillId);
  if (isNaN(id) || isNaN(skillId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const [skill] = await db.select().from(userSkillsTable).where(eq(userSkillsTable.id, skillId));
    if (!skill) { res.status(404).json({ error: "Skill not found" }); return; }

    // Clear old generated resources first
    await db.delete(learningResourcesTable).where(
      and(
        eq(learningResourcesTable.profileId, id),
        eq(learningResourcesTable.userSkillId, skillId)
      )
    );

    const levelLabel = skill.testedLevel
      ? `tested at ${skill.testedLevel}/10`
      : skill.selfRating
      ? `self-rated at ${skill.selfRating}/10`
      : "beginner level";

    const prompt = `You are a learning resource curator. For someone learning "${skill.skillName}" (currently ${levelLabel}), recommend 6 specific learning resources.

Include a mix of: free online courses, YouTube channels/playlists, documentation, practice platforms, and books.
Be specific — use real, well-known platform names (Coursera, Udemy, YouTube, freeCodeCamp, MDN, Codecademy, etc.).
Tailor difficulty to their current level.

Return ONLY valid JSON array:
[
  {
    "resourceType": "course|youtube|book|tool|website|documentation",
    "title": "exact resource title",
    "platform": "platform name",
    "url": "https://...",
    "description": "1-2 sentences on what they'll learn and why it suits their level",
    "difficulty": "beginner|intermediate|advanced",
    "isFree": true or false
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let items: Array<{
      resourceType: string;
      title: string;
      platform?: string;
      url?: string;
      description?: string;
      difficulty?: string;
      isFree: boolean;
    }>;
    try {
      const parsed = JSON.parse(raw);
      items = Array.isArray(parsed) ? parsed : (parsed.resources ?? parsed.items ?? []);
    } catch {
      items = [];
    }

    const inserted = await db
      .insert(learningResourcesTable)
      .values(
        items.map((r) => ({
          profileId: id,
          userSkillId: skillId,
          resourceType: r.resourceType ?? "website",
          title: r.title,
          platform: r.platform ?? null,
          url: r.url ?? null,
          description: r.description ?? null,
          difficulty: r.difficulty ?? null,
          isFree: r.isFree ? 1 : 0,
        }))
      )
      .returning();

    res.json(inserted.map((r) => ({
      ...r,
      isFree: r.isFree === 1,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to generate skill resources" });
  }
});

// ── Career learning resources ─────────────────────────────────────────────────
router.get("/profiles/:id/careers/:careerId/resources", async (req, res) => {
  const id = Number(req.params.id);
  const careerId = Number(req.params.careerId);
  if (isNaN(id) || isNaN(careerId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const resources = await db
      .select()
      .from(learningResourcesTable)
      .where(
        and(
          eq(learningResourcesTable.profileId, id),
          eq(learningResourcesTable.careerSuggestionId, careerId)
        )
      )
      .orderBy(learningResourcesTable.createdAt);

    res.json(resources.map((r) => ({
      ...r,
      isFree: r.isFree === 1,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch career resources" });
  }
});

router.post("/profiles/:id/careers/:careerId/resources", async (req, res) => {
  const id = Number(req.params.id);
  const careerId = Number(req.params.careerId);
  if (isNaN(id) || isNaN(careerId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const [career] = await db
      .select()
      .from(careerSuggestionsTable)
      .where(and(eq(careerSuggestionsTable.id, careerId), eq(careerSuggestionsTable.profileId, id)));

    if (!career) { res.status(404).json({ error: "Career not found" }); return; }

    // Clear old generated resources first
    await db.delete(learningResourcesTable).where(
      and(
        eq(learningResourcesTable.profileId, id),
        eq(learningResourcesTable.careerSuggestionId, careerId)
      )
    );

    const requiredSkills: string[] = JSON.parse(career.requiredSkills ?? "[]");

    const prompt = `You are a career learning curator. Someone wants to become a "${career.careerTitle}" (${career.compatibilityScore}% compatibility match).

Key skills they need: ${requiredSkills.join(", ") || "general professional skills"}

Recommend 8 specific, actionable learning resources to help them transition into this career. Include:
- Online courses (Coursera, Udemy, edX, LinkedIn Learning)
- Free platforms (YouTube, freeCodeCamp, Khan Academy, Codecademy)
- Official documentation or certification paths
- Books or blogs
- Practice platforms or communities

Return ONLY valid JSON array:
[
  {
    "resourceType": "course|youtube|book|tool|website|certification|documentation",
    "title": "exact resource title",
    "platform": "platform name",
    "url": "https://...",
    "description": "1-2 sentences on what they'll learn and why it helps for this career",
    "difficulty": "beginner|intermediate|advanced",
    "isFree": true or false
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let items: Array<{
      resourceType: string;
      title: string;
      platform?: string;
      url?: string;
      description?: string;
      difficulty?: string;
      isFree: boolean;
    }>;
    try {
      const parsed = JSON.parse(raw);
      items = Array.isArray(parsed) ? parsed : (parsed.resources ?? parsed.items ?? []);
    } catch {
      items = [];
    }

    const inserted = await db
      .insert(learningResourcesTable)
      .values(
        items.map((r) => ({
          profileId: id,
          careerSuggestionId: careerId,
          resourceType: r.resourceType ?? "website",
          title: r.title,
          platform: r.platform ?? null,
          url: r.url ?? null,
          description: r.description ?? null,
          difficulty: r.difficulty ?? null,
          isFree: r.isFree ? 1 : 0,
        }))
      )
      .returning();

    res.json(inserted.map((r) => ({
      ...r,
      isFree: r.isFree === 1,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to generate career resources" });
  }
});

// ── Resource progress tracking ────────────────────────────────────────────────
router.put("/profiles/:id/resources/:resourceId/progress", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Must be logged in" }); return; }
  const id = Number(req.params.id);
  const resourceId = Number(req.params.resourceId);
  if (isNaN(id) || isNaN(resourceId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { status, notes } = req.body as { status?: string; notes?: string };
  if (!status) { res.status(400).json({ error: "status required" }); return; }

  try {
    const [existing] = await db
      .select()
      .from(userResourceProgressTable)
      .where(and(
        eq(userResourceProgressTable.profileId, id),
        eq(userResourceProgressTable.resourceId, resourceId)
      ));

    let row;
    if (existing) {
      [row] = await db
        .update(userResourceProgressTable)
        .set({
          status,
          notes: notes ?? existing.notes,
          completedAt: status === "completed" ? new Date() : existing.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(userResourceProgressTable.id, existing.id))
        .returning();
    } else {
      [row] = await db
        .insert(userResourceProgressTable)
        .values({
          profileId: id,
          resourceId,
          status,
          notes: notes ?? null,
          completedAt: status === "completed" ? new Date() : null,
        })
        .returning();
    }

    res.json({
      ...row,
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to update resource progress" });
  }
});

// ── Progress posts ────────────────────────────────────────────────────────────
router.post("/profiles/:id/progress-posts", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Must be logged in to post" });
    return;
  }
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { content, postType, metadata } = req.body as {
    content?: string;
    postType?: string;
    metadata?: string;
  };
  if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }

  try {
    const authorName =
      [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Anonymous";
    const [post] = await db
      .insert(progressPostsTable)
      .values({
        profileId: id,
        authorName,
        content: content.trim(),
        postType: postType ?? "general_update",
        metadata: metadata ?? null,
      })
      .returning();

    res.status(201).json({
      ...post!,
      createdAt: post!.createdAt.toISOString(),
      metadata: post!.metadata ?? null,
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to create post" });
  }
});

export default router;
