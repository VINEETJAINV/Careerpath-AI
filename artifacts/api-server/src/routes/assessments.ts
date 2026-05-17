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
    questionText: "When you imagine yourself doing fulfilling work, what does it look like?",
    questionType: "multiple_choice" as const,
    options: JSON.stringify([
      "Solving technical or intellectual problems",
      "Connecting with, helping, or teaching people",
      "Creating — art, music, writing, design, or performance",
      "Building something of my own (a business, product, or venture)",
      "Researching, studying, and advancing knowledge",
      "Working hands-on to build, repair, or craft things",
    ]),
    orderIndex: 0,
  },
  {
    questionText: "Rate your comfort with financial risk and uncertainty (1 = I need a stable income, 10 = I can handle unpredictable or no income for extended periods)",
    questionType: "scale" as const,
    options: null,
    orderIndex: 1,
  },
  {
    questionText: "What kinds of impact do you want your work to have? (Select all that apply)",
    questionType: "multiple_select" as const,
    options: JSON.stringify([
      "Help people directly (healthcare, education, social work)",
      "Build technology that improves lives",
      "Create art, culture, or meaningful experiences",
      "Drive business growth or create economic value",
      "Advance scientific or academic knowledge",
      "Protect the environment and natural world",
      "Entertain, inspire, or move people emotionally",
    ]),
    orderIndex: 2,
  },
  {
    questionText: "How do you feel about working within structures set by others?",
    questionType: "multiple_choice" as const,
    options: JSON.stringify([
      "I thrive with clear structure — I want to focus, not manage systems",
      "I'm fine with structure as long as I have autonomy in my role",
      "I prefer to create the structure myself rather than follow it",
      "I actively resist external structure — I need to work on my own terms",
    ]),
    orderIndex: 3,
  },
  {
    questionText: "Rate your self-discipline and ability to drive your own work without external accountability (1 = I need supervision and deadlines, 10 = fully self-directed)",
    questionType: "scale" as const,
    options: null,
    orderIndex: 4,
  },
  {
    questionText: "Which of these describe your natural abilities? (Select all that apply)",
    questionType: "multiple_select" as const,
    options: JSON.stringify([
      "Logical and analytical reasoning",
      "Empathy and understanding people",
      "Creative and innovative thinking",
      "Leadership and influencing others",
      "Attention to detail and precision",
      "Writing, storytelling, or verbal communication",
      "Building and fixing things (hands-on)",
      "Numbers, data, and financial analysis",
      "Performing, presenting, or captivating an audience",
    ]),
    orderIndex: 5,
  },
  {
    questionText: "What does success mean to you?",
    questionType: "multiple_choice" as const,
    options: JSON.stringify([
      "Financial independence — building wealth and long-term security",
      "Complete freedom — controlling my own time and direction",
      "Recognition — being known and respected in my field",
      "Mastery — reaching the highest level in a skill or discipline",
      "Impact — making a real difference to people or the world",
      "Legacy — building something that outlasts me",
    ]),
    orderIndex: 6,
  },
  {
    questionText: "Which of these paths appeal to you? (Select all that apply)",
    questionType: "multiple_select" as const,
    options: JSON.stringify([
      "Employed professional with a salary and career ladder",
      "Freelancer or independent contractor",
      "Entrepreneur — starting or running my own business",
      "Artist, performer, or creative professional",
      "Academic, researcher, or scientist",
      "Skilled tradesperson or craftsperson",
      "Social enterprise, NGO, charity, or public sector",
    ]),
    orderIndex: 7,
  },
  {
    questionText: "Rate your willingness to invest years of further education or training to reach your goal (1 = I want to start now with what I have, 10 = willing to study or train for many years)",
    questionType: "scale" as const,
    options: null,
    orderIndex: 8,
  },
  {
    questionText: "In your own words — what does your ideal path look like in 5 years, and what are you most worried about getting wrong?",
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
          content: `You are a brutally honest career counsellor AI. You do NOT sugarcoat. You give both the positives AND the negatives with equal weight. You spare nobody. Your job is to help people understand their true strengths and weaknesses so they can make informed career decisions. You always respond in valid JSON format only. You consider ALL types of paths — traditional employment, freelancing, entrepreneurship, creative/artistic careers, academia, skilled trades, social enterprise, and portfolio careers. Never default to conventional "safe" jobs if the person's profile points elsewhere.`,
        },
        {
          role: "user",
          content: `Analyse this person's career assessment and provide honest, thorough feedback.

Profile: ${profileContext}

Assessment answers:
${qaText}

Respond ONLY with a valid JSON object in this exact structure:
{
  "score": <integer 1-100 representing overall career clarity and readiness score>,
  "analysis": "<3-4 paragraphs of honest, direct analysis — include genuine strengths AND real weaknesses equally. Call out blind spots. If they're not suited to their stated goal, say so clearly.>",
  "topStrengths": ["<genuine strength 1>", "<genuine strength 2>", "<genuine strength 3>"],
  "areasToImprove": ["<real weakness/gap 1>", "<real weakness/gap 2>", "<real weakness/gap 3>"],
  "skillAnalysis": {
    "existingSkills": ["<skill they already have 1>", "<skill they already have 2>", "<skill they already have 3>"],
    "skillGaps": ["<critical gap 1>", "<critical gap 2>", "<critical gap 3>"],
    "quickWins": ["<skill they can develop quickly 1>", "<skill they can develop quickly 2>"]
  },
  "careerSuggestions": [
    {
      "careerTitle": "<path name — can be a job title, creative career, business type, academic path, trade, etc.>",
      "compatibilityScore": <integer 0-100>,
      "description": "<2-3 sentences on what this path involves and why it fits or partially fits this person>",
      "pros": ["<genuine pro 1>", "<genuine pro 2>", "<genuine pro 3>"],
      "cons": ["<honest con 1 — do not soften>", "<honest con 2>", "<honest con 3>"],
      "requiredSkills": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>"],
      "salaryRange": "<realistic earning range — for freelancers/entrepreneurs say 'Variable £X–Y'; for creatives be honest about typical earnings; for employees give a salary band>",
      "timeToAchieve": "<realistic time to be genuinely established on this path, not just entry-level>"
    }
  ]
}

Provide exactly 4-5 suggestions ordered from HIGHEST to LOWEST compatibility. Include non-traditional paths (freelancing, entrepreneurship, creative careers, trades, academia) wherever they genuinely fit the person — do not default to conventional employment if it is not the best match. Be brutally honest about the cons.`,
        },
      ],
    });

    const rawContent = aiResponse.choices[0]?.message?.content ?? "{}";
    let parsed: {
      score: number;
      analysis: string;
      topStrengths: string[];
      areasToImprove: string[];
      skillAnalysis?: {
        existingSkills: string[];
        skillGaps: string[];
        quickWins: string[];
      };
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
      .set({
        status: "completed",
        score: parsed.score,
        analysis: parsed.analysis,
        topStrengths: JSON.stringify(parsed.topStrengths ?? []),
        areasToImprove: JSON.stringify(parsed.areasToImprove ?? []),
        completedAt: new Date(),
      })
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
      skillAnalysis: parsed.skillAnalysis ?? { existingSkills: [], skillGaps: [], quickWins: [] },
      careerSuggestions: savedSuggestions,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit assessment");
    res.status(500).json({ error: "Failed to submit assessment" });
  }
});

export default router;
