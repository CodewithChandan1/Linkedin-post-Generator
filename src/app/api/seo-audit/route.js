// LinkedIn Profile SEO Auditor — one-time keyword audit
// PRD §4.17

import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const auditSchema = {
  type: "object",
  properties: {
    headlineScore: { type: "number", description: "Score 0-100 for current headline" },
    headlineSuggestion: { type: "string", description: "Optimized 150+ char headline" },
    aboutScore: { type: "number" },
    aboutOpener: { type: "string", description: "Optimized first 300 chars of About section" },
    missingKeywords: { type: "array", items: { type: "string" } },
    skillsToPin: { type: "array", items: { type: "string" }, description: "Top 3 skills to pin" },
    improvements: { type: "array", items: { type: "string" }, description: "List of specific improvement suggestions" },
    overallScore: { type: "number" },
  },
  required: ["headlineScore", "headlineSuggestion", "aboutScore", "aboutOpener", "missingKeywords", "skillsToPin", "improvements", "overallScore"],
};

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userProfile = user.profile;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const { headline, about, skills } = await req.json();
  if (!headline) {
    return Response.json({ error: "Missing headline" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are a LinkedIn Profile SEO expert specializing in engineers/developers (2026).

Key facts about LinkedIn's 2026 algorithm for profile discovery:
- Headline is weighted 5x in recruiter search
- Optimized profiles get 40% more views and 36x more recruiter messages
- Headline should be 150+ chars: Role + Skills + Value Proposition
- About section first 300 chars are crucial (visible before "see more")
- Pinned skills carry significant SEO weight

This audit is for ${userProfile.name} from ${userProfile.location || "India"}.
Their stack: ${(userProfile.stack || []).join(", ")}.
Their achievements: ${(userProfile.achievements || []).join("; ")}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Audit this LinkedIn profile:
Headline: "${headline}"
About (first 300 chars): "${about || "Not provided"}"
Current Skills: ${(skills || []).join(", ") || "Not provided"}

Provide a full SEO audit with scores, improved headline (150+ chars), optimized About opener (300 chars), missing keywords, skills to pin, and specific improvements.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: auditSchema,
        maxOutputTokens: 2000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = (response.text || "").trim();
    if (!text) throw new Error("Empty response");

    return Response.json(JSON.parse(text));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
