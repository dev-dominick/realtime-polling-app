import { PollForm } from "@/features/polls/client";

export default function PollsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-(--text-primary) sm:text-3xl">
        Create a poll
      </h1>
      <p className="mt-2 mb-8 text-sm text-(--text-secondary) leading-relaxed">
        Ask a question, add options, and share the link. Results refresh live through
        server-streamed SSE updates.
      </p>
      <PollForm />
    </>
  );
}
