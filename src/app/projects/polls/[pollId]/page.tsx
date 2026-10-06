"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { PollVote, PollResults, PollShare, usePoll, usePollResults } from "@/features/polls/client";
import Link from "next/link";

import type { PollData } from "@/features/polls";

export default function PollDetailPage() {
  const { pollId } = useParams<{ pollId: string }>();
  const [hasVoted, setHasVoted] = useState(false);
  const pollsHref = "/projects/polls";

  // Fetch initial poll data
  const { poll, loading, error, setPoll } = usePoll(pollId);

  // Handle SSE updates - callback to update poll state with new results
  const handlePollUpdate = useCallback(
    (data: { totalVotes: number; options: PollData["options"] }) => {
      setPoll((prev) =>
        prev ? { ...prev, totalVotes: data.totalVotes, options: data.options } : prev,
      );
    },
    [setPoll],
  );

  // Subscribe to poll results as soon as poll details are loaded.
  const { liveStatus, lastUpdatedAt } = usePollResults(pollId, Boolean(pollId), handlePollUpdate);

  const handleVoted = useCallback(() => {
    setHasVoted(true);
    // Refetch to see updated results immediately
    if (pollId) {
      fetch(`/api/projects/polls/${pollId}`)
        .then((res) => {
          if (!res.ok) throw new Error("refetch failed");
          return res.json();
        })
        .then((data) => setPoll(data))
        .catch(() => {
          // Results will update via SSE; no action needed
        });
    }
  }, [pollId, setPoll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--accent) border-t-transparent" />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="text-center py-20">
        <p className="text-(--text-secondary) mb-4">{error || "Poll not found."}</p>
        <Link href={pollsHref} className="text-sm text-(--accent) hover:underline">
          Create a new poll
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-(--text-primary) sm:text-3xl">
          {poll.question}
        </h1>
        <div className="w-full sm:max-w-md">
          <PollShare pollId={poll.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-(--border-subtle) bg-(--surface-overlay) p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-(--text-secondary)">
            Vote
          </h2>
          <PollVote pollId={poll.id} options={poll.options} onVoted={handleVoted} />
          {hasVoted ? (
            <p className="text-xs text-(--text-muted)">
              Vote recorded. Results continue updating live.
            </p>
          ) : null}
        </section>

        <section className="space-y-3 rounded-lg border border-(--border-subtle) bg-(--surface-overlay) p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-(--text-secondary)">
            Live results
          </h2>
          <PollResults
            options={poll.options}
            totalVotes={poll.totalVotes}
            liveStatus={liveStatus}
            lastUpdatedAt={lastUpdatedAt}
          />
          <p className="text-xs text-(--text-muted)">
            Live result refresh is server-streamed using SSE snapshots.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-(--border-subtle)">
        <Link href={pollsHref} className="text-sm text-(--accent) hover:underline">
          Back to polls
        </Link>
      </div>
    </>
  );
}
