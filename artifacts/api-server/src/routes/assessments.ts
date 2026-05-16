import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  assessmentsTable,
  assessmentQuestionsTable,
  careerSuggestionsTable,
  profilesTable,
} from "@workspace/db";
import {
  CreateAssessmentBody,
  GetAssessmentParams,
  SubmitAssessmentParams,
  SubmitAssessmentBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const ASSESSMENT_QUESTIONS = [
  {
    questionText: "How do you prefer to spend a typical workday?",
    questionType: "multiple_choice" as const,
    options: JSON.stringify([
      "Solving complex technical problems",
      "Interacting with people and building relationships",
      "Creating and designing new ideas",
      "Organizing and managing processes",
      "Researching and analyzing data",
    ]),
    orderIndex: 0,
  },
  {
    questionText: "Rate your comfort with working in high-pressure, fast-paced environments (1 = very uncomfortable, 10 = thrive in it)",
    questionType: "scale" as const,
    options: null,
    orderIndex: 1,
  },
  {
    questionText: "What type of impact do you most want to have through your work?",
    questionType: "multiple_choice" as const,
    options: JSON.stringify([
      "Help people directly (healthcare, education, social work)",
      "Build technology that improves lives",
      "Create art, culture, or media",
      "Drive business growth and wealth creation",
      "Advance scientific or academic knowledge",
    ]),
    orderIndex: 2,
  },
  {
    questionText: "How do you handle ambiguity and uncertain situations?",
    questionType: "multiple_choice" as const,
    options: JSON.stringify([
      "I thrive in it — I create structure from chaos",
      "I cope reasonably well but prefer some clarity",
      "I prefer clear guidelines but can handle some ambiguity",
      "I work best with clear, well-defined tasks",
    ]),
    orderIndex: 3,
  },
  {
    questionText: "Rate your self-discipline and ability to work independently without supervision (1 = need lots of guidance, 10 = completely self-driven)",
    questionType: "scale" as const,
    options: null,
    orderIndex: 4,
  },
  {
    questionText: "Which of these describes your strongest natural ability?",
    questionType: "multiple_choice" as const,
    options: JSON.stringify([
      "Logical and analytical reasoning",
      "Empathy and understanding people",
      "Creative and innovative thinking",
      "Leadership and influencing others",
      "Attention to detail and precision",
    ]),
    orderIndex: 5,
  },
  {
    questionText: "How important is financial reward compared to job satisfaction and purpose?",
    questionType: "multiple_choice" as const,
    options: JSON.stringify([
      "Financial reward is my top priority",
      "Both are equally important",
      "Job satisfaction and purpose matter more",
      "Purpose and impact are what drive me, money is secondary",
    ]),
    orderIndex: 6,
  },
  {
    questionText: "Rate your willingness to invest in years of further education or training for your career (1 = minimal further study, 10 = willing to study for many years)",
    questionType: "scale" as const,
    options: null,
    orderIndex: 7,
  },
  {
    questionText: "Describe in your own words: what does your ideal work environment look like?",
    questionType: "text" as const,
    options: null,
    orderIndex: 8,
  },
  {
    questionText: "What is your biggest fear or concern about choosing the wrong career?",
    questionType: "text" as const,
    options: null,
    orderIndex: 9,
  },
];

router.post("/assessments", async (req, res) => {
  const body = CreateAssessmentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [assessment] = await db
      .insert(assessmentsTable)
      .values({ profileId: body.data.profileId, status: "pending" })
      .returning();

    await db.insert(assessmentQuestionsTable).values(
      ASSESSMENT_QUESTIONS.map((q) => ({
        assessmentId: assessment.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        orderIndex: q.orderIndex,
      }))
    );

    res.status(201).json(assessment);
  } catch (err) {
    req.log.error({ err }, "Failed to create assessment");
    res.status(500).json({ error: "Failed to create assessment" });
  }
});

router.get("/assessments/:id", async (req, res) => {
  const params = GetAssessmentParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid assessment ID" });
    return;
  }
  try {
    const [assessment] = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.id, params.data.id));

    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const questions = await db
      .select()
      .from(assessmentQuestionsTable)
      .where(eq(assessmentQuestionsTable.assessmentId, params.data.id))
      .orderBy(assessmentQuestionsTable.orderIndex);

    res.json({ ...assessment, questions });
  } catch (err) {
    req.log.error({ err }, "Failed to get assessment");
    res.status(500).json({ error: "Failed to get assessment" });
  }
});

