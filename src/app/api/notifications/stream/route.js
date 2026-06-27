// src/app/api/notifications/stream/route.js
// Server-Sent Events endpoint — keeps a long-lived connection open and pushes
// events to the connected browser tab in real time.
//
// Usage (client):
//   const es = new EventSource('/api/notifications/stream');
//   es.onmessage = (e) => console.log(JSON.parse(e.data));
//
// Usage (server, from any route):
//   import { emitNotification } from '@/lib/notificationEmitter';
//   emitNotification(userId, { type:'success', title:'Email sent!', message:'...' });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/auth";
import { addClient, removeClient } from "@/lib/notificationEmitter";

export async function GET(req) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = user._id.toString();

  // Create a ReadableStream that stays open
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial heartbeat so browser knows connection is alive
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Heartbeat every 25 seconds (prevents proxy timeouts)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // Push function — called by emitNotification()
      function push(payload) {
        try {
          const data = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // Client disconnected
        }
      }

      // Register this client
      addClient(userId, push);

      // Cleanup when request is aborted (tab closed / navigated away)
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeClient(userId, push);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
