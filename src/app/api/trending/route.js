import { fetchAllTrending } from "@/lib/trending";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import TrendingCache from "@/models/TrendingCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// GET: serve the daily cron's cached scan when fresh; otherwise fetch live and refresh cache.
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Try the cron-populated cache first.
    try {
      await connectDB();
      const cached = await TrendingCache.findOne({ key: "latest" }).lean();
      if (cached?.data && cached.scannedAt && Date.now() - new Date(cached.scannedAt).getTime() < CACHE_TTL_MS) {
        return Response.json({ ...cached.data, scannedAt: cached.scannedAt, cached: true });
      }
    } catch {
      // cache unavailable — fall through to live fetch
    }

    const data = await fetchAllTrending();

    // Refresh the cache opportunistically (non-blocking failure).
    try {
      await connectDB();
      await TrendingCache.findOneAndUpdate(
        { key: "latest" },
        { data, scannedAt: new Date() },
        { upsert: true }
      );
    } catch {
      // ignore cache write errors
    }

    return Response.json({ ...data, scannedAt: new Date().toISOString(), cached: false });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
