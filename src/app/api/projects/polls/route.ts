import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, type TxSql } from "@/lib/db";
import { createApiErrorBody } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { formatError, logError } from "@/lib/log";
import { createPollSchema } from "@/features/polls";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const parsed = await parseJsonBody(request, createPollSchema, requestId);
    if (!parsed.ok) return parsed.response;
    const data = parsed.data;
    const sql = getDb();

    const poll = await sql.begin(async (tx: TxSql) => {
      const [created] = await tx`
        INSERT INTO polls (question)
        VALUES (${data.question})
        RETURNING id
      `;

      for (let i = 0; i < data.options.length; i++) {
        await tx`
          INSERT INTO poll_options (poll_id, label, position)
          VALUES (${created.id}, ${data.options[i]}, ${i})
        `;
      }

      return created;
    });

    return NextResponse.json(
      { success: true, id: poll.id },
      { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } },
    );
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
    logError("polls.create_failed", { requestId, error: formatError(err) });
    return NextResponse.json(
      createApiErrorBody({ code: "INTERNAL_ERROR", message: "Internal server error", requestId }),
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
