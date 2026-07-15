import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export const runtime = "nodejs";

const caseStudyResponseSchema = {
  type: "object",
  properties: {
    content: { type: "string", description: "The full case study LinkedIn post formatted with rich spacing, subheadings, and strategic bullet points." },
    hashtags: { type: "array", items: { type: "string" } },
    hooks: { type: "array", items: { type: "string" }, description: "3 alternate hooks" },
    slides: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Catchy slide title" },
          content: { type: "string", description: "Short, high-impact bulleted body for the slide" }
        },
        required: ["title", "content"]
      },
      description: "Slide-by-slide details if user wants to create a Carousel (provide 5-7 slides)"
    }
  },
  required: ["content", "hashtags", "hooks"]
};

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  try {
    const { companyName, angle, format } = await req.json();

    if (!companyName) {
      return NextResponse.json({ success: false, error: "Company name is required" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Design the prompt according to the selected case study angle
    let angleInstructions = "";
    if (angle === "founding") {
      angleInstructions = `Deconstruct the founding story of ${companyName}. Focus on how they started, the early struggles, the pivotal 'zero-to-one' moment, and how they scaled to a million/billion-dollar market leader. Highlight resilience, key founder decisions, and the origin story.`;
    } else if (angle === "marketing") {
      angleInstructions = `Deconstruct the marketing, growth hacking, and business strategy of ${companyName}. Focus on customer acquisition costs, viral growth loops, key product-led growth hacks, and unique marketing positioning. Use real metrics if possible.`;
    } else if (angle === "tech") {
      angleInstructions = `Deconstruct the system architecture, scaling challenges, and technology stack of ${companyName}. Focus on how they handle peak concurrent traffic, data infrastructure, API latency, or unique algorithms (e.g. food delivery tracking, fintech security, or payment routing). Speak in a language developers and tech-enthusiasts love.`;
    } else {
      // business
      angleInstructions = `Deconstruct the business model, unit economics, revenue streams, and cost structures of ${companyName}. Focus on how they make money, profit margins, cost centers, and their moat against competitors.`;
    }

    const systemPrompt = `You are a world-class viral LinkedIn business writer and developer advocate.
    Your target audience is tech professionals, startup founders, and software engineers who love high-signal deconstructions.
    
    Structure rules for the output post:
    1. Start with a hook that stops the scroll (under 120 chars).
    2. Write in a clear, easy-to-read format with single line breaks between sentences and emojis as bullet indicators.
    3. Remove all fluff or corporate jargon.
    4. Provide specific lessons or actionable takeaways.
    5. Keep it engaging: ~1,200 to 1,600 characters.
    6. Include a 5-7 slide carousel layout in the 'slides' array if requested (each slide having a strong, bite-sized value proposition).`;

    const userPrompt = `Write a viral business case study about ${companyName}.
    Angle to write: ${angleInstructions}
    Format selected: ${format || "text"} (If carousel, make sure to generate detailed slides in the 'slides' array so they can create a visual deck).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: caseStudyResponseSchema,
        maxOutputTokens: 3500,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const parsedJsonText = (response.text || "").trim();
    if (!parsedJsonText) throw new Error("Empty response from Gemini case study generator");

    const parsedData = JSON.parse(parsedJsonText);

    // Save as a draft post in MongoDB so user can edit/post it!
    await connectDB();
    const mockPostId = `case-${Date.now()}`;
    const newPost = await Post.create({
      userId: user._id,
      postId: mockPostId,
      content: parsedData.content,
      hashtags: parsedData.hashtags || [],
      hooks: parsedData.hooks || [],
      status: "draft",
      date: new Date().toISOString().split("T")[0],
      source: "case-study",
      metadata: {
        company: companyName,
        angle: angle,
        slides: parsedData.slides || []
      }
    });

    return NextResponse.json({
      success: true,
      post: newPost
    });

  } catch (error) {
    console.error("Case study generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
