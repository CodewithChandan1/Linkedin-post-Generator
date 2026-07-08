// LinkedIn Stats Auto-Sync
// Pulls reactions + comment count for a published post using the same
// w_member_social access token the user already has.
//
// LinkedIn's free-tier API gives us:
//   GET /v2/socialActions/{postUrn}  → numLikes (reactions) + numComments
//
// Full impressions/views require r_organization_social (restricted partner access).
// We store whatever we can get and leave impressions for manual entry.

import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export const runtime = "nodejs";

// Pull social action counts for a single LinkedIn post URN
async function fetchSocialActions(accessToken, postUrn) {
  const encoded = encodeURIComponent(postUrn);
  const url = `https://api.linkedin.com/v2/socialActions/${encoded}?projection=(numLikes,numComments,id)`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LinkedIn socialActions failed (${res.status}): ${body}`);
  }

  return res.json(); // { numLikes, numComments, id }
}

// POST /api/linkedin/stats
// Body: { accessToken, posts: [{ postId, linkedInPostId }] }
// Returns: { synced: [{ postId, likes, comments }], errors: [...] }
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { accessToken, posts } = await req.json();
  if (!accessToken) return Response.json({ error: "accessToken required" }, { status: 400 });
  if (!Array.isArray(posts) || posts.length === 0) {
    return Response.json({ error: "posts array required" }, { status: 400 });
  }

  await connectDB();

  const synced = [];
  const errors = [];

  // Rate-limit: LinkedIn allows ~100 req/min; add small delay between calls
  for (const { postId, linkedInPostId } of posts) {
    if (!linkedInPostId) continue;

    try {
      const data = await fetchSocialActions(accessToken, linkedInPostId);
      const likes = data.numLikes ?? 0;
      const comments = data.numComments ?? 0;

      // Persist to MongoDB
      await Post.findOneAndUpdate(
        { postId, userId: user._id },
        { $set: { likes, comments, statsLastSyncedAt: new Date() } }
      );

      synced.push({ postId, likes, comments });
    } catch (err) {
      errors.push({ postId, error: err.message });
    }

    // Small delay to avoid hammering LinkedIn API
    await new Promise((r) => setTimeout(r, 150));
  }

  return Response.json({ synced, errors });
}

// GET /api/linkedin/stats?postId=xxx&linkedInPostId=urn:li:share:xxx
// Convenience single-post sync (used right after posting)
export async function GET(req) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const linkedInPostId = searchParams.get("linkedInPostId");
  const accessToken = searchParams.get("accessToken");

  if (!postId || !linkedInPostId || !accessToken) {
    return Response.json({ error: "postId, linkedInPostId, accessToken required" }, { status: 400 });
  }

  try {
    const data = await fetchSocialActions(accessToken, linkedInPostId);
    const likes = data.numLikes ?? 0;
    const comments = data.numComments ?? 0;

    await connectDB();
    await Post.findOneAndUpdate(
      { postId, userId: user._id },
      { $set: { likes, comments, statsLastSyncedAt: new Date() } }
    );

    return Response.json({ postId, likes, comments });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
