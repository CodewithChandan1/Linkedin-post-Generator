// Short Video Script Generator — PRD §6.10
// 30-60s vertical video script from any post

import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const scriptSchema = {
  type: "object",
  properties: {
    hook: { type: "string", description: "First 3 seconds — the attention grabber (1 sentence)" },
    duration: { type: "string", description: "e.g. '45 seconds'" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          timeCode: { type: "string", description: "e.g. '0:00-0:05'" },
          spokenText: { type: "string", description: "What to say out loud" },
          visual: { type: "string", description: "What to show on screen / B-roll suggestion" },
          tip: { type: "string", description: "Delivery tip (optional)" },
        },
        required: ["timeCode", "spokenText", "visual"],
      },
    },
    caption: { type: "string", description: "LinkedIn caption to post with the video" },
    hashtags: { type: "array", items: { type: "string" } },
    productionTips: { type: "array", items: { type: "string" }, description: "Quick tips for filming this" },
  },
  required: ["hook", "duration", "scenes", "caption", "hashtags", "productionTips"],
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

  const { content, topic } = await req.json();
  if (!content && !topic) {
    return Response.json({ error: "Missing content or topic" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are a short-form video script writer for ${userProfile.name}, a developer based in ${userProfile.location || "India"}.

LinkedIn video specs (2026):
- 30-60 seconds optimal (vertical 9:16)
- Captions mandatory (80% watched without sound)
- Native upload only (no YouTube links — penalized)
- 5x more engagement than text
- Growing 2x faster than all formats

Script format:
- Hook first 3 seconds: must stop the scroll
- Scene-by-scene breakdown with timecodes
- Each scene: spoken word + visual direction
- Keep sentences short (speaking pace)
- End with clear CTA

${userProfile.name}'s style: developer-friendly, direct, occasionally drops real metrics`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: content
        ? `Convert this LinkedIn post into a 30-60 second vertical video script:\n\n"${content}"`
        : `Write a 30-60 second vertical video script about: "${topic}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: scriptSchema,
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
