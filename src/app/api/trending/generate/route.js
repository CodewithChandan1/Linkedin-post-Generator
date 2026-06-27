import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const responseSchema = {
  type: "object",
  properties: {
    content: { type: "string", description: "The full post text with line breaks" },
    hashtags: { type: "array", items: { type: "string" } },
    imagePrompt: { type: "string", description: "A short visual description for an accompanying image" },
    hooks: {
      type: "array",
      items: { type: "string" },
      description: "3 alternate opening lines (hooks) for this post",
    },
  },
  required: ["content", "hashtags", "imagePrompt", "hooks"],
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

  const { title, description, source } = await req.json();
  if (!title) {
    return Response.json({ error: "Missing title" }, { status: 400 });
  }

  const systemPrompt = `You are an expert LinkedIn ghostwriter for ${userProfile.name}, a developer based in ${userProfile.location || "India"}.
His stack: ${(userProfile.stack || []).join(", ")}. His projects: ${(userProfile.projects || []).join(", ")}.

Write a LinkedIn post about a TRENDING tech news topic. Make it:
- Timely and relevant (reference the news)
- Add ${userProfile.name}'s perspective or experience where natural
- Professional yet conversational
- 1,200-1,800 characters
- Strong hook (first 2 lines must grab attention)
- End with an open question for discussion
- NO external links in the body
- Include 3 alternate hook variations in the "hooks" field

Also generate fresh, trending hashtags specific to this topic (not generic ones like #coding).`;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a LinkedIn post about this trending topic:
Title: "${title}"
Description: "${description || "No description"}"
Source: ${source || "Tech News"}

Make it ${userProfile.name}'s hot take — timely, opinionated, and relevant to their engineering background.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema,
        maxOutputTokens: 4000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = (response.text || "").trim();
    if (!text) throw new Error("Empty response from Gemini");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Malformed JSON response");
    }

    const imageUrl = parsed.imagePrompt
      ? `https://image.pollinations.ai/prompt/${encodeURIComponent(parsed.imagePrompt + ", realistic, natural, cinematic, professional, clean, minimal, tech news, LinkedIn post visual")}?width=1080&height=1080&nologo=true`
      : "";

    return Response.json({
      content: parsed.content,
      hashtags: parsed.hashtags || [],
      imagePrompt: parsed.imagePrompt || "",
      imageUrl,
      hooks: parsed.hooks || [],
      topic: "Trending",
      source: source || "Tech News",
      trendingTitle: title,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
