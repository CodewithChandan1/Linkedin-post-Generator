import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const responseSchema = {
  type: "object",
  properties: {
    deckTitle: { type: "string", description: "Short, punchy presentation title" },
    subtitle: { type: "string", description: "One-line subtitle / tagline" },
    slides: {
      type: "array",
      description: "Content slides (excluding the title slide)",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Slide heading (max ~8 words)" },
          bullets: {
            type: "array",
            items: { type: "string" },
            description: "3-5 concise bullet points, max ~12 words each",
          },
          imagePrompt: {
            type: "string",
            description: "A short visual description for an illustrative image for this slide",
          },
          speakerNotes: { type: "string", description: "1-2 sentences of speaker notes" },
        },
        required: ["title", "bullets", "imagePrompt"],
      },
    },
  },
  required: ["deckTitle", "subtitle", "slides"],
};

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  let topic = "";
  let numSlides = 6;
  try {
    const body = await req.json();
    topic = (body?.topic || "").trim();
    if (Number.isFinite(body?.numSlides)) {
      numSlides = Math.min(12, Math.max(3, Math.round(body.numSlides)));
    }
  } catch {
    // defaults
  }

  if (!topic) {
    return Response.json({ error: "Missing topic" }, { status: 400 });
  }

  const profile = user.profile || {};
  const systemPrompt = `You are an expert presentation designer creating a professional slide deck for ${profile.name || "a developer"}, a developer based in ${profile.location || "India"}.
Their stack: ${(profile.stack || []).join(", ") || "Full Stack"}.

Create a clear, engaging presentation with exactly ${numSlides} content slides.
Rules:
- Each slide: a short title and 3-5 tight bullet points (max ~12 words each).
- Logical flow: intro/context → core points → takeaways/conclusion.
- Make it specific and substantive, not generic filler.
- For each slide, give a concise imagePrompt describing a clean, professional, relevant visual.
- Add brief speakerNotes per slide.`;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a ${numSlides}-slide presentation about: "${topic}".`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema,
        maxOutputTokens: 6000,
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
      deckTitle: parsed.deckTitle || topic,
      subtitle: parsed.subtitle || "",
      slides: (parsed.slides || []).map((s) => ({
        title: s.title || "",
        bullets: Array.isArray(s.bullets) ? s.bullets : [],
        imagePrompt: s.imagePrompt || "",
        speakerNotes: s.speakerNotes || "",
      })),
      author: profile.name || "Developer",
    });
  } catch (err) {
    return Response.json(
      { error: `Failed to generate presentation: ${err.message}` },
      { status: 502 }
    );
  }
}
