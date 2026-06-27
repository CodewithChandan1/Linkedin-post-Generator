// LinkedIn Newsletter Auto-Generator — PRD §6.4
// Compiles weekly best post into a newsletter edition

import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const newsletterSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Newsletter edition title (max 70 chars)" },
    subject: { type: "string", description: "Email subject line" },
    intro: { type: "string", description: "Opening paragraph (100-150 words)" },
    mainSection: { type: "string", description: "Expanded version of the featured post (300-400 words)" },
    additionalInsights: {
      type: "array",
      items: { type: "string" },
      description: "2-3 additional bullet insights related to the topic",
    },
    whatsNext: { type: "string", description: "Brief teaser for next week (50 words)" },
    cta: { type: "string", description: "Closing CTA line to follow/subscribe" },
  },
  required: ["title", "subject", "intro", "mainSection", "additionalInsights", "whatsNext", "cta"],
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

  const { post, weekPosts } = await req.json();
  if (!post) {
    return Response.json({ error: "Missing featured post" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are a LinkedIn newsletter writer for ${userProfile.name}, a developer based in ${userProfile.location || "India"}.

His stack: ${(userProfile.stack || []).join(", ")}.
His projects: ${(userProfile.projects || []).join(", ")}.

Write in a newsletter format — more detailed and thoughtful than a regular post.
LinkedIn newsletters bypass the feed algorithm and are delivered directly to subscriber inboxes.
Open rate is 25-35% vs 2% feed reach.

Newsletter format:
- Title: catchy, specific (not clickbait)
- Intro: welcome readers, set up this week's focus
- Main section: expand on the featured post with 2-3 more insights, examples, or context not in the original post
- Additional insights: quick-hit bullets
- What's next: tease next week's topic
- CTA: invite to subscribe/follow
- Tone: like a developer writing to developer peers — warm, specific, value-dense`;

  try {
    const otherTopics = weekPosts
      ? weekPosts.map((p) => p.topic).filter(Boolean).join(", ")
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a LinkedIn newsletter edition based on this week's top post:

Featured post topic: "${post.topic || "Tech"}"
Featured post content:
"${post.content}"

Other topics covered this week: ${otherTopics || "none"}

Make it feel like a personal newsletter from a developer who posts daily — not a corporate publication.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: newsletterSchema,
        maxOutputTokens: 3000,
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
