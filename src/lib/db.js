// MongoDB connection with connection pooling for Next.js
// Reuses existing connection across hot reloads in dev mode

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/linkedin-autopost";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

// Global cache to prevent multiple connections in dev (Next.js hot reload)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
