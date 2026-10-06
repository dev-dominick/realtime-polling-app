import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getDb, type TxSql } from "@/lib/db";
import { createApiErrorBody } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { formatError, logError, logWarn } from "@/lib/log";
import { UUID_RE } from "@/lib/utils/helpers";
import { track } from "@/lib/analytics";
import { resolveVoterIdentity } from "@/features/polls/server/voter-identity";

const voteSchema = z.object({
  optionId: z.string().regex(UUID_RE, "Invalid option ID"),
});

type CookieStoreLike = { get(name: string): { value: string } | undefined };

async function getCookieStoreOrNull(): Promise<CookieStoreLike | null> {
  try {
    return await cookies();
  } catch {
    // Integration tests may invoke route handlers outside Next request scope.
    return null;
  }
}

function readErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  return (error as { code?: string }).code;
}

function isMissingIpFingerprintColumnError(error: unknown): boolean {
  return readErrorCode(error) === "42703";
}

async function submitVote(
  tx: TxSql,
  input: {
    pollId: string;
    optionId: string;
    voterId: string;
    ipFingerprint?: string;
  },
) {
  const [option] = await tx`
    SELECT po.id
    FROM poll_options po
    WHERE po.id = ${input.optionId} AND po.poll_id = ${input.pollId}
  `;

  if (!option) {
    return { error: "NOT_FOUND" as const };
  }

  const existingVote = input.ipFingerprint
    ? await tx`
        SELECT pv.id
        FROM poll_votes pv
        JOIN poll_options po ON po.id = pv.poll_option_id
        WHERE po.poll_id = ${input.pollId}
          AND (pv.voter_fingerprint = ${input.voterId} OR pv.ip_fingerprint = ${input.ipFingerprint})
      `
    : await tx`
        SELECT pv.id
        FROM poll_votes pv
        JOIN poll_options po ON po.id = pv.poll_option_id
        WHERE po.poll_id = ${input.pollId}
          AND pv.voter_fingerprint = ${input.voterId}
      `;

  if (existingVote[0]) {
    return { error: "ALREADY_VOTED" as const };
  }

  if (input.ipFingerprint) {
    await tx`
      INSERT INTO poll_votes (poll_option_id, voter_fingerprint, ip_fingerprint)
      VALUES (${input.optionId}, ${input.voterId}, ${input.ipFingerprint})
    `;
  } else {
    await tx`
      INSERT INTO poll_votes (poll_option_id, voter_fingerprint)
      VALUES (${input.optionId}, ${input.voterId})
    `;
  }

  return { error: null };
}

export async function POST(request: Request, { params }: { params: Promise<{ pollId: string }> }) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const { pollId } = await params;

  if (!UUID_RE.test(pollId)) {
    return NextResponse.json(
      createApiErrorBody({ code: "INVALID_ID", message: "Invalid poll ID", requestId }),
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  try {
    const parsed = await parseJsonBody(request, voteSchema, requestId);
    if (!parsed.ok) return parsed.response;
    const data = parsed.data;
    const sql = getDb();
    const cookieStore = await getCookieStoreOrNull();
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const { voterId, ipFingerprint } = await resolveVoterIdentity({
      cookieStore,
      clientIp,
      userAgent,
    });

    let result;

    try {
      result = await sql.begin((tx: TxSql) =>
        submitVote(tx, {
          pollId,
          optionId: data.optionId,
          voterId,
          ipFingerprint,
        }),
      );
    } catch (error) {
      if (!isMissingIpFingerprintColumnError(error)) {
        throw error;
      }

      logWarn("polls.vote_ip_fingerprint_unavailable", {
        requestId,
        pollId,
      });

      result = await sql.begin((tx: TxSql) =>
        submitVote(tx, {
          pollId,
          optionId: data.optionId,
          voterId,
        }),
      );
    }

    if (result.error === "NOT_FOUND") {
      return NextResponse.json(
        createApiErrorBody({
          code: "NOT_FOUND",
          message: "Option not found for this poll",
          requestId,
        }),
        { status: 404, headers: { "x-request-id": requestId } },
      );
    }

    if (result.error === "ALREADY_VOTED") {
      return NextResponse.json(
        createApiErrorBody({
          code: "ALREADY_VOTED",
          message: "You have already voted on this poll",
          requestId,
        }),
        { status: 409, headers: { "x-request-id": requestId } },
      );
    }

    const response = NextResponse.json(
      { success: true },
      { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } },
    );

    response.cookies.set("voter_id", voterId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    track("poll_voted", { pollId });
    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        createApiErrorBody({
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          requestId,
          details: { fieldErrors: err.flatten().fieldErrors },
        }),
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }
    logError("polls.vote_failed", { requestId, pollId, error: formatError(err) });
    track("api_error", { code: "INTERNAL_ERROR", requestId, path: "/api/projects/polls/vote" });
    return NextResponse.json(
      createApiErrorBody({ code: "INTERNAL_ERROR", message: "Internal server error", requestId }),
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
