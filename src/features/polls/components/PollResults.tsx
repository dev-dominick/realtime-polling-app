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
    <div className="space-y-4">
      <div className="rounded-xl border border-(--border-subtle) bg-(--surface-raised) px-3 py-2.5">
        <p className="text-xs font-semibold text-(--text-primary)">{getLiveStatusText(liveStatus)}</p>
        <p className="mt-1 text-xs text-(--text-muted)">{`Last updated ${formatLastUpdated(lastUpdatedAt)}`}</p>
      </div>

      {options.map((option) => (
        <div key={option.id} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-(--text-primary)">{option.label}</span>
            <span className="text-(--text-secondary) tabular-nums">
              {option.votes} {option.votes === 1 ? "vote" : "votes"} ({option.percentage}%)
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-(--surface-raised)">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-(--accent) to-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${maxVotes > 0 ? (option.votes / maxVotes) * 100 : 0}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ opacity: 0.9 }}
            />
          </div>
        </div>
      ))}
      <p className="pt-2 text-sm font-medium text-(--text-secondary)">
        {totalVotes} total {totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}
