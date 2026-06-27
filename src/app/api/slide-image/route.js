// Server-side proxy for pollinations.ai slide images.
// Browsers choke on cross-origin <img>+canvas / fetch for these (CORS + 30-45s
// generation). Fetching server-side avoids all browser CORS limits and lets us
// cache the bytes so the preview and the .pptx export reuse one generation.

export const runtime = "nodejs";
export const maxDuration = 60;

const cache = new Map(); // url -> { ct, buf }

function isAllowed(u) {
  try {
    return new URL(u).hostname === "image.pollinations.ai";
  } catch {
    return false;
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const format = searchParams.get("format") || "img";

  if (!url || !isAllowed(url)) {
    return Response.json({ error: "invalid or disallowed url" }, { status: 400 });
  }

  try {
    let entry = cache.get(url);
    if (!entry) {
      const res = await fetch(url); // pollinations is slow (30-45s) — no timeout, let it finish
      if (!res.ok) return Response.json({ error: `upstream ${res.status}` }, { status: 502 });
      const ct = res.headers.get("content-type") || "image/jpeg";
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) return Response.json({ error: "empty image" }, { status: 502 });
      entry = { ct, buf };
      if (cache.size > 60) cache.clear(); // simple bound
      cache.set(url, entry);
    }

    if (format === "dataurl") {
      return Response.json({ dataUrl: `data:${entry.ct};base64,${entry.buf.toString("base64")}` });
    }
    return new Response(entry.buf, {
      headers: { "Content-Type": entry.ct, "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
