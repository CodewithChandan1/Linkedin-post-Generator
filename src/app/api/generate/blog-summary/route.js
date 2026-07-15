import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export const runtime = "nodejs";

const blogSummaryResponseSchema = {
  type: "object",
  properties: {
    content: { type: "string", description: "The full deconstruction LinkedIn post text structured with spacing and emoji indicators" },
    hashtags: { type: "array", items: { type: "string" } },
    hooks: { type: "array", items: { type: "string" }, description: "3 catchy alternate opening hooks" },
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
    const { title, content, notes } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
    }

    const userProfile = user.profile;
    const ai = new GoogleGenAI({ apiKey });

    // Clean up content to fit within context limits if excessively long
    const slicedContent = content.slice(0, 12000);

    const systemInstruction = `You are a world-class LinkedIn ghostwriter for ${userProfile.name}, a developer from ${userProfile.location || "India"}.
    
    Your job is to read a technical article and write a high-impact LinkedIn post summarizing the key lessons and takeaways in ${userProfile.name}'s professional voice.
    
    CRITICAL INSTRUCTION:
    Weave in their custom notes/reviews naturally as their own perspective/commentary:
    "${notes || "No custom notes"}"
    If they provided notes, make sure that perspective is the primary focus/takeaway of the post!
    
    Structure rules:
    - Start with a scroll-stopping hook (2 lines max).
    - Use clear subheadings and emoji-based bullet points.
    - Casually mention developer coding habits (e.g. late night coding, chai, coffee) if natural.
    - End with an open-ended question to drive comment engagement.
    - Remove all AI-telltale buzzwords ("In today's fast-paced world", "delve", "game-changer", "demystify").
    - The post must be 1,200-1,800 characters.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Article Title: "${title}"\n\nArticle Content:\n${slicedContent}\n\nUser's Personal Thoughts/Notes:\n"${notes || ""}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: blogSummaryResponseSchema,
        maxOutputTokens: 3000,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const parsedJsonText = (response.text || "").trim();
    if (!parsedJsonText) throw new Error("Empty response from Gemini blog summarizer");

    const parsedData = JSON.parse(parsedJsonText);

    // Save as a draft post in MongoDB
    await connectDB();
    const mockPostId = `blog-${Date.now()}`;
    const newPost = await Post.create({
      userId: user._id,
      postId: mockPostId,
      content: parsedData.content,
      hashtags: parsedData.hashtags || [],
      hooks: parsedData.hooks || [],
      status: "draft",
      date: new Date().toISOString().split("T")[0],
      source: "blog-curation",
      metadata: {
        articleTitle: title,
        userNotes: notes || ""
      }
    });

    return NextResponse.json({
      success: true,
      post: newPost
    });

  } catch (error) {
    console.error("Blog summary post generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
