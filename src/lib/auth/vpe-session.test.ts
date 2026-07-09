import { describe, expect, it } from "vitest";
import {
  VPE_SESSION_COOKIE,
  createVpeSessionValue,
  hashAccessCode,
  isValidVpeSession,
  normalizeAccessCode,
  parseVpeSessionValue,
} from "./vpe-session";

describe("vpe session helpers", () => {
  it("uses a stable cookie name", () => {
    expect(VPE_SESSION_COOKIE).toBe("tm_vpe_session");
  });

  it("normalizes access codes before hashing", () => {
    expect(normalizeAccessCode(" abcd-9f4k ")).toBe("ABCD9F4K");
    expect(hashAccessCode("abcd-9f4k")).toBe(hashAccessCode("ABCD9F4K"));
  });

  it("encodes and validates the session payload", () => {
    const sessionValue = createVpeSessionValue({
      vpeId: "vpe_1",
      accessCodeHash: hashAccessCode("ABCD-9F4K"),
    });

    expect(parseVpeSessionValue(sessionValue)).toEqual({
      vpeId: "vpe_1",
      accessCodeHash: hashAccessCode("ABCD-9F4K"),
    });
    expect(
      isValidVpeSession(sessionValue, {
        vpeId: "vpe_1",
        accessCodeHash: hashAccessCode("ABCD-9F4K"),
      }),
    ).toBe(true);
    expect(
      isValidVpeSession(sessionValue, {
        vpeId: "vpe_2",
        accessCodeHash: hashAccessCode("ABCD-9F4K"),
      }),
    ).toBe(false);
  });
});
