import { postToLinkedIn } from "@/lib/linkedin";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { accessToken, authorId, text, imageUrl } = await req.json();

    if (!accessToken || !authorId || !text) {
      return Response.json(
        { error: "Missing accessToken, authorId, or text" },
        { status: 400 }
      );
    }

    const result = await postToLinkedIn({ accessToken, authorId, text, imageUrl });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
