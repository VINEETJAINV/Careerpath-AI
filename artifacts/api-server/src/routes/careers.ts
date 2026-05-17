import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { careerSuggestionsTable, profilesTable } from "@workspace/db";
import { GetCareerSuggestionsParams, GetCareerRoadmapParams } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.get("/profiles/:id/career-suggestions", async (req, res) => {
  const params = GetCareerSuggestionsParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid profile ID" });
    return;
  }
  try {
    const suggestions = await db
      .select()
      .from(careerSuggestionsTable)
      .where(eq(careerSuggestionsTable.profileId, params.data.id))
      .orderBy(desc(careerSuggestionsTable.compatibilityScore));

    const parsed = suggestions.map((s) => ({
      ...s,
      pros: JSON.parse(s.pros) as string[],
      cons: JSON.parse(s.cons) as string[],
      requiredSkills: JSON.parse(s.requiredSkills) as string[],
    }));

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Failed to get career suggestions");
    res.status(500).json({ error: "Failed to get career suggestions" });
  }
});

router.get("/profiles/:id/roadmap", async (req, res) => {
  const params = GetCareerRoadmapParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid profile ID" });
    return;
  }
  try {
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, params.data.id));

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const requestedCareer = req.query["career"] as string | undefined;

    let targetCareer: string;
    if (requestedCareer) {
      const allSuggestions = await db
        .select()
        .from(careerSuggestionsTable)
        .where(eq(careerSuggestionsTable.profileId, params.data.id))
        .orderBy(desc(careerSuggestionsTable.compatibilityScore));

      const match = allSuggestions.find(
        (s) => s.careerTitle.toLowerCase() === requestedCareer.toLowerCase()
      );
      targetCareer = match?.careerTitle ?? requestedCareer;
    } else {
      const [topSuggestion] = await db
        .select()
        .from(careerSuggestionsTable)
        .where(eq(careerSuggestionsTable.profileId, params.data.id))
        .orderBy(desc(careerSuggestionsTable.compatibilityScore))
        .limit(1);
      targetCareer = topSuggestion?.careerTitle ?? "General Career";
    }

    const profileContext = `Name: ${profile.name}, Education: ${profile.educationLevel}, Field: ${profile.fieldOfStudy ?? "Unknown"}, Skills: ${profile.skills ?? "None"}, Interests: ${profile.interests ?? "None"}, Goals: ${profile.goals ?? "Not specified"}, Experience: ${profile.workExperience ?? "None"}`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: "You are an expert career coach. Provide a detailed, realistic, and actionable career roadmap. Be honest about the effort required. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Create a detailed career roadmap for this person to become a ${targetCareer}.

Profile: ${profileContext}

Return ONLY a JSON object:
{
  "targetCareer": "${targetCareer}",
  "totalDuration": "<realistic total time e.g. '2-3 years'>",
  "milestones": [
    {
      "phase": 1,
      "title": "<phase title>",
      "description": "<what this phase is about>",
      "duration": "<time for this phase>",
      "actions": ["<concrete action 1>", "<concrete action 2>", "<concrete action 3>"]
    }
  ]
}

Create 4-6 phases with 3-5 concrete actions each. Be realistic about the time and effort required.`,
        },
      ],
    });

    const rawContent = aiResponse.choices[0]?.message?.content ?? "{}";
    let parsed: {
      targetCareer: string;
      totalDuration: string;
      milestones: Array<{
        phase: number;
        title: string;
        description: string;
        duration: string;
        actions: string[];
      }>;
    };

    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
        targetCareer,
        totalDuration: "1-2 years",
        milestones: [],
      };
    }

    res.json({
      profileId: params.data.id,
      targetCareer: parsed.targetCareer,
      totalDuration: parsed.totalDuration,
      milestones: parsed.milestones ?? [],
      generatedAt: new Date(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get career roadmap");
    res.status(500).json({ error: "Failed to get career roadmap" });
  }
});

export default router;
