import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createApiErrorBody } from "@/lib/http/api-error";
import { formatError, logError } from "@/lib/log";
import { UUID_RE } from "@/lib/utils/helpers";

interface OptionRow {
  id: string;
  label: string;
  position: number;
  votes: number;
}

interface PollRow {
  id: string;
  question: string;
  created_at: string;
  expires_at: string | null;
}

export async function GET(request: Request, { params }: { params: Promise<{ pollId: string }> }) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const { pollId } = await params;

  if (!UUID_RE.test(pollId)) {
    return NextResponse.json(
      createApiErrorBody({ code: "INVALID_ID", message: "Invalid poll ID", requestId }),
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  try {
    const sql = getDb();

    const [poll] = await sql<PollRow[]>`
      SELECT id, question, created_at, expires_at
      FROM polls
      WHERE id = ${pollId}
    `;

    if (!poll) {
      return NextResponse.json(
        createApiErrorBody({ code: "NOT_FOUND", message: "Poll not found", requestId }),
        { status: 404, headers: { "x-request-id": requestId } },
      );
    }

    const options = await sql<OptionRow[]>`
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

    return NextResponse.json(
      {
        id: poll.id,
        question: poll.question,
        createdAt: poll.created_at,
        expiresAt: poll.expires_at,
        totalVotes,
        options: options.map((o) => ({
          id: o.id,
          label: o.label,
          position: o.position,
          votes: o.votes,
          percentage: totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0,
        })),
      },
      { headers: { "cache-control": "no-store", "x-request-id": requestId } },
    );
  } catch (err) {
    logError("polls.get_failed", { requestId, pollId, error: formatError(err) });
    return NextResponse.json(
      createApiErrorBody({ code: "INTERNAL_ERROR", message: "Internal server error", requestId }),
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const { pollId } = await params;

  if (!UUID_RE.test(pollId)) {
    return NextResponse.json(
      createApiErrorBody({ code: "INVALID_ID", message: "Invalid poll ID", requestId }),
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  try {
    const sql = getDb();
    const [deleted] = await sql<{ id: string }[]>`
      DELETE FROM polls
      WHERE id = ${pollId}
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        createApiErrorBody({ code: "NOT_FOUND", message: "Poll not found", requestId }),
        { status: 404, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { success: true, id: deleted.id },
      { status: 200, headers: { "cache-control": "no-store", "x-request-id": requestId } },
    );
  } catch (err) {
    logError("polls.delete_failed", { requestId, pollId, error: formatError(err) });
    return NextResponse.json(
      createApiErrorBody({ code: "INTERNAL_ERROR", message: "Internal server error", requestId }),
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
