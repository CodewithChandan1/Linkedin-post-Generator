import { GoogleGenAI } from "@google/genai";
import { getTodayTopic } from "@/lib/profile";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export const runtime = "nodejs";

function buildSystemPrompt(userProfile) {
  return `You are an expert LinkedIn ghostwriter for ${userProfile.name}, a developer based in ${userProfile.location || "India"}.

His tech stack: ${(userProfile.stack || []).join(", ")}.
His real projects: ${(userProfile.projects || []).join(", ")}.
His verifiable achievements:
${(userProfile.achievements || []).map((a) => `- ${a}`).join("\n")}

Write in his voice: professional yet conversational, developer-friendly, confident but humble. Reference his real projects and metrics where natural. Include one authentic human touch (an honest admission, a casual aside, or a learning moment) so the post does not read like generic AI output.

Algorithm rules you MUST follow (LinkedIn 2026):
- NEVER put external links in the post body.
- NO engagement-bait phrases like "Comment YES if you agree".
- Target a long-form structure (~1,200-1,800 characters) with a strong hook in the first two lines.
- Use short paragraphs and line breaks for readability on mobile.
- End with one open-ended question that invites multi-reply discussion.

Also provide 3 alternate catchy opening lines (hooks) in the "hooks" array — different angles or styles the user could choose as the post opener.`;
}

const responseSchema = {
  type: "object",
  properties: {
    content: { type: "string", description: "The full post text with line breaks" },
    hashtags: { type: "array", items: { type: "string" } },
    imagePrompt: { type: "string", description: "A short visual description for an accompanying image" },
    hooks: {
      type: "array",
      items: { type: "string" },
      description: "3 alternate catchy opening lines (hooks) for this post",
    },
  },
  required: ["content", "hashtags", "imagePrompt", "hooks"],
};

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gating limit check (5 free posts/month for non-premium users)
  if (process.env.NEXT_PUBLIC_ENABLE_MONETIZATION === "true" && !user.isPremium) {
    try {
      await connectDB();
      const count = await Post.countDocuments({ userId: user._id });
      if (count >= 5) {
        return Response.json({
          error: "LIMIT_REACHED",
          message: "You have reached the monthly limit of 5 free posts. Please upgrade to Pro to generate unlimited posts.",
        }, { status: 403 });
      }
    } catch (dbErr) {
      console.error("Monetization limit check db error:", dbErr);
    }
  }

  const userProfile = user.profile;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY is not set. Copy .env.local.example to .env.local and add your key." },
      { status: 500 }
    );
  }

  let topicOverride = null;
  let recentHashtags = [];
  try {
    const body = await req.json();
    topicOverride = body?.topic ?? null;
    if (Array.isArray(body?.recentHashtags)) recentHashtags = body.recentHashtags.slice(0, 30);
  } catch {
    // no body — use today's rotation
  }

  const today = getTodayTopic();
  const topic = topicOverride || today.topic;
  const isCustomPrompt = topicOverride && topicOverride.length > 30;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const baseMessage = isCustomPrompt
      ? `Write today's LinkedIn post about this specific topic/angle: "${topic}". Make it specific to ${userProfile.name}'s real experience and perspective.`
      : `Write today's LinkedIn post. Topic category: "${topic}". Example angle for inspiration (do not copy): "${today.example}". Make it specific to ${userProfile.name}'s real experience.`;

    const hashtagNote = recentHashtags.length
      ? `\n\nFor variety, generate fresh hashtags and AVOID reusing these recently-used ones: ${recentHashtags.join(", ")}. Pick a different mix of 4-6 specific, relevant hashtags.`
      : "";

    const userMessage = baseMessage + hashtagNote;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: buildSystemPrompt(userProfile),
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
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(parsed.imagePrompt + ", realistic, natural, cinematic, professional, clean, minimal, tech aesthetic, LinkedIn post visual")}?width=1080&height=1080&nologo=true`
        : "",
      hooks: parsed.hooks || [],
      topic,
    });
  } catch (err) {
    return Response.json(
      { error: `Failed to generate post: ${err.message}` },
      { status: 502 }
    );
  }
}
