import { UUID_RE } from "@/lib/utils/helpers";

export type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
};

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function resolveVoterIdentity(input: {
  cookieStore: CookieStoreLike | null;
  clientIp: string;
  userAgent: string;
  createRandomId?: () => string;
}) {
  const createRandomId = input.createRandomId ?? (() => crypto.randomUUID());
  const existing = input.cookieStore?.get("voter_id")?.value;

  const voterId =
    existing && UUID_RE.test(existing)
      ? existing
      : input.cookieStore
        ? createRandomId()
        : await sha256Hex(`anon:${input.clientIp}:${input.userAgent}`);

  const ipFingerprint = await sha256Hex(input.clientIp);

  return { voterId, ipFingerprint };
}
