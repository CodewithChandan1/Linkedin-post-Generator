// Daily trending scan cron — fires server-side via Vercel Cron (see vercel.json).
// Fetches GitHub / HN / dev.to / npm once a day and caches the result so the
// app serves trending topics instantly instead of hitting 4 APIs per visit.

import { fetchAllTrending } from "@/lib/trending";
import { connectDB } from "@/lib/db";
import TrendingCache from "@/models/TrendingCache";
import { isAuthorizedCron } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isAuthorizedCron(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fetchAllTrending();

    await connectDB();
    await TrendingCache.findOneAndUpdate(
      { key: "latest" },
      { data, scannedAt: new Date() },
      { upsert: true }
    );

    return Response.json({
      success: true,
      scannedAt: new Date().toISOString(),
      total: data.total,
      relevant: data.relevant?.length || 0,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
