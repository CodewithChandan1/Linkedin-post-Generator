import { getAuthUrl, LINKEDIN_CONFIG } from "@/lib/linkedin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  if (!LINKEDIN_CONFIG.clientId) {
    return Response.json(
      { error: "LINKEDIN_CLIENT_ID not set in .env.local" },
      { status: 500 }
    );
  }

  // Generate a simple state param to prevent CSRF
  const state = Math.random().toString(36).slice(2);
  const url = getAuthUrl(state);

  return NextResponse.redirect(url);
}
