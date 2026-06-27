// PDF Carousel Generator — Claude writes multi-slide content
// PRD §4.7

import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const carouselSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Carousel title (cover slide)" },
    slides: {
      type: "array",
      description: "Array of slides (5-8 slides recommended)",
      items: {
        type: "object",
        properties: {
          slideNumber: { type: "number" },
          headline: { type: "string", description: "Bold slide headline (5-8 words)" },
          body: { type: "string", description: "Slide body text (25-50 words max)" },
          codeSnippet: { type: "string", description: "Optional short code example (leave empty if not applicable)" },
          emoji: { type: "string", description: "1-2 relevant emojis for this slide" },
        },
        required: ["slideNumber", "headline", "body", "emoji"],
      },
    },
    ctaSlide: {
      type: "object",
      properties: {
        headline: { type: "string" },
        body: { type: "string" },
      },
      required: ["headline", "body"],
    },
    linkedInCaption: { type: "string", description: "The post caption to accompany the carousel upload" },
    hashtags: { type: "array", items: { type: "string" } },
  },
  required: ["title", "slides", "ctaSlide", "linkedInCaption", "hashtags"],
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

  const { topic, content } = await req.json();
  if (!topic && !content) {
    return Response.json({ error: "Missing topic or content" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are an expert LinkedIn PDF carousel creator for ${userProfile.name}, a Full Stack Developer.

LinkedIn PDF Carousel best practices (2026):
- 6.6% average engagement vs 2% for text posts
- 5-8 slides optimal (more = higher dwell time)
- Slide specs: 1080×1350px vertical
- Each slide: 1 idea max, 25-50 words, strong headline
- Cover slide: big bold title + name
- Final slide: CTA + follow nudge
- Include "Save this carousel" in the caption

His stack: ${(userProfile.stack || []).join(", ")}
His projects: ${(userProfile.projects || []).join(", ")}

Format each slide for maximum dwell time. Use numbered formats like "5 React Patterns" or "My journey from X to Y".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: topic
        ? `Create a LinkedIn PDF carousel about: "${topic}"\nMake it specific to ${userProfile.name}'s Full Stack / engineering experience.`
        : `Convert this post into a PDF carousel:\n\n${content}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: carouselSchema,
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
