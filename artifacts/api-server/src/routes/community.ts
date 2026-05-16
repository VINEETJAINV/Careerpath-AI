import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  profilesTable,
  assessmentsTable,
  assessmentQuestionsTable,
  careerSuggestionsTable,
} from "@workspace/db";

const router = Router();

router.get("/community/insights", async (req, res) => {
  const rawProfileId = req.query["profileId"];
  const profileId = rawProfileId ? Number(rawProfileId) : null;

  try {
    const [{ count: totalMembers }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(profilesTable);

    const completedAssessments = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.status, "completed"));

    const assessmentsCompleted = completedAssessments.length;

    const scores = completedAssessments
      .map((a) => a.score ?? 0)
      .filter((s) => s > 0);

    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    const scoreDistribution = [
      { range: "0–25", count: scores.filter((s) => s <= 25).length },
      { range: "26–50", count: scores.filter((s) => s > 25 && s <= 50).length },
      { range: "51–75", count: scores.filter((s) => s > 50 && s <= 75).length },
      { range: "76–100", count: scores.filter((s) => s > 75).length },
    ];

    const myScore =
      profileId !== null
        ? (completedAssessments.find((a) => a.profileId === profileId)?.score ?? null)
        : null;

    const allSuggestions = await db.select().from(careerSuggestionsTable);
    const careerMap = new Map<string, { count: number; totalScore: number }>();
    for (const s of allSuggestions) {
      const existing = careerMap.get(s.careerTitle);
      if (existing) {
        existing.count += 1;
        existing.totalScore += s.compatibilityScore;
      } else {
        careerMap.set(s.careerTitle, { count: 1, totalScore: s.compatibilityScore });
      }
    }
    const topCareers = Array.from(careerMap.entries())
      .map(([careerTitle, { count, totalScore }]) => ({
        careerTitle,
        count,
        avgCompatibilityScore: Math.round(totalScore / count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const strengthFreq = new Map<string, number>();
    const improveFreq = new Map<string, number>();
    for (const a of completedAssessments) {
      if (a.topStrengths) {
        try {
          const items = JSON.parse(a.topStrengths) as string[];
          for (const item of items) {
            const key = item.trim();
            if (key) strengthFreq.set(key, (strengthFreq.get(key) ?? 0) + 1);
          }
        } catch { /* skip malformed */ }
      }
      if (a.areasToImprove) {
        try {
          const items = JSON.parse(a.areasToImprove) as string[];
          for (const item of items) {
            const key = item.trim();
            if (key) improveFreq.set(key, (improveFreq.get(key) ?? 0) + 1);
          }
        } catch { /* skip malformed */ }
      }
    }

    const topStrengths = Array.from(strengthFreq.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topAreasToImprove = Array.from(improveFreq.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const completedAssessmentIds = completedAssessments.map((a) => a.id);
    let myAssessmentId: number | null = null;
    if (profileId !== null) {
      myAssessmentId =
        completedAssessments.find((a) => a.profileId === profileId)?.id ?? null;
    }

    let allQuestions: (typeof assessmentQuestionsTable.$inferSelect)[] = [];
    if (completedAssessmentIds.length > 0) {
      allQuestions = await db.select().from(assessmentQuestionsTable);
      allQuestions = allQuestions.filter((q) =>
        completedAssessmentIds.includes(q.assessmentId)
      );
    }

    const questionMap = new Map<
      string,
      { questionType: string; answerFreq: Map<string, number>; myAnswer: string | null }
    >();

    for (const q of allQuestions) {
      if (q.questionType === "open_text" || !q.answer) continue;

      const existing = questionMap.get(q.questionText);
      const entry = existing ?? {
        questionType: q.questionType,
        answerFreq: new Map<string, number>(),
        myAnswer: null,
      };

      if (q.questionType === "multiple_select") {
        const parts = q.answer.split("|").map((p) => p.trim()).filter(Boolean);
        for (const part of parts) {
          entry.answerFreq.set(part, (entry.answerFreq.get(part) ?? 0) + 1);
        }
      } else {
        entry.answerFreq.set(q.answer, (entry.answerFreq.get(q.answer) ?? 0) + 1);
      }

      if (myAssessmentId !== null && q.assessmentId === myAssessmentId) {
        entry.myAnswer = q.answer;
      }

      if (!existing) questionMap.set(q.questionText, entry);
    }

    const questionBreakdowns = Array.from(questionMap.entries()).map(
      ([questionText, { questionType, answerFreq, myAnswer }]) => ({
        questionText,
        questionType,
        myAnswer,
        answers: Array.from(answerFreq.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
      })
    );

    res.json({
      totalMembers,
      assessmentsCompleted,
      avgScore,
      myScore,
      scoreDistribution,
      topCareers,
      topStrengths,
      topAreasToImprove,
      questionBreakdowns,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get community insights");
    res.status(500).json({ error: "Failed to get community insights" });
  }
});

export default router;
