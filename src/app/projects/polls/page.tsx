import { PollForm } from "@/features/polls/client";

export default function PollsPage() {
  return (
    <section className="space-y-6">
      <div className="panel-shell rounded-2xl p-5 sm:p-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Operations overview</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-(--text-primary) sm:text-4xl">
              Real-time polling
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-(--text-secondary) sm:text-base">
              Capture a decision, invite votes, and surface live results without leaving the
              product flow.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            {[
              ["Live updates", "SSE"],
              ["Vote safety", "Duplicate protection"],
              ["Storage", "PostgreSQL"],
            ].map(([label, value]) => (
              <div key={label} className="panel-surface rounded-xl p-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-(--text-muted)">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-(--text-primary)">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="panel-surface rounded-2xl p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow">Create</p>
                <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">New poll</h2>
              </div>
              <span className="status-pill">
                <span className="status-dot" />
                Ready
              </span>
            </div>
            <PollForm />
          </div>

          <aside className="panel-surface rounded-2xl p-5 sm:p-6">
            <p className="eyebrow">Workflow</p>
            <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">How this works</h2>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-(--text-secondary)">
              <li className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-(--accent)/15 text-xs font-semibold text-(--accent)">
                  1
                </span>
                <span>Define a clear question and between two and ten answer choices.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-(--accent)/15 text-xs font-semibold text-(--accent)">
                  2
                </span>
                <span>Share the generated link and collect submissions from the audience.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-(--accent)/15 text-xs font-semibold text-(--accent)">
                  3
                </span>
                <span>Track live result changes as each vote is persisted and streamed.</span>
              </li>
            </ol>
          </aside>
        </div>
      </div>
    </section>
  );
}
