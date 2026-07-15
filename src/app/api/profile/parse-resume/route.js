import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";


export const runtime = "nodejs";

const resumeParseSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    headline: { type: "string" },
    location: { type: "string" },
    initials: { type: "string" },
    stack: { type: "array", items: { type: "string" }, description: "Core skills or technologies (e.g. React, Python)" },
    achievements: { type: "array", items: { type: "string" }, description: "Key career accomplishments or metrics (e.g. Optimized queries by 40%)" },
    projects: { type: "array", items: { type: "string" }, description: "Names and descriptions of major projects built" },
    summary: { type: "string", description: "A brief professional about/bio summary" },
    experience: { type: "array", items: { type: "string" }, description: "Past work roles, companies, and date ranges (e.g. Software Engineer at Google, 2024-2025)" },
    certifications: { type: "array", items: { type: "string" }, description: "Professional certifications and credentials" },
    hobbies: { type: "array", items: { type: "string" }, description: "Hobbies or personal interests" },
    extracurricular: { type: "array", items: { type: "string" }, description: "Extra-curricular activities or volunteer work" }
  },
  required: ["name", "headline", "location", "stack", "achievements", "projects", "summary", "experience"]
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
    const data = await req.formData();
    const file = data.get("file");
    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to array buffer and process with pdf-parse
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const pdf = require("pdf-parse/lib/pdf-parse.js");
    const parsedPdf = await pdf(buffer);
    const resumeText = parsedPdf.text || "";

    if (!resumeText.trim()) {
      return NextResponse.json({ success: false, error: "Could not extract text from the PDF file." }, { status: 400 });
    }

    // Call Gemini to structure the resume text into the profile schema
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = `You are an expert resume parser and profiler. Your job is to extract comprehensive professional information from raw resume text and structure it into a clean JSON object fitting the schema.
    
    Make sure to:
    1. Extract the user's name.
    2. Write a short, high-impact professional headline matching their skills (suited for LinkedIn).
    3. Generate a 2-letter initials code (e.g. CK for Chandan Kushwaha).
    4. Format experience entries clearly with role, company, and duration.
    5. Clean up lists of tech stack skills, achievements, and projects into neat array items.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse this resume text:\n\n${resumeText}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: resumeParseSchema,
        maxOutputTokens: 3000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const parsedJsonText = (response.text || "").trim();
    if (!parsedJsonText) throw new Error("Empty response from Gemini parser");

    const parsedData = JSON.parse(parsedJsonText);

    // Save to Database
    await connectDB();
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          "profile.name": parsedData.name || "",
          "profile.headline": parsedData.headline || "",
          "profile.location": parsedData.location || "",
          "profile.initials": parsedData.initials || "",
          "profile.stack": parsedData.stack || [],
          "profile.achievements": parsedData.achievements || [],
          "profile.projects": parsedData.projects || [],
          "profile.summary": parsedData.summary || "",
          "profile.experience": parsedData.experience || [],
          "profile.certifications": parsedData.certifications || [],
          "profile.hobbies": parsedData.hobbies || [],
          "profile.extracurricular": parsedData.extracurricular || []
        }
      },
      { returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        profile: updatedUser.profile,
      }
    });

  } catch (error) {
    console.error("Resume parsing error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
