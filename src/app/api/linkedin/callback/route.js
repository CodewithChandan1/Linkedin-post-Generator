import { exchangeCodeForToken, getLinkedInProfile } from "@/lib/linkedin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    // User denied access or something went wrong
    const desc = searchParams.get("error_description") || error;
    return NextResponse.redirect(
      new URL(`/?linkedin_error=${encodeURIComponent(desc)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?linkedin_error=No+authorization+code+received", req.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, expires_in } = tokenData;

    // Get the user's LinkedIn profile to extract their person ID
    const profile = await getLinkedInProfile(access_token);
    const authorId = profile.sub; // OpenID Connect subject = person URN ID

    // Pass token data back to the client via URL params.
    // The client stores it in localStorage. This avoids needing a database for MVP.
    const params = new URLSearchParams({
      linkedin_connected: "true",
      linkedin_token: access_token,
      linkedin_expires: String(Date.now() + expires_in * 1000),
      linkedin_name: profile.name || "",
      linkedin_picture: profile.picture || "",
      linkedin_author_id: authorId,
    });

    return NextResponse.redirect(new URL(`/?${params.toString()}`, req.url));
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/?linkedin_error=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}
