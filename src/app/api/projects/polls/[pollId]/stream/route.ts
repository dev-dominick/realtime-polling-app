import { getDb } from "@/lib/db";
import { createApiErrorBody } from "@/lib/http/api-error";
import { formatError, logError } from "@/lib/log";
import { UUID_RE } from "@/lib/utils/helpers";

const MAX_STREAM_DURATION_MS = 50 * 1000; // 50 seconds (fits within Lambda 55s timeout)

export async function GET(request: Request, { params }: { params: Promise<{ pollId: string }> }) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const { pollId } = await params;

  if (!UUID_RE.test(pollId)) {
    return Response.json(
      createApiErrorBody({ code: "INVALID_ID", message: "Invalid poll ID", requestId }),
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sql = getDb();

      // Verify poll exists
      const [poll] = await sql`SELECT id FROM polls WHERE id = ${pollId}`;
      if (!poll) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "NOT_FOUND" })}\n\n`));
        controller.close();
        return;
      }

      async function sendUpdate() {
        if (closed) return;
        try {
          const options = await sql<
            {
              id: string;
              label: string;
              position: number;
              votes: number;
            }[]
          >`
            SELECT
              po.id,
              po.label,
              po.position,
              COUNT(pv.id)::int AS votes
            FROM poll_options po
            LEFT JOIN poll_votes pv ON pv.poll_option_id = po.id
            WHERE po.poll_id = ${pollId}
            GROUP BY po.id, po.label, po.position
            ORDER BY po.position
          `;

          const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
          const payload = {
            totalVotes,
            options: options.map((o) => ({
              id: o.id,
              label: o.label,
              position: o.position,
              votes: o.votes,
              percentage: totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0,
            })),
          };

          if (closed || request.signal.aborted) return;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (err) {
          if (!closed && !request.signal.aborted) {
            logError("polls.stream_query_failed", { pollId, error: formatError(err) });
          }
        }
      }

      // Send initial data immediately
      await sendUpdate();

      // Poll every 2 seconds
      const interval = setInterval(sendUpdate, 2000);

      // Auto-close after max duration to prevent leaked connections
      const timeout = setTimeout(() => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }, MAX_STREAM_DURATION_MS);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearTimeout(timeout);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "x-request-id": requestId,
    },
  });
}
