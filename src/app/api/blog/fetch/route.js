import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag") || "webdev";
  const id = searchParams.get("id");

  try {
    if (id) {
      // Fetch a single article by ID (includes body_html for reading)
      const res = await fetch(`https://dev.to/api/articles/${id}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });

      if (!res.ok) throw new Error(`Dev.to API returned status ${res.status}`);
      const article = await res.json();

      return NextResponse.json({
        success: true,
        article: {
          id: article.id?.toString(),
          title: article.title,
          description: article.description,
          coverImage: article.cover_image || article.social_image || "",
          url: article.url,
          bodyHtml: article.body_html || "",
          readingTime: article.reading_time_minutes,
          publishedAt: article.published_at,
          author: {
            name: article.user?.name || "Anonymous",
            username: article.user?.username || "",
            profileImage: article.user?.profile_image || "",
          },
        },
      });
    } else {
      // Fetch list of articles by tag
      const res = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=12`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });

      if (!res.ok) throw new Error(`Dev.to API returned status ${res.status}`);
      const list = await res.json();

      const articles = list.map((article) => ({
        id: article.id?.toString(),
        title: article.title,
        description: article.description,
        coverImage: article.cover_image || article.social_image || "",
        url: article.url,
        readingTime: article.reading_time_minutes,
        publishedAt: article.published_at,
        tags: article.tag_list || [],
        author: {
          name: article.user?.name || "Anonymous",
          username: article.user?.username || "",
          profileImage: article.user?.profile_image || "",
        },
      }));

      return NextResponse.json({ success: true, articles });
    }
  } catch (error) {
    console.error("Failed to fetch from Dev.to:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }
}
