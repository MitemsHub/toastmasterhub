import { describe, expect, it } from "vitest";
import { createInvitationToken, hashInvitationToken } from "./token";

describe("createInvitationToken", () => {
  it("returns a plain token and a derived hash", async () => {
    const result = await createInvitationToken();

    expect(result.token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(result.tokenHash).toHaveLength(64);
    expect(result.token).not.toBe(result.tokenHash);
  });
});

describe("hashInvitationToken", () => {
  it("recreates the stored hash from a plain invitation token", async () => {
    const result = await createInvitationToken();

    expect(hashInvitationToken(result.token)).toBe(result.tokenHash);
  });
});
