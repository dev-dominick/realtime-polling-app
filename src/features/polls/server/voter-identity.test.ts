import { describe, expect, it } from "vitest";
import { resolveVoterIdentity } from "./voter-identity";

describe("resolveVoterIdentity", () => {
  it("uses existing valid voter cookie when present", async () => {
    const voterId = "11111111-1111-4111-8111-111111111111";
    const cookieStore = {
      get: (name: string) => (name === "voter_id" ? { value: voterId } : undefined),
    };

    const identity = await resolveVoterIdentity({
      cookieStore,
      clientIp: "127.0.0.1",
      userAgent: "test-agent",
    });

    expect(identity.voterId).toBe(voterId);
    expect(identity.ipFingerprint).toHaveLength(64);
  });

  it("generates random voter id in request context when cookie missing", async () => {
    const identity = await resolveVoterIdentity({
      cookieStore: { get: () => undefined },
      clientIp: "127.0.0.2",
      userAgent: "test-agent",
      createRandomId: () => "22222222-2222-4222-8222-222222222222",
    });

    expect(identity.voterId).toBe("22222222-2222-4222-8222-222222222222");
    expect(identity.ipFingerprint).toHaveLength(64);
  });

  it("derives deterministic fallback voter id when request cookie context is unavailable", async () => {
    const first = await resolveVoterIdentity({
      cookieStore: null,
      clientIp: "127.0.0.9",
      userAgent: "integration-test",
    });
    const second = await resolveVoterIdentity({
      cookieStore: null,
      clientIp: "127.0.0.9",
      userAgent: "integration-test",
    });

    expect(first.voterId).toBe(second.voterId);
    expect(first.voterId).toHaveLength(64);
    expect(first.ipFingerprint).toBe(second.ipFingerprint);
  });

  it("does not share fallback identities across unrelated users", async () => {
    const first = await resolveVoterIdentity({
      cookieStore: null,
      clientIp: "127.0.0.10",
      userAgent: "ua-a",
    });
    const second = await resolveVoterIdentity({
      cookieStore: null,
      clientIp: "127.0.0.11",
      userAgent: "ua-b",
    });

    expect(first.voterId).not.toBe(second.voterId);
    expect(first.ipFingerprint).not.toBe(second.ipFingerprint);
  });
});
