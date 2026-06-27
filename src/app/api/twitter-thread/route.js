// Twitter/X Thread Formatter — PRD §6.9
// Reformats LinkedIn post as a Twitter thread (no API — just copy/paste)

import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const threadSchema = {
  type: "object",
  properties: {
    tweets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "number" },
          text: { type: "string", description: "Tweet text (max 280 chars)" },
          charCount: { type: "number" },
          imagePrompt: { type: "string", description: "Optional visual prompt description for this specific tweet. If this tweet doesn't need an image, keep it empty." }
        },
        required: ["number", "text"],
      },
    },
    threadHook: { type: "string", description: "The first tweet — the hook" },
    hashtags: { type: "array", items: { type: "string" } },
  },
  required: ["tweets", "threadHook", "hashtags"],
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

  const { content, hashtags, originalImageUrl, originalImagePrompt } = await req.json();
  if (!content) {
    return Response.json({ error: "Missing content" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are reformatting a LinkedIn post as a Twitter/X thread for ${userProfile.name}.

Twitter thread rules:
- Each tweet: max 280 characters (count carefully)
- Tweet 1: the hook — must grab attention in 1-2 lines
- Number each tweet: "1/" "2/" etc.
- Final tweet: summary + follow CTA + hashtags
- 4-8 tweets optimal for a thread
- Short punchy sentences work best on Twitter
- Keep the core message but adapt tone — Twitter is more casual than LinkedIn
- Remove LinkedIn-specific phrases
- For EACH tweet, suggest an optional 'imagePrompt' (visual description) only if that specific tweet would benefit from a visual representation (e.g. code snippets, architecture diagrams, workspace setups, tech stacks, conceptual tech illustration). Otherwise keep it empty.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Convert this LinkedIn post into a Twitter/X thread:\n\n"${content}"\n\nHashtags used: ${(hashtags || []).join(" ")}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: threadSchema,
        maxOutputTokens: 1500,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = (response.text || "").trim();
    if (!text) throw new Error("Empty response");

    const parsed = JSON.parse(text);
    if (parsed.tweets && Array.isArray(parsed.tweets)) {
      parsed.tweets = parsed.tweets.map((t, idx) => {
        let imageUrl = "";
        let imagePrompt = t.imagePrompt || "";
        
        if (imagePrompt && imagePrompt.trim()) {
          imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt + ", realistic, natural, cinematic, professional, clean, minimal, tech aesthetic, Twitter post visual")}?width=1080&height=600&nologo=true`;
        } else if (idx === 0 && originalImageUrl) {
          imageUrl = originalImageUrl;
          imagePrompt = originalImagePrompt || "";
        }
        
        return {
          ...t,
          imagePrompt,
          imageUrl
        };
      });
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