router.post("/assessments/:id/submit", async (req, res) => {
  const params = SubmitAssessmentParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid assessment ID" });
    return;
  }
  const body = SubmitAssessmentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const [assessment] = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.id, params.data.id));

    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, assessment.profileId));

    for (const ans of body.data.answers) {
      await db
        .update(assessmentQuestionsTable)
        .set({ answer: ans.answer })
        .where(eq(assessmentQuestionsTable.id, ans.questionId));
    }

    const questions = await db
      .select()
      .from(assessmentQuestionsTable)
      .where(eq(assessmentQuestionsTable.assessmentId, params.data.id))
      .orderBy(assessmentQuestionsTable.orderIndex);

    const qaText = questions
      .map((q) => `Q: ${q.questionText}\nA: ${q.answer ?? "Not answered"}`)
      .join("\n\n");

    const profileContext = profile
      ? `Name: ${profile.name}, Age: ${profile.age ?? "Unknown"}, Education: ${profile.educationLevel}, Field: ${profile.fieldOfStudy ?? "Unknown"}, Skills: ${profile.skills ?? "None listed"}, Interests: ${profile.interests ?? "None listed"}, Goals: ${profile.goals ?? "Not specified"}, Work Experience: ${profile.workExperience ?? "None"}`
      : "No profile info";

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `You are a brutally honest career counsellor AI. You do NOT sugarcoat. You give both the positives AND the negatives with equal weight. You spare nobody. Your job is to help people understand their true strengths and weaknesses so they can make informed career decisions. You always respond in valid JSON format only.`,
        },
        {
          role: "user",
          content: `Analyse this person's career assessment and provide honest, thorough feedback.

Profile: ${profileContext}

Assessment answers:
${qaText}

Respond ONLY with a valid JSON object in this exact structure:
{
  "score": <integer 1-100 representing overall career readiness/clarity score>,
  "analysis": "<2-3 paragraphs of honest, direct analysis of this person's career situation — include strengths AND weaknesses equally>",
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasToImprove": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "careerSuggestions": [
    {
      "careerTitle": "<career name>",
      "compatibilityScore": <integer 0-100>,
      "description": "<2-3 sentence description of this career and why it fits or partially fits>",
      "pros": ["<pro 1>", "<pro 2>", "<pro 3>"],
      "cons": ["<con 1>", "<con 2>", "<con 3 — be honest about challenges>"],
      "requiredSkills": ["<skill 1>", "<skill 2>", "<skill 3>"],
      "salaryRange": "<realistic salary range for this career in their likely geography>",
      "timeToAchieve": "<realistic time estimate to be job-ready>"
    }
  ]
}

Provide exactly 3-5 career suggestions. Be brutally honest about the cons — if something is hard, say so. Include at least one suggestion that is a strong match AND at least one that is an honest stretch goal.`,
        },
      ],
    });

    const rawContent = aiResponse.choices[0]?.message?.content ?? "{}";
    let parsed: {
      score: number;
      analysis: string;
      topStrengths: string[];
      areasToImprove: string[];
      careerSuggestions: Array<{
        careerTitle: string;
        compatibilityScore: number;
        description: string;
        pros: string[];
        cons: string[];
        requiredSkills: string[];
        salaryRange: string;
        timeToAchieve: string;
      }>;
    };

    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
        score: 50,
        analysis: rawContent,
        topStrengths: [],
        areasToImprove: [],
        careerSuggestions: [],
      };
    }

    await db
      .update(assessmentsTable)
      .set({ status: "completed", score: parsed.score, completedAt: new Date() })
      .where(eq(assessmentsTable.id, params.data.id));

    const savedSuggestions = [];
    for (const cs of parsed.careerSuggestions ?? []) {
      const [saved] = await db
        .insert(careerSuggestionsTable)
        .values({
          profileId: assessment.profileId,
          careerTitle: cs.careerTitle,
          compatibilityScore: cs.compatibilityScore,
          description: cs.description,
          pros: JSON.stringify(cs.pros ?? []),
          cons: JSON.stringify(cs.cons ?? []),
          requiredSkills: JSON.stringify(cs.requiredSkills ?? []),
          salaryRange: cs.salaryRange,
          timeToAchieve: cs.timeToAchieve,
        })
        .returning();
      savedSuggestions.push({
        ...saved,
        pros: JSON.parse(saved.pros) as string[],
        cons: JSON.parse(saved.cons) as string[],
        requiredSkills: JSON.parse(saved.requiredSkills) as string[],
      });
    }

    res.json({
      assessmentId: params.data.id,
      score: parsed.score,
      analysis: parsed.analysis,
      topStrengths: parsed.topStrengths ?? [],
      areasToImprove: parsed.areasToImprove ?? [],
      careerSuggestions: savedSuggestions,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit assessment");
    res.status(500).json({ error: "Failed to submit assessment" });
  }
});

export default router;
