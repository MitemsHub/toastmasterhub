import { createHash, timingSafeEqual } from "node:crypto";

export const VPE_SESSION_COOKIE = "tm_vpe_session";

export type VpeSessionIdentity = {
  vpeId: string;
  accessCodeHash: string;
};

export function normalizeAccessCode(input: string) {
  return input.trim().replace(/[\s-]+/g, "").toUpperCase();
}

export function hashAccessCode(input: string) {
  return createHash("sha256").update(normalizeAccessCode(input)).digest("hex");
}

export function createVpeSessionValue(identity: VpeSessionIdentity) {
  return Buffer.from(JSON.stringify(identity), "utf8").toString("base64url");
}

export function parseVpeSessionValue(sessionValue: string) {
  try {
    const parsed = JSON.parse(Buffer.from(sessionValue, "base64url").toString("utf8"));

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.vpeId === "string" &&
      typeof parsed.accessCodeHash === "string"
    ) {
      return parsed as VpeSessionIdentity;
    }
  } catch {}

  return null;
}

export function isValidVpeSession(
  sessionValue: string,
  expectedIdentity: VpeSessionIdentity,
) {
  const parsed = parseVpeSessionValue(sessionValue);

  if (!parsed || parsed.vpeId !== expectedIdentity.vpeId) {
    return false;
  }

  const actualBuffer = Buffer.from(parsed.accessCodeHash);
  const expectedBuffer = Buffer.from(expectedIdentity.accessCodeHash);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}
