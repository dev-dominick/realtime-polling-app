import { useEffect, useState } from "react";

import type { PollData } from "../types";

/**
 * Fetch a poll by ID
 */
export function usePoll(pollId: string | null) {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pollId) {
      // No poll can be loaded until an id is available.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchPoll() {
      try {
        const res = await fetch(`/api/projects/polls/${pollId}`, { signal: controller.signal });
        if (!res.ok) {
          setError(res.status === 404 ? "Poll not found." : "Failed to load poll.");
          return;
        }
        const data = await res.json();
        setPoll(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    }

    fetchPoll();
    return () => controller.abort();
  }, [pollId]);

  return { poll, loading, error, setPoll };
}

/**
 * Subscribe to poll results via Server-Sent Events
 * Updates the poll data in-place as votes come in
 * Auto-reconnects on disconnect with a brief delay
 */
export function usePollResults(
  pollId: string | null,
  enabled: boolean,
  onDataUpdate?: (data: { totalVotes: number; options: PollData["options"] }) => void,
) {
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<"connected" | "refreshing" | "paused">("refreshing");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !pollId) return;

    let cancelled = false;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;
      setError(null);
      setLiveStatus("refreshing");
      es = new EventSource(`/api/projects/polls/${pollId}/stream`);

      es.onopen = () => {
        if (cancelled) return;
        setError(null);
        setLiveStatus("connected");
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setError(data.error === "NOT_FOUND" ? "Poll not found." : "Stream error.");
            setLiveStatus("paused");
            es?.close();
            return;
          }
          setError(null);
          setLiveStatus("connected");
          setLastUpdatedAt(Date.now());
          // Call the update callback if provided
          if (onDataUpdate) {
            onDataUpdate(data);
          }
        } catch {
          // ignore malformed messages
        }
      };

      es.onerror = () => {
        es?.close();
        setError("Stream interrupted. Retrying...");
        setLiveStatus("paused");
        // Auto-reconnect after a short delay unless the component unmounted
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [pollId, enabled, onDataUpdate]);

  const status = enabled && pollId ? liveStatus : "paused";

  return { error, liveStatus: status, lastUpdatedAt };
}
