"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

import type { PollOption } from "../types";

interface PollVoteProps {
  pollId: string;
  options: PollOption[];
  onVoted: () => void;
}

export function PollVote({ pollId, options, onVoted }: PollVoteProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVote() {
    if (!selected) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/projects/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selected }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data?.error?.code === "ALREADY_VOTED") {
          setError("Your vote was already recorded. Showing current results.");
          onVoted();
          return;
        }
        setError(data?.error?.message || "Failed to vote.");
        return;
      }

      onVoted();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-(--error)/40 bg-(--error-muted) p-3 text-sm text-(--error)">
          {error}
        </div>
      )}

      <fieldset className="space-y-2" aria-label="Poll options">
        <legend className="sr-only">Select one option and submit your vote</legend>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelected(option.id)}
            disabled={submitting}
            aria-pressed={selected === option.id}
            className={`w-full p-3 rounded-md border-2 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface-base) ${
              selected === option.id
                ? "border-(--accent) bg-(--accent) bg-opacity-10"
                : "border-(--border-subtle) hover:border-(--accent)"
            }`}
          >
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </fieldset>

      <Button onClick={handleVote} disabled={!selected || submitting} className="w-full">
        {submitting ? "Voting..." : "Vote"}
      </Button>
    </div>
  );
}
