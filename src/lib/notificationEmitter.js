// src/lib/notificationEmitter.js
// In-memory client registry for SSE connections.
// Works for single-instance deployments (local dev, single Vercel instance).
// For multi-instance production, replace with Redis pub/sub.

/** @type {Map<string, Set<Function>>} userId → set of push functions */
const clients = new Map();

/**
 * Register a push function for a user.
 * Called from the SSE route when a client connects.
 */
export function addClient(userId, pushFn) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(pushFn);
}

/**
 * Remove a push function when a client disconnects.
 */
export function removeClient(userId, pushFn) {
  const fns = clients.get(userId);
  if (!fns) return;
  fns.delete(pushFn);
  if (fns.size === 0) clients.delete(userId);
}

/**
 * Emit a notification to all open browser tabs of a user AND persist to DB.
 *
 * @param {string} userId
 * @param {{ type?: string, title: string, message?: string, icon?: string }} payload
 */
export async function emitNotification(userId, payload) {
  const event = {
    id: Date.now().toString(),
    type: payload.type || "info",
    title: payload.title,
    message: payload.message || "",
    icon: payload.icon || "",
    createdAt: new Date().toISOString(),
    read: false,
  };

  // Persist to MongoDB (import lazily to avoid issues in edge runtime)
  try {
    const { connectDB } = await import("@/lib/db");
    const { default: Notification } = await import("@/models/Notification");
    await connectDB();
    const saved = await Notification.create({
      userId,
      type: event.type,
      title: event.title,
      message: event.message,
      icon: event.icon,
    });
    // Use MongoDB _id as the canonical id
    event.id = saved._id.toString();
    event._id = event.id;
  } catch (err) {
    console.error("emitNotification: DB save failed", err?.message);
  }

  // Push to all connected SSE clients for this user
  const fns = clients.get(userId);
  if (fns && fns.size > 0) {
    fns.forEach((fn) => fn(event));
  }
}
