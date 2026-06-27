// Strategic Comment Generator — PRD §6.5
// Generates thoughtful comments for industry leader posts

import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const commentSchema = {
  type: "object",
  properties: {
    comments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          postContext: { type: "string" },
          comment: { type: "string", description: "2-3 sentence thoughtful comment" },
          angle: { type: "string", description: "The angle/approach taken (e.g. 'adds personal experience', 'asks follow-up question')" },
          estimatedImpression: { type: "string", description: "e.g. '5K-10K impressions if post is popular'" },
        },
        required: ["postContext", "comment", "angle"],
      },
    },
  },
  required: ["comments"],
};

// Hardcoded industry leaders in niche for daily suggestions
const INDUSTRY_LEADERS = [
  { name: "Dan Abramov", topic: "React internals and state management", url: "https://linkedin.com/in/dan-abramov" },
  { name: "Theo (t3.gg)", topic: "TypeScript, Next.js, and full stack development", url: "https://linkedin.com/in/theo" },
  { name: "Lee Robinson", topic: "Next.js, Vercel, and developer experience", url: "https://linkedin.com/in/leerob" },
  { name: "Guillermo Rauch", topic: "Next.js, serverless, and the future of web", url: "https://linkedin.com/in/rauchg" },
  { name: "Kent C. Dodds", topic: "React testing and developer education", url: "https://linkedin.com/in/kentcdodds" },
  { name: "Fireship (Jeff Delaney)", topic: "Modern web dev tutorials and trends", url: "" },
  { name: "Chris Heilmann", topic: "Web standards and developer advocacy", url: "" },
];

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

  const { customPosts } = await req.json().catch(() => ({}));

  const ai = new GoogleGenAI({ apiKey });

  // Pick 3 random leaders for today
  const shuffled = [...INDUSTRY_LEADERS].sort(() => Math.random() - 0.5).slice(0, 3);

  const systemPrompt = `You are writing strategic LinkedIn comments for ${userProfile.name}, a developer based in ${userProfile.location || "India"}.

His stack: ${(userProfile.stack || []).join(", ")}.
His background: ${userProfile.achievements && userProfile.achievements[0] ? userProfile.achievements[0] : "Software engineer"}.

Rules for strategic commenting:
1. NEVER write generic "Great post!" or "Love this!" comments
2. Each comment must add genuine value — a personal experience, a counter-point, a follow-up question, or a related insight
3. Comments should be 2-3 sentences — long enough to show expertise, short enough to read quickly
4. Mention a specific detail from the post to show you actually read it
5. End with a thoughtful question OR a personal anecdote that relates
6. DO NOT mention you're a bot or that this was AI-generated
7. Sound like ${userProfile.name} — developer-friendly, confident, occasionally drops a metric or project reference

Why this matters: A well-crafted comment on a popular post can get 5,000-50,000 impressions — more than a regular post. LinkedIn now shows comment impression counts.`;

  try {
    const postsToComment = customPosts || shuffled.map((l) => ({
      author: l.name,
      topic: l.topic,
      context: `A post by ${l.name} about "${l.topic}"`,
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate strategic LinkedIn comments for ${userProfile.name} to post on these industry leaders' content today:

${postsToComment.map((p, i) => `${i + 1}. ${p.author || "Industry leader"} — post about: "${p.topic || p.context}"`).join("\n")}

For each, write a 2-3 sentence comment that adds genuine value and sounds like a senior engineer with related experience.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: commentSchema,
        maxOutputTokens: 2000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = (response.text || "").trim();
    if (!text) throw new Error("Empty response");

    const parsed = JSON.parse(text);

    // Attach leader info to comments
    const enriched = parsed.comments.map((c, i) => ({
      ...c,
      author: postsToComment[i]?.author || "Industry Leader",
      url: shuffled[i]?.url || "",
      topic: postsToComment[i]?.topic || "",
    }));

    return Response.json({ comments: enriched, leaders: shuffled });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
