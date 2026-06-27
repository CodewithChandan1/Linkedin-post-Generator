// AI Humanizer Layer — second Gemini pass to inject user's voice
// and bypass LinkedIn's AI-detection penalty (-30% reach, -55% engagement).
// PRD §4.9

import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const humanizeSchema = {
  type: "object",
  properties: {
    content: { type: "string" },
    changes: {
      type: "array",
      items: { type: "string" },
      description: "Brief list of humanization changes made",
    },
  },
  required: ["content", "changes"],
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

  const { content } = await req.json();
  if (!content) {
    return Response.json({ error: "Missing content" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are a post humanizer for ${userProfile.name}, a developer from ${userProfile.location || "India"}.

Your job is to take a LinkedIn post and make it sound MORE authentically human — specifically like ${userProfile.name} wrote it himself.

Rules for humanization:
1. Reference their REAL projects naturally where relevant: ${(userProfile.projects || []).join(", ")}
2. Weave in their REAL achievements: ${(userProfile.achievements || []).join("; ")}
3. Add ONE honest admission, casual aside, or imperfection (e.g. "honestly", "took me way too long", "not going to lie")
4. Add ONE specific detail grounding it in their location, coding habits, or background (e.g. late night coding, chai/coffee, ${userProfile.location || "workspace"})
5. STRICTLY REMOVE any AI-telltale buzzwords: "In today's fast-paced world", "Let me break this down", "Game-changer", "delve", "tapestry", "demystify", "testament", "leverage", "beacon", "catalyst", "foster", "streamline", "nestled", "moreover", "furthermore".
6. Rewrite with a casual, "developer-native" voice: use lower-case coding-style syntax occasionally if appropriate, speak directly to other engineers, avoid corporate speak, and drastically reduce the use of exclamation marks (max 1 per post).
7. Keep the same structure, length, and opening hook — only refine the voice.
8. NEVER add external links.
9. NEVER use engagement-bait like "Comment YES if you agree".
10. The post must still be 1,200–1,800 characters.
11. Return the FULL revised post text, not just the changes.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Humanize this LinkedIn post for ${userProfile.name}:\n\n${content}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: humanizeSchema,
        maxOutputTokens: 3000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = (response.text || "").trim();
    if (!text) throw new Error("Empty response from Gemini");

    const parsed = JSON.parse(text);
    return Response.json({
      content: parsed.content,
      changes: parsed.changes || [],
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
