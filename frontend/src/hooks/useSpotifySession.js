import { useCallback, useEffect, useState } from "react";
import { apiRequest, clearLegacyTokens } from "../api.js";

export function useSpotifySession() {
  const [session, setSession] = useState(null);
  const [listens, setListens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reportError = useCallback((failure) => {
    if (failure.name === "AbortError") return;
    setError(failure.message);
    if (failure.status === 401) {
      setSession(null);
      setListens([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    clearLegacyTokens();
    async function initialize() {
      try {
        const next = await apiRequest("/api/session", {
          signal: controller.signal,
        });
        const history = next.connected
          ? await apiRequest("/api/listens", { signal: controller.signal })
          : { listens: [] };
        if (controller.signal.aborted) return;
        setSession(next);
        setListens(history.listens);
        const params = new URLSearchParams(location.search);
        if (params.has("auth")) {
          window.history.replaceState({}, "", location.pathname);
          if (params.get("auth") === "denied")
            setError("Spotify connection was cancelled.");
        }
      } catch (failure) {
        if (!controller.signal.aborted) reportError(failure);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    initialize();
    return () => controller.abort();
  }, [reportError]);

  const addListen = useCallback((saved) => {
    setListens((existing) =>
      existing.some((listen) => listen.id === saved.id)
        ? existing
        : [...existing, saved],
    );
  }, []);

  async function connect() {
    setBusy(true);
    setError("");
    try {
      const current = await apiRequest("/api/session");
      setSession(current);
      const result = await apiRequest("/auth/login", {
        method: "POST",
        csrfToken: current.csrfToken,
      });
      location.assign(result.url);
    } catch (failure) {
      reportError(failure);
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        csrfToken: session?.csrfToken,
      });
      setSession(null);
      setListens([]);
    } catch (failure) {
      reportError(failure);
    } finally {
      setBusy(false);
    }
  }

  return {
    session,
    listens,
    loading,
    busy,
    error,
    connect,
    disconnect,
    addListen,
    reportError,
  };
}
