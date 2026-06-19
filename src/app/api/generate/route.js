import { GoogleGenAI } from "@google/genai";
import { profile, getTodayTopic } from "@/lib/profile";

export const runtime = "nodejs";

function buildSystemPrompt() {
  return `You are an expert LinkedIn ghostwriter for ${profile.name}, a Full Stack Developer based in ${profile.location}.

His tech stack: ${profile.stack.join(", ")}.
His real projects: ${profile.projects.join(", ")}.
His verifiable achievements:
${profile.achievements.map((a) => `- ${a}`).join("\n")}

Write in his voice: professional yet conversational, developer-friendly, confident but humble. Reference his real projects and metrics by name where natural. Include one authentic human touch (an honest admission, a casual aside, or a learning moment) so the post does not read like generic AI output.

Algorithm rules you MUST follow (LinkedIn 2026):
- NEVER put external links in the post body.
- NO engagement-bait phrases like "Comment YES if you agree".
- Target a long-form structure (~1,200-1,800 characters) with a strong hook in the first two lines.
- Use short paragraphs and line breaks for readability on mobile.
- End with one open-ended question that invites multi-reply discussion.`;
}

const responseSchema = {
  type: "object",
  properties: {
    content: { type: "string", description: "The full post text with line breaks" },
    hashtags: { type: "array", items: { type: "string" } },
    imagePrompt: { type: "string", description: "A short visual description for an accompanying image" },
  },
  required: ["content", "hashtags", "imagePrompt"],
};

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY is not set. Copy .env.local.example to .env.local and add your key." },
      { status: 500 }
    );
  }

  let topicOverride = null;
  try {
    const body = await req.json();
    topicOverride = body?.topic ?? null;
  } catch {
    // no body — use today's rotation
  }

  const today = getTodayTopic();
  const topic = topicOverride || today.topic;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write today's LinkedIn post. Topic category: "${topic}". Example angle for inspiration (do not copy): "${today.example}". Make it specific to Chandan's real experience.`,
      config: {
        systemInstruction: buildSystemPrompt(),
        responseMimeType: "application/json",
        responseSchema,
        maxOutputTokens: 4000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = (response.text || "").trim();
    if (!text) {
      const reason = response?.candidates?.[0]?.finishReason || "unknown";
      throw new Error(`empty response from Gemini (finishReason: ${reason})`);
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Gemini returned malformed JSON (response may have been truncated)");
    }

    return Response.json({
      content: parsed.content,
      hashtags: parsed.hashtags || [],
      imagePrompt: parsed.imagePrompt || "",
      imageUrl: parsed.imagePrompt
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(parsed.imagePrompt + ", professional, clean, minimal, tech aesthetic, LinkedIn post visual")}?width=1080&height=1080&nologo=true`
        : "",
      topic,
    });
  } catch (err) {
    return Response.json(
      { error: `Failed to generate post: ${err.message}` },
      { status: 502 }
    );
  }
}
