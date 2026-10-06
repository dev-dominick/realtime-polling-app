import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";
import { createApiErrorBody } from "./api-error";

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/**
 * Validates content-type, parses JSON, and runs Zod validation on a request body.
 * Returns parsed data on success or a ready-to-return error response on failure.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  requestId: string,
): Promise<ParseResult<T>> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: NextResponse.json(
        createApiErrorBody({
          code: "UNSUPPORTED_CONTENT_TYPE",
          message: "Unsupported content type",
          requestId,
        }),
        { status: 415, headers: { "x-request-id": requestId } },
      ),
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        createApiErrorBody({ code: "INVALID_JSON", message: "Invalid JSON payload", requestId }),
        { status: 400, headers: { "x-request-id": requestId } },
      ),
    };
  }

  let data: T;
  try {
    data = schema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        response: NextResponse.json(
          createApiErrorBody({
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            requestId,
            details: { fieldErrors: err.flatten().fieldErrors },
          }),
          { status: 400, headers: { "x-request-id": requestId } },
        ),
      };
    }
    throw err;
  }

  return { ok: true, data };
}
