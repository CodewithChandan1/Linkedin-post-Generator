// Shared guard for Vercel Cron endpoints.
// Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on scheduled
// invocations when the CRON_SECRET env var is set. We require it so the routes
// can't be triggered by the public.

export function isAuthorizedCron(req) {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, allow (useful for local dev). Set CRON_SECRET in prod.
  if (!secret) return true;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

// Current calendar date in IST as YYYY-MM-DD (used to dedupe daily sends).
export function istDateKey(date = new Date()) {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}
