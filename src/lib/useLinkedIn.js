import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "linkedin_connection";

function loadConnection() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Check if token is expired
    if (data.expiresAt && Date.now() > data.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveConnection(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useLinkedIn() {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // On mount, load from storage and check URL params from OAuth callback
  useEffect(() => {
    const existing = loadConnection();
    if (existing) {
      setConnection(existing);
    }

    // Check if we just came back from OAuth callback
    const params = new URLSearchParams(window.location.search);

    if (params.get("linkedin_connected") === "true") {
      const data = {
        accessToken: params.get("linkedin_token"),
        expiresAt: Number(params.get("linkedin_expires")),
        name: params.get("linkedin_name"),
        picture: params.get("linkedin_picture"),
        authorId: params.get("linkedin_author_id"),
      };
      saveConnection(data);
      setConnection(data);
      // Clean up the URL
      window.history.replaceState({}, "", "/");
    }

    if (params.get("linkedin_error")) {
      setError(decodeURIComponent(params.get("linkedin_error")));
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const connect = useCallback(() => {
    // Redirect to our OAuth start endpoint
    window.location.href = "/api/linkedin/auth";
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConnection(null);
  }, []);

  const post = useCallback(
    async (text, imageUrl) => {
      if (!connection?.accessToken || !connection?.authorId) {
        throw new Error("Not connected to LinkedIn");
      }

      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/linkedin/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: connection.accessToken,
            authorId: connection.authorId,
            text,
            imageUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Post failed");
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [connection]
  );

  const isConnected = Boolean(connection?.accessToken);
  const isExpired = connection?.expiresAt ? Date.now() > connection.expiresAt : false;
  const daysUntilExpiry = connection?.expiresAt
    ? Math.max(0, Math.floor((connection.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    isConnected: isConnected && !isExpired,
    connection,
    loading,
    error,
    daysUntilExpiry,
    connect,
    disconnect,
    post,
    clearError: () => setError(""),
  };
}
