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

  const { poll, loading, error, setPoll } = usePoll(pollId);

  const handlePollUpdate = useCallback(
    (data: { totalVotes: number; options: PollData["options"] }) => {
      setPoll((prev) =>
        prev ? { ...prev, totalVotes: data.totalVotes, options: data.options } : prev,
      );
    },
    [setPoll],
  );

  const { liveStatus, lastUpdatedAt } = usePollResults(pollId, Boolean(pollId), handlePollUpdate);

  const handleVoted = useCallback(() => {
    setHasVoted(true);
    if (pollId) {
      fetch(`/api/projects/polls/${pollId}`)
        .then((res) => {
          if (!res.ok) throw new Error("refetch failed");
          return res.json();
        })
        .then((data) => setPoll(data))
        .catch(() => {
          // Results will update via SSE; no action needed.
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
      <div className="panel-shell rounded-2xl p-8 text-center">
        <p className="mb-4 text-(--text-secondary)">{error || "Poll not found."}</p>
        <Link href={pollsHref} className="text-sm font-medium text-(--accent) hover:underline">
          Create a new poll
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="panel-shell rounded-2xl p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Poll</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-(--text-primary) sm:text-3xl">
              {poll.question}
            </h1>
          </div>

          <div className="w-full max-w-md">
            <PollShare pollId={poll.id} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="panel-surface rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-(--text-muted)">Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="status-dot" />
              <span className="text-sm font-medium text-(--text-primary)">{liveStatus === "paused" ? "Paused" : "Live"}</span>
            </div>
          </div>
          <div className="panel-surface rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-(--text-muted)">Responses</p>
            <p className="mt-2 text-lg font-semibold text-(--text-primary)">{poll.totalVotes}</p>
          </div>
          <div className="panel-surface rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-(--text-muted)">Updated</p>
            <p className="mt-2 text-sm font-medium text-(--text-secondary)">
              {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Awaiting first result"}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel-surface rounded-2xl p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-(--text-primary)">Vote</h2>
            <span className="status-pill">Select one</span>
          </div>
          <PollVote pollId={poll.id} options={poll.options} onVoted={handleVoted} />
          {hasVoted ? (
            <p className="mt-4 text-sm text-(--text-secondary)">
              Vote recorded. Results continue updating live.
            </p>
          ) : null}
        </section>

        <section className="panel-surface rounded-2xl p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-(--text-primary)">Live results</h2>
            <span className="status-pill">{liveStatus === "connected" ? "Connected" : liveStatus === "paused" ? "Paused" : "Refreshing"}</span>
          </div>
          <PollResults
            options={poll.options}
            totalVotes={poll.totalVotes}
            liveStatus={liveStatus}
            lastUpdatedAt={lastUpdatedAt}
          />
        </section>
      </div>

      <div className="pt-2">
        <Link href={pollsHref} className="inline-flex items-center text-sm font-medium text-(--accent) hover:underline">
          ← Back to polls
        </Link>
      </div>
    </div>
  );
}
