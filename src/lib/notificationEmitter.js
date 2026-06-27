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
 * Emit a notification to all open browser tabs of a user.
 *
 * @param {string} userId
 * @param {{ type?: string, title: string, message?: string, icon?: string }} payload
 */
export function emitNotification(userId, payload) {
  const fns = clients.get(userId);
  if (!fns || fns.size === 0) return;
  const event = {
    id: Date.now().toString(),
    type: payload.type || "info",
    title: payload.title,
    message: payload.message || "",
    icon: payload.icon || "",
    createdAt: new Date().toISOString(),
    read: false,
  };
  fns.forEach((fn) => fn(event));
}
