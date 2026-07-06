import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  conversations,
  messages,
  profilesTable,
  careerSuggestionsTable,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const DISCOVERY_SYSTEM_PROMPT = `You are CareerPath AI's Career Discovery specialist. You help people who don't know what career they want figure out what's right for them through natural, friendly conversation.

Your approach:
- Start by warmly welcoming them and asking their name if you don't know it yet, then ask ONE open question to get them talking
- Ask only 1-2 questions at a time — never fire a list of questions
- Listen deeply and build on what they say before asking the next question
- Be genuinely curious and warm but direct — no corporate-speak
- Explore these areas naturally over the conversation:
  * What subjects or topics they love learning about
  * Activities that energize vs. drain them
  * Projects or work they've enjoyed or are proud of
  * Things they really dislike doing
  * How they prefer to work (solo vs. teams, creative vs. analytical, structured vs. flexible)
  * What they value most (income, impact, creativity, stability, variety, prestige, work-life balance)
  * Skills they have or want to develop
  * Lifestyle preferences (travel, hours, remote vs. office)
  * What they imagine their ideal day looking like

After 7-10 exchanges, when you have a good sense of the person, naturally transition to recommendations. Say something like "Based on everything you've told me, I have a clear picture of who you are and what would suit you. Let me suggest some career paths..."

Then present 3-5 specific career recommendations. For each career, include:
1. Why it fits THIS person specifically (reference specific things they said)
2. What the day-to-day looks like in concrete terms
3. Required skills and realistic timeline to get there
4. Salary range (be specific and honest, e.g. "£35k–£65k in the UK, $50k–$110k in the US")
5. 3 genuine pros and 2 genuine cons (don't sugarcoat)
6. Job market outlook (honest assessment)

Format each career as a clearly labeled section. Be opinionated — tell them which one you think fits best and why.

After presenting the careers, ask which ones resonate and offer to go deeper on any option. When the user has decided which career(s) they want to pursue and you've answered their questions, confirm with them ("Shall I create your career roadmap for [Career X]?").

CRITICAL: When the user confirms they're ready to build their roadmap, your final message MUST end with this exact JSON block on its own line — nothing after it:
{"action":"ready_for_roadmap","careers":["Career Title 1"]}

If they want multiple careers:
{"action":"ready_for_roadmap","careers":["Career Title 1","Career Title 2"]}

Include only confirmed career titles the user explicitly agreed to pursue. The career titles should be specific (e.g. "UX Designer", "Data Scientist", "Software Engineer") not vague.`;

router.post("/discovery/conversations", async (req, res) => {
  try {
    const [conv] = await db
      .insert(conversations)
      .values({ title: "Career Discovery", profileId: null })
      .returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create discovery conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.post("/discovery/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid conversation ID" });
    return;
  }

  const { content } = req.body as { content?: string };
  if (!content?.trim()) {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  try {
    await db.insert(messages).values({ conversationId: id, role: "user", content });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    const chatMessages = history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 8192,
      messages: [{ role: "system", content: DISCOVERY_SYSTEM_PROMPT }, ...chatMessages],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send discovery message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    }
  }
});

router.post("/discovery/conversations/:id/create-profile", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid conversation ID" });
    return;
  }

  try {
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    if (history.length === 0) {
      res.status(400).json({ error: "No conversation found" });
      return;
    }

    const transcript = history
      .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n\n");

    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: "You are a data extraction assistant. Extract structured profile information from a career discovery conversation. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `Extract a career profile from this conversation transcript. Return ONLY this JSON structure:
{
  "name": "<user's name, or 'Anonymous' if not mentioned>",
  "age": <number or null>,
  "educationLevel": "<one of: high_school, bachelors, masters, phd, bootcamp, other>",
  "fieldOfStudy": "<their field of study or null>",
  "workExperience": "<brief summary of their experience from conversation>",
  "skills": "<comma-separated list of skills they mentioned>",
  "interests": "<comma-separated list of interests they mentioned>",
  "goals": "<their career goals based on the conversation>",
  "discoveredCareers": [
    {
      "careerTitle": "<specific career title>",
      "compatibilityScore": <70-99>,
      "description": "<why this career fits them, 2-3 sentences>",
      "salaryRange": "<realistic salary range>",
      "timeToTransition": "<realistic time e.g. 1-2 years>",
      "requiredSkills": ["skill1", "skill2", "skill3"],
      "pros": ["pro1", "pro2", "pro3"],
      "cons": ["con1", "con2"]
    }
  ]
}

The discoveredCareers should reflect the 3-5 careers the AI recommended in the conversation. Transcript:

${transcript}`,
        },
      ],
    });

    const rawContent = extractionResponse.choices[0]?.message?.content ?? "{}";
    let extracted: {
      name: string;
      age?: number | null;
      educationLevel: string;
      fieldOfStudy?: string | null;
      workExperience?: string | null;
      skills?: string | null;
      interests?: string | null;
      goals?: string | null;
      discoveredCareers: Array<{
        careerTitle: string;
        compatibilityScore: number;
        description: string;
        salaryRange: string;
        timeToAchieve: string;
        requiredSkills: string[];
        pros: string[];
        cons: string[];
      }>;
    };

    try {
      const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      extracted = JSON.parse(cleaned);
    } catch {
      extracted = {
        name: "Anonymous",
        educationLevel: "other",
        discoveredCareers: [],
      };
    }

    const userId = req.isAuthenticated() ? req.user.id : null;

    const [profile] = await db
      .insert(profilesTable)
      .values({
        name: extracted.name ?? "Anonymous",
        age: extracted.age ?? null,
        educationLevel: extracted.educationLevel ?? "other",
        fieldOfStudy: extracted.fieldOfStudy ?? null,
        workExperience: extracted.workExperience ?? null,
        skills: extracted.skills ?? null,
        interests: extracted.interests ?? null,
        goals: extracted.goals ?? null,
        userId,
      })
      .returning();

    if (extracted.discoveredCareers?.length > 0) {
      await db.insert(careerSuggestionsTable).values(
        extracted.discoveredCareers.map((career) => ({
          profileId: profile.id,
          careerTitle: career.careerTitle,
          compatibilityScore: career.compatibilityScore ?? 80,
          description: career.description ?? "",
          salaryRange: career.salaryRange ?? "Varies",
          timeToAchieve: career.timeToAchieve ?? "1-2 years",
          requiredSkills: JSON.stringify(career.requiredSkills ?? []),
          pros: JSON.stringify(career.pros ?? []),
          cons: JSON.stringify(career.cons ?? []),
        }))
      );
    }

    await db
      .update(conversations)
      .set({ profileId: profile.id })
      .where(eq(conversations.id, id));

    res.json({ profileId: profile.id });
  } catch (err) {
    req.log.error({ err }, "Failed to create profile from discovery");
    res.status(500).json({ error: "Failed to create profile" });
  }
});

export default router;
