import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  profilesTable,
  assessmentsTable,
  careerSuggestionsTable,
  profileCommentsTable,
  roadmapProgressTable,
  userSkillsTable,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ── Community members directory ──────────────────────────────────────────────
router.get("/community/members", async (req, res) => {
  try {
    const profiles = await db
      .select()
      .from(profilesTable)
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

// ── Public profile view ───────────────────────────────────────────────────────
router.get("/profiles/:id/public", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, id));
    if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

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

  const { careerTitle, milestoneIndex, phaseIndex, completed } = req.body as {
    careerTitle: string;
    milestoneIndex: number;
    phaseIndex: number;
    completed: boolean;
  };

  if (!careerTitle || milestoneIndex === undefined || phaseIndex === undefined) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

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
          completed: completed ? 1 : 0,
          completedAt: completed ? new Date() : null,
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
          completed: completed ? 1 : 0,
          completedAt: completed ? new Date() : null,
        })
        .returning();
    }

    res.json({ ...row!, completed: row!.completed === 1, completedAt: row!.completedAt?.toISOString() ?? null });
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

export default router;
