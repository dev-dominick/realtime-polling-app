import Link from "next/link";

export default function PollsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="panel-shell rounded-2xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border-default) bg-(--surface-raised) text-(--accent)
                  shadow-(--shadow-sm)">
                  <span className="text-lg font-bold">P</span>
                </div>
                <div>
                  <p className="eyebrow">Realtime product</p>
                  <h1 className="text-lg font-semibold text-(--text-primary)">Polling studio</h1>
                </div>
              </div>

              <nav className="flex items-center gap-2 rounded-full border border-(--border-subtle) bg-(--surface-raised)/80 p-1.5">
                <Link
                  href="/projects/polls"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-(--text-secondary) hover:bg-(--surface-overlay) hover:text-(--text-primary)"
                >
                  Create
                </Link>
                <Link
                  href="/projects/polls"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-(--text-secondary) hover:bg-(--surface-overlay) hover:text-(--text-primary)"
                >
                  Live
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
