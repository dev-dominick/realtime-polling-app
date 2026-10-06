"use client";

import { motion } from "framer-motion";

import type { PollOption } from "../types";

interface PollResultsProps {
  options: PollOption[];
  totalVotes: number;
  liveStatus?: "connected" | "refreshing" | "paused";
  lastUpdatedAt?: number | null;
}

function getLiveStatusText(status: "connected" | "refreshing" | "paused") {
  if (status === "connected") return "Live results connected";
  if (status === "paused") return "Live updates paused";
  return "Refreshing results";
}

function formatLastUpdated(lastUpdatedAt: number | null | undefined) {
  if (!lastUpdatedAt) return "Waiting for first live refresh";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(lastUpdatedAt));
}

export function PollResults({
  options,
  totalVotes,
  liveStatus = "refreshing",
  lastUpdatedAt = null,
}: PollResultsProps) {
  const maxVotes = Math.max(...options.map((o) => o.votes), 1);

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-(--border-subtle) bg-(--surface-raised) px-3 py-2">
        <p className="text-xs font-medium text-(--text-primary)">{getLiveStatusText(liveStatus)}</p>
        <p className="mt-1 text-xs text-(--text-muted)">{`Last updated ${formatLastUpdated(lastUpdatedAt)}`}</p>
      </div>

      {options.map((option) => (
        <div key={option.id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-(--text-primary)">{option.label}</span>
            <span className="text-(--text-secondary) tabular-nums">
              {option.votes} {option.votes === 1 ? "vote" : "votes"} ({option.percentage}%)
            </span>
          </div>
          <div className="h-8 w-full rounded-md bg-(--surface-raised) overflow-hidden">
            <motion.div
              className="h-full rounded-md bg-(--accent)"
              initial={{ width: 0 }}
              animate={{ width: `${maxVotes > 0 ? (option.votes / maxVotes) * 100 : 0}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ opacity: 0.3 + (option.votes / maxVotes) * 0.7 }}
            />
          </div>
        </div>
      ))}
      <p className="text-sm text-(--text-muted) pt-2">
        {totalVotes} total {totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}
