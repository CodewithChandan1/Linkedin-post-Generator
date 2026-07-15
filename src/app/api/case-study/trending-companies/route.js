import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import TrendingCache from "@/models/TrendingCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (Daily Refresh)

const companiesSchema = {
  type: "object",
  properties: {
    companies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          emoji: { type: "string" }
        },
        required: ["name", "emoji"]
      }
    }
  },
  required: ["companies"]
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  try {
    await connectDB();
    
    // Check cached list of trending companies
    const cached = await TrendingCache.findOne({ key: "trending-companies" }).lean();
    if (cached?.data?.companies && cached.scannedAt && Date.now() - new Date(cached.scannedAt).getTime() < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, companies: cached.data.companies, cached: true });
    }

    // Call Gemini to generate a fresh list of trending business/tech companies
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a list of 7 trending business companies or tech startups that are highly discussed or in the news today (e.g. Swiggy, Zerodha, Nvidia, Zomato, CRED, Tesla, OpenAI). Assign a matching emoji for each.",
      config: {
        responseMimeType: "application/json",
        responseSchema: companiesSchema,
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const parsedJsonText = (response.text || "").trim();
    if (!parsedJsonText) throw new Error("Empty response from Gemini for trending companies");

    const parsedData = JSON.parse(parsedJsonText);

    // Save to cache
    await TrendingCache.findOneAndUpdate(
      { key: "trending-companies" },
      { data: { companies: parsedData.companies }, scannedAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, companies: parsedData.companies, cached: false });

  } catch (error) {
    console.error("Failed to fetch trending companies:", error);
    // Fallback static list in case of errors
    const fallback = [
      { name: "Zomato", emoji: "🛵" },
      { name: "Zerodha", emoji: "📈" },
      { name: "Swiggy", emoji: "🍔" },
      { name: "Paytm", emoji: "📱" },
      { name: "CRED", emoji: "💳" },
      { name: "Airbnb", emoji: "🏡" },
      { name: "Apple", emoji: "🍎" },
    ];
    return NextResponse.json({ success: true, companies: fallback, error: error.message });
  }
}
